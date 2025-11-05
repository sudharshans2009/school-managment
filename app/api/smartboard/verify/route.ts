import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { classrooms } from "@/database/schema";
import { eq, and } from "drizzle-orm";
import { unauthorized } from "next/navigation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classroomId, classroomKey } = body;

    if (!classroomId || !classroomKey) {
      return NextResponse.json(
        { error: "Classroom ID and Key are required" },
        { status: 400 },
      );
    }

    // Verify classroom credentials
    const classroom = await db.query.classrooms.findFirst({
      where: and(
        eq(classrooms.id, classroomId),
        eq(classrooms.classroomKey, classroomKey),
      ),
      with: {
        teacherAssignments: {
          with: {
            teacher: true,
          },
        },
      },
    });

    if (!classroom) {
      unauthorized();
    }

    // Return classroom basic info
    return NextResponse.json({
      success: true,
      classroom: {
        id: classroom.id,
        name: classroom.name,
        grade: classroom.grade,
        section: classroom.section,
      },
    });
  } catch (error) {
    console.error("Error verifying smartboard credentials:", error);
    return NextResponse.json(
      { error: "Failed to verify credentials" },
      { status: 500 },
    );
  }
}
