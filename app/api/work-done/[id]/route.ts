import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { workDone, users, classrooms, subjects } from "@/database/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { forbidden, notFound, unauthorized } from "next/navigation";

// GET - Get single work done record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      unauthorized();
    }

    // Only admin and teacher can access work done records
    if (session.user.role !== "admin" && session.user.role !== "teacher") {
      forbidden();
    }

    const { id } = await params;

    const record = await db
      .select({
        id: workDone.id,
        classroomId: workDone.classroomId,
        subjectId: workDone.subjectId,
        teacherId: workDone.teacherId,
        date: workDone.date,
        periodNumber: workDone.periodNumber,
        topicsCovered: workDone.topicsCovered,
        homeworkAssigned: workDone.homeworkAssigned,
        remarks: workDone.remarks,
        isSubstitute: workDone.isSubstitute,
        substituteAssignmentId: workDone.substituteAssignmentId,
        createdAt: workDone.createdAt,
        updatedAt: workDone.updatedAt,
        teacherName: users.name,
        teacherEmail: users.email,
        classroomName: classrooms.name,
        classroomGrade: classrooms.grade,
        classroomSection: classrooms.section,
        subjectName: subjects.name,
        subjectCode: subjects.code,
      })
      .from(workDone)
      .leftJoin(users, eq(workDone.teacherId, users.id))
      .leftJoin(classrooms, eq(workDone.classroomId, classrooms.id))
      .leftJoin(subjects, eq(workDone.subjectId, subjects.id))
      .where(eq(workDone.id, id))
      .limit(1);

    if (!record || record.length === 0) {
      notFound();
    }

    return NextResponse.json(record[0]);
  } catch (error) {
    console.error("Error fetching work done record:", error);
    return NextResponse.json(
      { error: "Failed to fetch work done record" },
      { status: 500 },
    );
  }
}

// PUT - Update work done record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      unauthorized();
    }

    // Only admin and teacher can update work done records
    if (session.user.role !== "admin" && session.user.role !== "teacher") {
      forbidden();
    }

    const { id } = await params;
    const body = await request.json();
    const { topicsCovered, homeworkAssigned, remarks } = body;

    const updateData: {
      topicsCovered?: string;
      homeworkAssigned?: string | null;
      remarks?: string | null;
    } = {};

    if (topicsCovered) updateData.topicsCovered = topicsCovered;
    if (homeworkAssigned !== undefined)
      updateData.homeworkAssigned = homeworkAssigned;
    if (remarks !== undefined) updateData.remarks = remarks;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    const updated = await db
      .update(workDone)
      .set(updateData)
      .where(eq(workDone.id, id))
      .returning();

    if (!updated || updated.length === 0) {
      notFound();
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating work done record:", error);
    return NextResponse.json(
      { error: "Failed to update work done record" },
      { status: 500 },
    );
  }
}

// DELETE - Delete work done record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      unauthorized();
    }

    // Only admin and teacher can delete work done records
    if (session.user.role !== "admin" && session.user.role !== "teacher") {
      forbidden();
    }

    const { id } = await params;

    await db.delete(workDone).where(eq(workDone.id, id));

    return NextResponse.json({
      message: "Work done record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting work done record:", error);
    return NextResponse.json(
      { error: "Failed to delete work done record" },
      { status: 500 },
    );
  }
}
