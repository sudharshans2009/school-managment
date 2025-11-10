"use server";

import { db } from "@/database";
import { auditLogs } from "@/database/schema";
import { desc, and, gte, lte, eq, ilike, or } from "drizzle-orm";
import { auth } from "@/lib/auth/main";
import { headers } from "next/headers";
import { auditResourceAccess } from "@/lib/audit";

export interface AuditLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  description: string | null;
  metadata: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
}

export interface AuditLogsParams {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getAuditLogs(params?: AuditLogsParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const {
      userId,
      action,
      resource,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50,
    } = params || {};

    const actualLimit = Math.min(limit, 100);
    const offset = (page - 1) * actualLimit;

    // Build where conditions
    const conditions = [];

    if (userId) {
      conditions.push(eq(auditLogs.userId, userId));
    }

    if (action) {
      conditions.push(eq(auditLogs.action, action));
    }

    if (resource) {
      conditions.push(eq(auditLogs.resource, resource));
    }

    if (startDate) {
      conditions.push(gte(auditLogs.timestamp, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(auditLogs.timestamp, new Date(endDate)));
    }

    if (search) {
      conditions.push(
        or(
          ilike(auditLogs.description, `%${search}%`),
          ilike(auditLogs.userEmail, `%${search}%`),
        ),
      );
    }

    // Query audit logs
    const logs = await db
      .select()
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.timestamp))
      .limit(actualLimit)
      .offset(offset);

    // Audit this access
    const headersList = await headers();
    await auditResourceAccess(
      session.user.id,
      session.user.email,
      session.user.role,
      "view",
      "audit_log",
      undefined,
      "Viewed audit logs",
      { filters: { userId, action, resource, startDate, endDate, search } },
      { headers: headersList } as Request,
    );

    return {
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit: actualLimit,
          hasMore: logs.length === actualLimit,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return { success: false, error: "Failed to fetch audit logs" };
  }
}
