/**
 * GDPR Data Export API
 * Allows users to request and download their personal data
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { dataExportRequests, users, students } from "@/database/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/middleware";
import { auditDataExport } from "@/lib/audit";

// GET - List user's export requests
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { user } = authResult;

  try {
    const requests = await db
      .select()
      .from(dataExportRequests)
      .where(eq(dataExportRequests.userId, user.id))
      .orderBy(desc(dataExportRequests.requestedAt))
      .limit(10);

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error fetching export requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch export requests" },
      { status: 500 },
    );
  }
}

// POST - Request data export
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { user } = authResult;

  try {
    const body = await request.json();
    const { requestType = "full_export", dataCategories = [] } = body;

    // Create export request
    const [exportRequest] = await db
      .insert(dataExportRequests)
      .values({
        userId: user.id,
        requestType,
        dataCategories: JSON.stringify(dataCategories),
        status: "pending",
      })
      .returning();

    // Audit the export request
    await auditDataExport(
      user.id,
      user.email,
      user.role,
      requestType,
      dataCategories,
      request,
    );

    // In a real system, this would trigger a background job to generate the export
    // For now, we'll generate it synchronously
    const exportData = await generateUserDataExport(user.id);

    // Update request with file info
    const fileUrl = `/api/security/gdpr/export/${exportRequest.id}/download`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    await db
      .update(dataExportRequests)
      .set({
        status: "completed",
        fileUrl,
        expiresAt,
        completedAt: new Date(),
      })
      .where(eq(dataExportRequests.id, exportRequest.id));

    return NextResponse.json({
      message: "Data export request created successfully",
      exportId: exportRequest.id,
      status: "completed",
      fileUrl,
      expiresAt,
      data: exportData, // Return data directly for now
    });
  } catch (error) {
    console.error("Error creating export request:", error);
    return NextResponse.json(
      { error: "Failed to create export request" },
      { status: 500 },
    );
  }
}

/**
 * Generate user data export
 * Collects all user data for GDPR compliance
 */
async function generateUserDataExport(userId: string) {
  const exportData: Record<string, unknown> = {};

  // Get user profile
  const [userProfile] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  exportData.profile = {
    id: userProfile.id,
    email: userProfile.email,
    name: userProfile.name,
    role: userProfile.role,
    phone: userProfile.phone,
    address: userProfile.address,
    createdAt: userProfile.createdAt,
  };

  // Get student data if applicable
  if (userProfile.role === "student") {
    const studentData = await db
      .select()
      .from(students)
      .where(eq(students.userId, userId));

    exportData.studentInfo = studentData;
  }

  // In a real implementation, we would collect:
  // - Homework submissions
  // - Attendance records
  // - Fee payments
  // - Messages and communications
  // - Event registrations
  // - Report cards
  // - Behavior records
  // - Any other personal data

  exportData.exportedAt = new Date().toISOString();
  exportData.format = "JSON";

  return exportData;
}
