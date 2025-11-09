/**
 * GDPR Data Deletion API
 * Allows users to request deletion of their personal data (Right to be Forgotten)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { dataDeletionRequests } from "@/database/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "@/lib/auth/middleware";
import { auditResourceAccess } from "@/lib/audit";

// GET - List deletion requests
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { user } = authResult;

  try {
    let requests;

    if (user.role === "admin") {
      // Admin can see all requests
      requests = await db
        .select()
        .from(dataDeletionRequests)
        .orderBy(desc(dataDeletionRequests.requestedAt))
        .limit(50);
    } else {
      // Users can only see their own requests
      requests = await db
        .select()
        .from(dataDeletionRequests)
        .where(eq(dataDeletionRequests.userId, user.id))
        .orderBy(desc(dataDeletionRequests.requestedAt))
        .limit(10);
    }

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error fetching deletion requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch deletion requests" },
      { status: 500 },
    );
  }
}

// POST - Request data deletion
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { user } = authResult;

  try {
    const body = await request.json();
    const { requestReason, anonymizeData = true } = body;

    // Create deletion request
    const [deletionRequest] = await db
      .insert(dataDeletionRequests)
      .values({
        userId: user.id,
        requestReason,
        anonymizeData,
        status: "pending",
      })
      .returning();

    // Audit the deletion request
    await auditResourceAccess(
      user.id,
      user.email,
      user.role,
      "delete",
      "user",
      user.id,
      "Data deletion requested",
      { requestReason, anonymizeData },
      request,
    );

    return NextResponse.json({
      message: "Data deletion request created successfully",
      requestId: deletionRequest.id,
      status: "pending",
      note: "Your request will be reviewed by an administrator. This process may take up to 30 days.",
    });
  } catch (error) {
    console.error("Error creating deletion request:", error);
    return NextResponse.json(
      { error: "Failed to create deletion request" },
      { status: 500 },
    );
  }
}

// PUT - Update deletion request status (Admin only)
export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { user } = authResult;

  try {
    const body = await request.json();
    const { requestId, status, reviewNotes } = body;

    if (!requestId || !status) {
      return NextResponse.json(
        { error: "requestId and status are required" },
        { status: 400 },
      );
    }

    // Update the request
    const [updatedRequest] = await db
      .update(dataDeletionRequests)
      .set({
        status,
        reviewedBy: user.id,
        reviewNotes,
        reviewedAt: new Date(),
        completedAt: status === "completed" ? new Date() : undefined,
      })
      .where(eq(dataDeletionRequests.id, requestId))
      .returning();

    if (!updatedRequest) {
      return NextResponse.json(
        { error: "Deletion request not found" },
        { status: 404 },
      );
    }

    // Audit the status update
    await auditResourceAccess(
      user.id,
      user.email,
      user.role,
      "update",
      "user",
      updatedRequest.userId,
      `Deletion request ${status}`,
      { requestId, status, reviewNotes },
      request,
    );

    // If approved, process the deletion
    if (status === "approved") {
      // In a real system, this would trigger a background job to anonymize/delete data
      // For now, we'll just mark it as processing
      await db
        .update(dataDeletionRequests)
        .set({ status: "processing" })
        .where(eq(dataDeletionRequests.id, requestId));
    }

    return NextResponse.json({
      message: "Deletion request updated successfully",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Error updating deletion request:", error);
    return NextResponse.json(
      { error: "Failed to update deletion request" },
      { status: 500 },
    );
  }
}
