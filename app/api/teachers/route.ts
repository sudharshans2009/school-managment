import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/helpers";

// GET /api/teachers - List all teachers
export async function GET() {
  try {
    const teachers = await db.query.users.findMany({
      where: eq(users.role, "teacher"),
      with: {
        teacherAssignments: {
          with: {
            classroom: true,
            subject: true,
          },
        },
      },
      orderBy: (users, { asc }) => [asc(users.name)],
    });

    return NextResponse.json(teachers);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    );
  }
}

// POST /api/teachers - Create new teacher
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, phone, address, password } = body;

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [newTeacher] = await db.insert(users).values({
      email,
      name,
      role: "teacher",
      passwordHash,
      phone,
      address,
      emailVerified: true,
      isActive: true,
    }).returning();

    // Remove password hash from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...teacherData } = newTeacher;

    return NextResponse.json(teacherData, { status: 201 });
  } catch (error) {
    console.error("Error creating teacher:", error);
    return NextResponse.json(
      { error: "Failed to create teacher" },
      { status: 500 }
    );
  }
}
