"use server";

import { db } from "@/database";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth/main";
import { headers } from "next/headers";

// ============================================================================
// TYPES
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  address: string | null;
  profileImage: string | null;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileData {
  userId?: string; // Optional - for admins to update other users
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  profileImage?: string;
  role?: string;
  isActive?: boolean;
}

export interface UpdateSettingsData {
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

// ============================================================================
// PROFILE ACTIONS
// ============================================================================

/**
 * Get user profile
 */
export async function getUserProfile(
  userId?: string,
): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const targetUserId = userId || session.user.id;

    const user = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Remove sensitive data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      success: true,
      data: userWithoutPassword as UserProfile,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { success: false, error: "Failed to fetch profile" };
  }
}

/**
 * Update user profile (admin can update any user, users can update their own)
 */
export async function updateUserProfile(
  data: UpdateProfileData,
): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const targetUserId = data.userId || session.user.id;
    const isAdmin = session.user.role === "admin";

    // Check if user is admin or updating their own profile
    if (!isAdmin && targetUserId !== session.user.id) {
      return {
        success: false,
        error: "Forbidden: You can only update your own profile",
      };
    }

    // Build allowed updates
    let allowedUpdates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (isAdmin) {
      // Admins can update any field except password
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { userId, ...updates } = data;
      allowedUpdates = { ...updates, updatedAt: new Date() };

      // If admin is updating email, mark it as verified automatically
      if (updates.email) {
        allowedUpdates.emailVerified = true;
      }
    } else {
      // Regular users can update limited fields
      const allowedFields = ["name", "phone", "address", "profileImage"];
      Object.entries(data).forEach(([key, value]) => {
        if (allowedFields.includes(key) && value !== undefined) {
          allowedUpdates[key] = value;
        }
      });
    }

    // Remove undefined values
    Object.keys(allowedUpdates).forEach((key) => {
      if (allowedUpdates[key] === undefined) {
        delete allowedUpdates[key];
      }
    });

    await db
      .update(users)
      .set(allowedUpdates)
      .where(eq(users.id, targetUserId));

    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
    });

    if (!updatedUser) {
      return { success: false, error: "User not found after update" };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = updatedUser;

    return {
      success: true,
      data: userWithoutPassword as UserProfile,
    };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

// ============================================================================
// SETTINGS ACTIONS
// ============================================================================

/**
 * Update user settings (email, password)
 */
export async function updateUserSettings(
  data: UpdateSettingsData,
): Promise<{
  success: boolean;
  emailChanged?: boolean;
  passwordChanged?: boolean;
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    // Get current user
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    let emailChanged = false;
    let passwordChanged = false;

    // Update email if provided
    if (data.email && data.email !== user.email) {
      // Check if email already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, data.email),
      });

      if (existingUser) {
        return { success: false, error: "Email already in use" };
      }

      updates.email = data.email;
      updates.emailVerified = false; // Require re-verification
      emailChanged = true;
    }

    // Update password if provided
    if (data.newPassword) {
      if (!data.currentPassword) {
        return {
          success: false,
          error: "Current password is required to change password",
        };
      }

      // Verify current password
      if (!user.passwordHash) {
        return {
          success: false,
          error: "User does not have a password set",
        };
      }

      const isValidPassword = await bcrypt.compare(
        data.currentPassword,
        user.passwordHash,
      );

      if (!isValidPassword) {
        return {
          success: false,
          error: "Current password is incorrect",
        };
      }

      // Validate new password strength
      if (data.newPassword.length < 8) {
        return {
          success: false,
          error: "Password must be at least 8 characters long",
        };
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(data.newPassword, 10);
      updates.passwordHash = hashedPassword;
      passwordChanged = true;
    }

    // Update user if there are changes
    if (Object.keys(updates).length > 1) {
      // More than just updatedAt
      await db.update(users).set(updates).where(eq(users.id, session.user.id));

      return {
        success: true,
        emailChanged,
        passwordChanged,
      };
    }

    return {
      success: true,
      emailChanged: false,
      passwordChanged: false,
    };
  } catch (error) {
    console.error("Error updating settings:", error);
    return { success: false, error: "Failed to update settings" };
  }
}
