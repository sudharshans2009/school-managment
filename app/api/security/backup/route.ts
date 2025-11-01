/**
 * System Backup API
 * Admin-only endpoint to manage system backups
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database';
import { systemBackups, users, students, classrooms, homework, attendance } from '@/database/schema';
import { desc, eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-middleware';
import { auditBackup } from '@/lib/audit';

// GET - List backups
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const backups = await db
      .select()
      .from(systemBackups)
      .orderBy(desc(systemBackups.startedAt))
      .limit(50);

    return NextResponse.json({ backups });
  } catch (error) {
    console.error('Error fetching backups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backups' },
      { status: 500 }
    );
  }
}

// POST - Create backup
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { user } = authResult;

  try {
    const body = await request.json();
    const { backupType = 'manual' } = body;

    // Create backup record
    const [backup] = await db
      .insert(systemBackups)
      .values({
        backupType,
        status: 'in_progress',
        createdBy: user.id,
      })
      .returning();

    // Audit the backup
    await auditBackup(
      user.id,
      user.email,
      user.role,
      backupType,
      backup.id,
      request
    );

    // Generate backup data
    try {
      const backupData = await generateBackupData();
      
      // In a real system, this would be saved to cloud storage
      // For now, we'll just calculate size and create metadata
      const backupJson = JSON.stringify(backupData, null, 2);
      const fileSizeKB = Buffer.byteLength(backupJson, 'utf8') / 1024;
      const fileSize = fileSizeKB > 1024 
        ? `${(fileSizeKB / 1024).toFixed(2)} MB` 
        : `${fileSizeKB.toFixed(2)} KB`;

      // Update backup record
      await db
        .update(systemBackups)
        .set({
          status: 'completed',
          fileSize,
          location: `/backups/${backup.id}.json`,
          metadata: JSON.stringify({
            tables: Object.keys(backupData),
            recordCounts: Object.entries(backupData).reduce((acc, [table, records]) => {
              acc[table] = Array.isArray(records) ? records.length : 0;
              return acc;
            }, {} as Record<string, number>),
          }),
          completedAt: new Date(),
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        })
        .where(eq(systemBackups.id, backup.id));

      return NextResponse.json({
        message: 'Backup created successfully',
        backupId: backup.id,
        fileSize,
        data: backupData, // Return data directly for now
      });
    } catch (error) {
      // Update backup as failed
      await db
        .update(systemBackups)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        })
        .where(eq(systemBackups.id, backup.id));

      throw error;
    }
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}

/**
 * Generate backup data
 * In a real system, this would be more sophisticated and potentially run as a background job
 */
async function generateBackupData() {
  const backupData: Record<string, unknown[]> = {};

  // Backup core tables
  backupData.users = await db.select().from(users);
  backupData.students = await db.select().from(students);
  backupData.classrooms = await db.select().from(classrooms);
  backupData.homework = await db.select().from(homework);
  backupData.attendance = await db.select().from(attendance);

  // In a real implementation, we would backup all tables
  // and potentially compress the data

  return backupData;
}
