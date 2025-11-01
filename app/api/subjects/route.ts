import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { subjects } from "@/database/schema";
import { eq } from "drizzle-orm";

// GET /api/subjects - List all subjects
export async function GET() {
  try {
    const allSubjects = await db.query.subjects.findMany({
      orderBy: (subjects, { asc }) => [asc(subjects.name)],
      with: {
        teacherAssignments: {
          with: {
            teacher: true,
          },
        },
      },
    });

    return NextResponse.json(allSubjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 },
    );
  }
}

// POST /api/subjects - Create subject
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, description, applicableGrades, applicableSections } =
      body;

    if (!name || !code) {
      return NextResponse.json(
        { error: "Name and code are required" },
        { status: 400 },
      );
    }

    // Check if code already exists
    const existingSubject = await db.query.subjects.findFirst({
      where: eq(subjects.code, code),
    });

    if (existingSubject) {
      return NextResponse.json(
        { error: "Subject code already exists" },
        { status: 400 },
      );
    }

    const [newSubject] = await db
      .insert(subjects)
      .values({
        name,
        code,
        description: description || null,
        applicableGrades: applicableGrades
          ? JSON.stringify(applicableGrades)
          : null,
        applicableSections: applicableSections
          ? JSON.stringify(applicableSections)
          : null,
      })
      .returning();

    return NextResponse.json(newSubject, { status: 201 });
  } catch (error) {
    console.error("Error creating subject:", error);
    return NextResponse.json(
      { error: "Failed to create subject" },
      { status: 500 },
    );
  }
}
