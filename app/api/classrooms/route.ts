import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { classrooms } from "@/database/schema";
import { generateClassroomCode, generateClassroomKey } from "@/lib/helpers";

// GET /api/classrooms - List all classrooms
export async function GET() {
  try {
    const allClassrooms = await db.query.classrooms.findMany({
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
      orderBy: (classrooms, { asc }) => [
        asc(classrooms.grade),
        asc(classrooms.section),
      ],
    });

    return NextResponse.json(allClassrooms);
  } catch (error) {
    console.error("Error fetching classrooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch classrooms" },
      { status: 500 },
    );
  }
}

// POST /api/classrooms - Create new classroom
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, grade, section, academicYear } = body;

    if (!name || !grade || !section || !academicYear) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const classroomCode = generateClassroomCode();
    const classroomKey = generateClassroomKey();

    const [newClassroom] = await db
      .insert(classrooms)
      .values({
        name,
        grade,
        section,
        classroomCode,
        classroomKey,
        currentStrength: 0,
        academicYear,
      })
      .returning();

    return NextResponse.json(newClassroom, { status: 201 });
  } catch (error) {
    console.error("Error creating classroom:", error);
    return NextResponse.json(
      { error: "Failed to create classroom" },
      { status: 500 },
    );
  }
}
