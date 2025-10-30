import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { users, students } from "@/database/schema";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { students: studentData } = body;

    if (!studentData || !Array.isArray(studentData)) {
      return NextResponse.json(
        { error: "Invalid data format. Expected array of students." },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const student of studentData) {
      try {
        const {
          name,
          email,
          password,
          phone,
          address,
          rollNumber,
          classroomId,
          bloodGroup,
          dateOfBirth,
          guardianName,
          guardianPhone,
          guardianEmail,
        } = student;

        // Validate required fields
        if (!name || !email || !password) {
          results.failed++;
          results.errors.push(`Missing required fields for ${email || "unknown"}`);
          continue;
        }

        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.email, email),
        });

        if (existingUser) {
          results.failed++;
          results.errors.push(`User with email ${email} already exists`);
          continue;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const [newUser] = await db
          .insert(users)
          .values({
            name,
            email,
            role: "student",
            passwordHash,
            phone: phone || null,
            address: address || null,
            emailVerified: true,
            isActive: true,
          })
          .returning();

        // Create student record
        await db.insert(students).values({
          userId: newUser.id,
          rollNumber: rollNumber || null,
          classroomId: classroomId || null,
          bloodGroup: bloodGroup || null,
          ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
          guardianName: guardianName || null,
          guardianPhone: guardianPhone || null,
          guardianEmail: guardianEmail || null,
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Error creating student ${student.email}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return NextResponse.json({
      message: `Bulk upload completed. ${results.success} students created, ${results.failed} failed.`,
      ...results,
    });
  } catch (error) {
    console.error("Error in bulk student upload:", error);
    return NextResponse.json(
      { error: "Failed to process bulk upload" },
      { status: 500 }
    );
  }
}
