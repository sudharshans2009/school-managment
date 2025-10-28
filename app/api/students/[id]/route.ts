import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { users, students, classrooms } from "@/database/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

// GET single student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const student = await db.query.students.findFirst({
      where: eq(students.id, id),
      with: {
        user: true,
        classroom: true,
        parent: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Failed to fetch student" },
      { status: 500 }
    );
  }
}

// PUT update student
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      email,
      phone,
      address,
      password,
      rollNumber,
      classroomId,
      dateOfBirth,
      bloodGroup,
      emergencyContact,
      medicalInfo,
    } = body;

    // Check if student exists
    const existingStudent = await db.query.students.findFirst({
      where: eq(students.id, id),
      with: { user: true },
    });

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const oldClassroomId = existingStudent.classroomId;

    // Update user data
    if (name || email || phone || address || password) {
      const userUpdateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (name) userUpdateData.name = name;
      if (phone) userUpdateData.phone = phone;
      if (address) userUpdateData.address = address;
      if (password) {
        userUpdateData.passwordHash = await bcrypt.hash(password, 10);
      }

      // Check if email is being changed and if it's already taken
      if (email && email !== existingStudent.user.email) {
        const emailExists = await db.query.users.findFirst({
          where: eq(users.email, email),
        });
        if (emailExists) {
          return NextResponse.json(
            { error: "Email already in use" },
            { status: 400 }
          );
        }
        userUpdateData.email = email;
      }

      await db
        .update(users)
        .set(userUpdateData)
        .where(eq(users.id, existingStudent.userId));
    }

    // Update student data
    const studentUpdateData: Record<string, unknown> = {};

    if (rollNumber) studentUpdateData.rollNumber = rollNumber;
    if (classroomId !== undefined) studentUpdateData.classroomId = classroomId;
    if (dateOfBirth) studentUpdateData.dateOfBirth = new Date(dateOfBirth);
    if (bloodGroup) studentUpdateData.bloodGroup = bloodGroup;
    if (emergencyContact) studentUpdateData.emergencyContact = emergencyContact;
    if (medicalInfo !== undefined) studentUpdateData.medicalInfo = medicalInfo;

    if (Object.keys(studentUpdateData).length > 0) {
      await db
        .update(students)
        .set(studentUpdateData)
        .where(eq(students.id, id));
    }

    // Update classroom strength if classroom changed
    if (classroomId !== undefined && classroomId !== oldClassroomId) {
      // Decrease old classroom strength
      if (oldClassroomId) {
        const oldClassroomStudents = await db.query.students.findMany({
          where: eq(students.classroomId, oldClassroomId),
        });
        await db
          .update(classrooms)
          .set({ currentStrength: oldClassroomStudents.length })
          .where(eq(classrooms.id, oldClassroomId));
      }

      // Increase new classroom strength
      if (classroomId) {
        const newClassroomStudents = await db.query.students.findMany({
          where: eq(students.classroomId, classroomId),
        });
        await db
          .update(classrooms)
          .set({ currentStrength: newClassroomStudents.length })
          .where(eq(classrooms.id, classroomId));
      }
    }

    // Fetch updated student
    const updatedStudent = await db.query.students.findFirst({
      where: eq(students.id, id),
      with: {
        user: true,
        classroom: true,
      },
    });

    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Failed to update student" },
      { status: 500 }
    );
  }
}

// DELETE student
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if student exists
    const existingStudent = await db.query.students.findFirst({
      where: eq(students.id, id),
    });

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const classroomId = existingStudent.classroomId;

    // Delete student (will also delete user due to cascade)
    await db.delete(students).where(eq(students.id, id));
    await db.delete(users).where(eq(users.id, existingStudent.userId));

    // Update classroom strength
    if (classroomId) {
      const remainingStudents = await db.query.students.findMany({
        where: eq(students.classroomId, classroomId),
      });
      await db
        .update(classrooms)
        .set({ currentStrength: remainingStudents.length })
        .where(eq(classrooms.id, classroomId));
    }

    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { error: "Failed to delete student" },
      { status: 500 }
    );
  }
}
