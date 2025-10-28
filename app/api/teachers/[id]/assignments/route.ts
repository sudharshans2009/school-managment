import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { teacherAssignments, classrooms, subjects } from "@/database/schema";
import { eq } from "drizzle-orm";

// GET - Fetch teacher assignments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const assignments = await db
      .select({
        id: teacherAssignments.id,
        classroomId: teacherAssignments.classroomId,
        isPrimary: teacherAssignments.isPrimary,
        classroom: {
          id: classrooms.id,
          name: classrooms.name,
          grade: classrooms.grade,
          section: classrooms.section,
          currentStrength: classrooms.currentStrength,
        },
        subject: {
          id: subjects.id,
          name: subjects.name,
          code: subjects.code,
        },
      })
      .from(teacherAssignments)
      .leftJoin(classrooms, eq(teacherAssignments.classroomId, classrooms.id))
      .leftJoin(subjects, eq(teacherAssignments.subjectId, subjects.id))
      .where(eq(teacherAssignments.teacherId, id));

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching teacher assignments:", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}
