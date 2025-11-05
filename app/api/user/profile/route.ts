import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/database";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { forbidden, notFound, unauthorized } from "next/navigation";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      unauthorized();
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      notFound();
    }

    // Remove sensitive data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      unauthorized();
    }

    const body = await request.json();
    const { userId, ...updates } = body;

    // Check if user is admin or updating their own profile
    const isAdmin = session.user.role === "admin";
    const targetUserId = userId || session.user.id;

    if (!isAdmin && targetUserId !== session.user.id) {
      forbidden();
    }

    // Non-admins can only update limited fields
    let allowedUpdates: Record<string, unknown> = {};

    if (isAdmin) {
      // Admins can update any field except password (use separate endpoint)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...adminUpdates } = updates;
      allowedUpdates = { ...adminUpdates, updatedAt: new Date() };

      // If admin is updating email, mark it as verified automatically
      if (adminUpdates.email) {
        allowedUpdates.emailVerified = true;
      }
    } else {
      // Regular users can't update via this endpoint (they're view-only)
      forbidden();
    }

    await db
      .update(users)
      .set(allowedUpdates)
      .where(eq(users.id, targetUserId));

    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
    });

    if (!updatedUser) {
      notFound();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      message: "Profile updated successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
