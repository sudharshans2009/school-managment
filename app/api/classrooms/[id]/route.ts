import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { classrooms, teacherAssignments, students } from "@/database/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

// GET /api/classrooms/[id] - Get classroom details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const classroom = await db.query.classrooms.findFirst({
      where: eq(classrooms.id, id),
      with: {
        teacherAssignments: {
          with: {
            teacher: true,
            subject: true,
          },
        },
        students: {
          with: {
            user: true,
          },
        },
      },
    });

    if (!classroom) {
      notFound();
    }

    return NextResponse.json(classroom);
  } catch (error) {
    console.error("Error fetching classroom:", error);
    return NextResponse.json(
      { error: "Failed to fetch classroom" },
      { status: 500 },
    );
  }
}

// PUT /api/classrooms/[id] - Update classroom
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, grade, section, capacity, academicYear, isActive } = body;

    const [updatedClassroom] = await db
      .update(classrooms)
      .set({
        name,
        grade,
        section,
        capacity,
        academicYear,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(classrooms.id, id))
      .returning();

    if (!updatedClassroom) {
      notFound();
    }

    return NextResponse.json(updatedClassroom);
  } catch (error) {
    console.error("Error updating classroom:", error);
    return NextResponse.json(
      { error: "Failed to update classroom" },
      { status: 500 },
    );
  }
}

// DELETE /api/classrooms/[id] - Delete classroom
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Delete related records first
    await db
      .delete(teacherAssignments)
      .where(eq(teacherAssignments.classroomId, id));
    await db.delete(students).where(eq(students.classroomId, id));

    const [deletedClassroom] = await db
      .delete(classrooms)
      .where(eq(classrooms.id, id))
      .returning();

    if (!deletedClassroom) {
      notFound();
    }

    return NextResponse.json({ message: "Classroom deleted successfully" });
  } catch (error) {
    console.error("Error deleting classroom:", error);
    return NextResponse.json(
      { error: "Failed to delete classroom" },
      { status: 500 },
    );
  }
}
