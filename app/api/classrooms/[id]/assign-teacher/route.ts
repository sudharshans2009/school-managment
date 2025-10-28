import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { teacherAssignments } from "@/database/schema";
import { eq, and } from "drizzle-orm";

// POST /api/classrooms/[id]/assign-teacher - Assign teacher to classroom
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classroomId } = await params;
    const body = await request.json();
    const { teacherId, subjectId, isPrimary } = body;

    if (!teacherId || !subjectId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if assignment already exists
    const existing = await db.query.teacherAssignments.findFirst({
      where: and(
        eq(teacherAssignments.teacherId, teacherId),
        eq(teacherAssignments.classroomId, classroomId),
        eq(teacherAssignments.subjectId, subjectId)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Teacher already assigned to this subject in this classroom" },
        { status: 400 }
      );
    }

    // If this is a primary teacher, unset other primary teachers
    if (isPrimary) {
      await db
        .update(teacherAssignments)
        .set({ isPrimary: false })
        .where(eq(teacherAssignments.classroomId, classroomId));
    }

    const [assignment] = await db.insert(teacherAssignments).values({
      teacherId,
      classroomId,
      subjectId,
      isPrimary: isPrimary || false,
    }).returning();

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("Error assigning teacher:", error);
    return NextResponse.json(
      { error: "Failed to assign teacher" },
      { status: 500 }
    );
  }
}

// DELETE /api/classrooms/[id]/assign-teacher - Remove teacher assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // Validate params
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("assignmentId");

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID required" },
        { status: 400 }
      );
    }

    await db.delete(teacherAssignments).where(eq(teacherAssignments.id, assignmentId));

    return NextResponse.json({ message: "Teacher assignment removed successfully" });
  } catch (error) {
    console.error("Error removing teacher assignment:", error);
    return NextResponse.json(
      { error: "Failed to remove teacher assignment" },
      { status: 500 }
    );
  }
}
