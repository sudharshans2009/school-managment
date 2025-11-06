import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { users, students, classrooms } from "@/database/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/helpers";

// GET /api/students - List all students
export async function GET() {
  try {
    const allStudents = await db.query.students.findMany({
      with: {
        user: true,
        classroom: true,
      },
      orderBy: (students, { asc }) => [asc(students.rollNumber)],
    });

    return NextResponse.json(allStudents);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 },
    );
  }
}

// POST /api/students - Create new student
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      name,
      phone,
      address,
      password,
      classroomId,
      rollNumber,
      admissionNumber,
      dateOfBirth,
      bloodGroup,
      house,
      admissionDate,
    } = body;

    if (
      !email ||
      !name ||
      !password ||
      !rollNumber ||
      !admissionNumber ||
      !dateOfBirth
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if email already exists
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        name,
        role: "student",
        passwordHash,
        phone,
        address,
        emailVerified: true,
        isActive: true,
      })
      .returning();

    // Create student record
    const [newStudent] = await db
      .insert(students)
      .values({
        userId: newUser.id,
        classroomId: classroomId || null,
        rollNumber,
        admissionNumber,
        dateOfBirth: new Date(dateOfBirth),
        bloodGroup,
        house: house || null,
        admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
      })
      .returning();

    // Update classroom strength if assigned
    if (classroomId) {
      await db
        .update(classrooms)
        .set({
          currentStrength: (
            await db.query.students.findMany({
              where: eq(students.classroomId, classroomId),
            })
          ).length,
        })
        .where(eq(classrooms.id, classroomId));
    }

    // Fetch complete student data
    const studentData = await db.query.students.findFirst({
      where: eq(students.id, newStudent.id),
      with: {
        user: true,
        classroom: true,
      },
    });

    return NextResponse.json(studentData, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 },
    );
  }
}
