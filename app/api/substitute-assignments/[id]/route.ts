import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import {
  substituteAssignments,
  users,
  classrooms,
  subjects,
} from "@/database/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

// GET - Get single substitute assignment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const assignment = await db
      .select({
        id: substituteAssignments.id,
        leaveId: substituteAssignments.leaveId,
        originalTeacherId: substituteAssignments.originalTeacherId,
        substituteTeacherId: substituteAssignments.substituteTeacherId,
        classroomId: substituteAssignments.classroomId,
        subjectId: substituteAssignments.subjectId,
        date: substituteAssignments.date,
        periodNumber: substituteAssignments.periodNumber,
        startTime: substituteAssignments.startTime,
        endTime: substituteAssignments.endTime,
        reason: substituteAssignments.reason,
        assignedBy: substituteAssignments.assignedBy,
        createdAt: substituteAssignments.createdAt,
        updatedAt: substituteAssignments.updatedAt,
        originalTeacherName: users.name,
        classroomName: classrooms.name,
        classroomGrade: classrooms.grade,
        classroomSection: classrooms.section,
        subjectName: subjects.name,
        subjectCode: subjects.code,
      })
      .from(substituteAssignments)
      .leftJoin(users, eq(substituteAssignments.originalTeacherId, users.id))
      .leftJoin(
        classrooms,
        eq(substituteAssignments.classroomId, classrooms.id),
      )
      .leftJoin(subjects, eq(substituteAssignments.subjectId, subjects.id))
      .where(eq(substituteAssignments.id, id))
      .limit(1);

    if (!assignment || assignment.length === 0) {
      notFound();
    }

    return NextResponse.json(assignment[0]);
  } catch (error) {
    console.error("Error fetching substitute assignment:", error);
    return NextResponse.json(
      { error: "Failed to fetch substitute assignment" },
      { status: 500 },
    );
  }
}

// PUT - Update substitute assignment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      substituteTeacherId,
      date,
      periodNumber,
      startTime,
      endTime,
      reason,
    } = body;

    const updateData: {
      substituteTeacherId?: string;
      date?: string;
      periodNumber?: number;
      startTime?: string;
      endTime?: string;
      reason?: string | null;
    } = {};

    if (substituteTeacherId)
      updateData.substituteTeacherId = substituteTeacherId;
    if (date) updateData.date = date;
    if (periodNumber) updateData.periodNumber = periodNumber;
    if (startTime) updateData.startTime = startTime;
    if (endTime) updateData.endTime = endTime;
    if (reason !== undefined) updateData.reason = reason;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    const updated = await db
      .update(substituteAssignments)
      .set(updateData)
      .where(eq(substituteAssignments.id, id))
      .returning();

    if (!updated || updated.length === 0) {
      notFound();
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating substitute assignment:", error);
    return NextResponse.json(
      { error: "Failed to update substitute assignment" },
      { status: 500 },
    );
  }
}

// DELETE - Delete substitute assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await db
      .delete(substituteAssignments)
      .where(eq(substituteAssignments.id, id));

    return NextResponse.json({
      message: "Substitute assignment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting substitute assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete substitute assignment" },
      { status: 500 },
    );
  }
}
