/**
 * Audit Logs API
 * Admin-only endpoint to view audit logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database';
import { auditLogs } from '@/database/schema';
import { desc, and, gte, lte, eq, ilike, or } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-middleware';
import { auditResourceAccess } from '@/lib/audit';

export async function GET(request: NextRequest) {
  // Require admin access
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { user } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    
    // Query parameters for filtering
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search'); // Search in description and email
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = (page - 1) * limit;

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
          ilike(auditLogs.userEmail, `%${search}%`)
        )
      );
    }

    // Query audit logs
    const logs = await db
      .select()
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset);

    // Audit this access
    await auditResourceAccess(
      user.id,
      user.email,
      user.role,
      'view',
      'audit_log',
      undefined,
      'Viewed audit logs',
      { filters: { userId, action, resource, startDate, endDate, search } },
      request
    );

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        hasMore: logs.length === limit,
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
