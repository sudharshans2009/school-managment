/**
 * Authorization Middleware
 * Provides utilities for checking permissions in API routes
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  hasPermission,
  canAccessResource,
  Permission,
  ResourceType,
  ResourceAction,
} from "@/lib/permissions";
import { auditAccessDenied } from "@/lib/audit";
import { forbidden, unauthorized } from "next/navigation";

/**
 * Extended user type with role
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "teacher" | "student" | "parent";
  [key: string]: unknown;
}

/**
 * Get authenticated user from request
 */
export async function getAuthUser(
  request: NextRequest,
): Promise<AuthUser | null> {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return null;
    }

    const user = session.user as AuthUser;

    // Ensure role exists
    if (!user.role) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error getting auth user:", error);
    return null;
  }
}

/**
 * Require authentication - returns user or error response
 */
export async function requireAuth(
  request: NextRequest,
): Promise<{ user: AuthUser } | NextResponse> {
  const user = await getAuthUser(request);

  if (!user) {
    unauthorized();
  }

  return { user };
}

/**
 * Require specific role - returns user or error response
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: AuthUser["role"][],
): Promise<{ user: AuthUser } | NextResponse> {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  if (!allowedRoles.includes(user.role)) {
    // Audit the access denial
    await auditAccessDenied(
      user.id,
      user.email,
      user.role,
      "user",
      `role:${allowedRoles.join("|")}`,
      request,
    );

    forbidden();
  }

  return { user };
}

/**
 * Require specific permission - returns user or error response
 */
export async function requirePermission(
  request: NextRequest,
  permission: Permission,
): Promise<{ user: AuthUser } | NextResponse> {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  if (!hasPermission(user.role, permission)) {
    // Audit the access denial
    await auditAccessDenied(
      user.id,
      user.email,
      user.role,
      "user",
      permission,
      request,
    );

    forbidden();
  }

  return { user };
}

/**
 * Require resource access permission
 */
export async function requireResourceAccess(
  request: NextRequest,
  resource: ResourceType,
  action: ResourceAction,
): Promise<{ user: AuthUser } | NextResponse> {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  if (!canAccessResource(user.role, resource, action)) {
    // Audit the access denial
    await auditAccessDenied(
      user.id,
      user.email,
      user.role,
      resource as never,
      `${resource}:${action}`,
      request,
    );

    forbidden();
  }

  return { user };
}

/**
 * Check if user owns a resource (for student/parent viewing own data)
 */
export function isResourceOwner(
  user: AuthUser,
  resourceUserId: string | undefined,
): boolean {
  return user.id === resourceUserId;
}

/**
 * Require admin role - convenience function
 */
export async function requireAdmin(
  request: NextRequest,
): Promise<{ user: AuthUser } | NextResponse> {
  return requireRole(request, ["admin"]);
}

/**
 * Require admin or teacher role - convenience function
 */
export async function requireAdminOrTeacher(
  request: NextRequest,
): Promise<{ user: AuthUser } | NextResponse> {
  return requireRole(request, ["admin", "teacher"]);
}
