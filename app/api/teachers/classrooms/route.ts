import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { classrooms, teacherAssignments } from "@/database/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { unauthorized } from "next/navigation";

// GET - Fetch classrooms for a teacher
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user || session.user.role !== "teacher") {
      unauthorized();
    }

    const teacherClassrooms = await db
      .selectDistinct({
        id: classrooms.id,
        name: classrooms.name,
        grade: classrooms.grade,
        section: classrooms.section,
      })
      .from(teacherAssignments)
      .innerJoin(classrooms, eq(teacherAssignments.classroomId, classrooms.id))
      .where(eq(teacherAssignments.teacherId, session.user.id));

    return NextResponse.json(teacherClassrooms);
  } catch (error) {
    console.error("Error fetching teacher classrooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch classrooms" },
      { status: 500 },
    );
  }
}
