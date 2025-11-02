import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { teacherLeaves, users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { createNotification } from "@/lib/actions/notifications";

// GET - Get single leave request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const leave = await db
      .select({
        id: teacherLeaves.id,
        teacherId: teacherLeaves.teacherId,
        leaveType: teacherLeaves.leaveType,
        startDate: teacherLeaves.startDate,
        endDate: teacherLeaves.endDate,
        reason: teacherLeaves.reason,
        status: teacherLeaves.status,
        approvedBy: teacherLeaves.approvedBy,
        approvalNotes: teacherLeaves.approvalNotes,
        approvedAt: teacherLeaves.approvedAt,
        createdAt: teacherLeaves.createdAt,
        updatedAt: teacherLeaves.updatedAt,
        teacherName: users.name,
        teacherEmail: users.email,
      })
      .from(teacherLeaves)
      .leftJoin(users, eq(teacherLeaves.teacherId, users.id))
      .where(eq(teacherLeaves.id, id))
      .limit(1);

    if (!leave || leave.length === 0) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(leave[0]);
  } catch (error) {
    console.error("Error fetching leave request:", error);
    return NextResponse.json(
      { error: "Failed to fetch leave request" },
      { status: 500 },
    );
  }
}

// PUT - Update leave request (approve/reject by admin, cancel by teacher)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, approvedBy, approvalNotes } = body;

    // Validation
    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 },
      );
    }

    const updateData: {
      status: "pending" | "approved" | "rejected" | "cancelled";
      approvedBy?: string;
      approvalNotes?: string;
      approvedAt?: Date;
    } = {
      status,
    };

    // Add approval data if status is approved or rejected
    if (status === "approved" || status === "rejected") {
      if (!approvedBy) {
        return NextResponse.json(
          { error: "Approver ID is required" },
          { status: 400 },
        );
      }
      updateData.approvedBy = approvedBy;
      updateData.approvalNotes = approvalNotes || null;
      updateData.approvedAt = new Date();
    }

    const updated = await db
      .update(teacherLeaves)
      .set(updateData)
      .where(eq(teacherLeaves.id, id))
      .returning();

    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 },
      );
    }

    // Notify the teacher about the decision
    if (status === "approved" || status === "rejected") {
      await createNotification({
        type: status === "approved" ? "leave_approved" : "leave_rejected",
        title: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your ${updated[0].leaveType} leave request from ${updated[0].startDate} to ${updated[0].endDate} has been ${status}${approvalNotes ? `: ${approvalNotes}` : ""}`,
        recipientId: updated[0].teacherId,
        senderId: approvedBy,
        relatedId: updated[0].id,
        relatedType: "leave",
        priority: "high",
        actionUrl: `/teacher`,
      });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating leave request:", error);
    return NextResponse.json(
      { error: "Failed to update leave request" },
      { status: 500 },
    );
  }
}

// DELETE - Delete leave request (only if pending)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Check if leave is pending
    const leave = await db
      .select()
      .from(teacherLeaves)
      .where(eq(teacherLeaves.id, id))
      .limit(1);

    if (!leave || leave.length === 0) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 },
      );
    }

    if (leave[0].status !== "pending") {
      return NextResponse.json(
        { error: "Only pending leave requests can be deleted" },
        { status: 400 },
      );
    }

    await db.delete(teacherLeaves).where(eq(teacherLeaves.id, id));

    return NextResponse.json({ message: "Leave request deleted successfully" });
  } catch (error) {
    console.error("Error deleting leave request:", error);
    return NextResponse.json(
      { error: "Failed to delete leave request" },
      { status: 500 },
    );
  }
}
