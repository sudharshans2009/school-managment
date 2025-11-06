/**
 * Audit Logging System
 * Tracks all important actions in the system for security and compliance
 */

import { db } from "@/database";
import { auditLogs } from "@/database/schema";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "view"
  | "export"
  | "login"
  | "logout"
  | "access_denied";

export type AuditResource =
  | "user"
  | "student"
  | "teacher"
  | "classroom"
  | "subject"
  | "homework"
  | "attendance"
  | "fee"
  | "announcement"
  | "event"
  | "meeting"
  | "circular"
  | "admission"
  | "report_card"
  | "behavior"
  | "medical_incident"
  | "disciplinary_action"
  | "backup"
  | "system_settings"
  | "audit_log";

export interface AuditLogEntry {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: entry.userId,
      userEmail: entry.userEmail,
      userRole: entry.userRole,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      description: entry.description,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
    });
  } catch (error) {
    // Log to console but don't throw - audit logging should not break the main flow
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Helper to extract IP and User Agent from Next.js request
 */
export function getRequestMetadata(request: Request): {
  ipAddress?: string;
  userAgent?: string;
} {
  const headers = request.headers;
  return {
    ipAddress:
      headers.get("x-forwarded-for") || headers.get("x-real-ip") || undefined,
    userAgent: headers.get("user-agent") || undefined,
  };
}

/**
 * Create audit log for user session
 */
export async function auditUserSession(
  userId: string,
  userEmail: string,
  userRole: string,
  action: "login" | "logout",
  request?: Request,
): Promise<void> {
  const metadata = request ? getRequestMetadata(request) : {};

  await createAuditLog({
    userId,
    userEmail,
    userRole,
    action,
    resource: "user",
    resourceId: userId,
    description: `User ${action}`,
    ...metadata,
  });
}

/**
 * Create audit log for resource access
 */
export async function auditResourceAccess(
  userId: string,
  userEmail: string,
  userRole: string,
  action: AuditAction,
  resource: AuditResource,
  resourceId?: string,
  description?: string,
  metadata?: Record<string, unknown>,
  request?: Request,
): Promise<void> {
  const requestMetadata = request ? getRequestMetadata(request) : {};

  await createAuditLog({
    userId,
    userEmail,
    userRole,
    action,
    resource,
    resourceId,
    description,
    metadata,
    ...requestMetadata,
  });
}

/**
 * Create audit log for denied access attempts
 */
export async function auditAccessDenied(
  userId: string | undefined,
  userEmail: string | undefined,
  userRole: string | undefined,
  resource: AuditResource,
  requiredPermission: string,
  request?: Request,
): Promise<void> {
  const requestMetadata = request ? getRequestMetadata(request) : {};

  await createAuditLog({
    userId,
    userEmail,
    userRole,
    action: "access_denied",
    resource,
    description: `Access denied - missing permission: ${requiredPermission}`,
    metadata: { requiredPermission },
    ...requestMetadata,
  });
}

/**
 * Create audit log for data export (GDPR)
 */
export async function auditDataExport(
  userId: string,
  userEmail: string,
  userRole: string,
  exportType: string,
  dataCategories: string[],
  request?: Request,
): Promise<void> {
  const requestMetadata = request ? getRequestMetadata(request) : {};

  await createAuditLog({
    userId,
    userEmail,
    userRole,
    action: "export",
    resource: "user",
    resourceId: userId,
    description: `Data export requested: ${exportType}`,
    metadata: { exportType, dataCategories },
    ...requestMetadata,
  });
}

/**
 * Create audit log for backup operations
 */
export async function auditBackup(
  userId: string,
  userEmail: string,
  userRole: string,
  backupType: string,
  backupId: string,
  request?: Request,
): Promise<void> {
  const requestMetadata = request ? getRequestMetadata(request) : {};

  await createAuditLog({
    userId,
    userEmail,
    userRole,
    action: "create",
    resource: "backup",
    resourceId: backupId,
    description: `Backup initiated: ${backupType}`,
    metadata: { backupType },
    ...requestMetadata,
  });
}
