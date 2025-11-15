"use server";

import { db } from "@/database";
import { classrooms, teacherAssignments, students } from "@/database/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/main";
import { headers } from "next/headers";
import { generateClassroomCode, generateClassroomKey } from "@/lib/helpers";

export async function getAllClassrooms() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

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

    return { success: true, data: allClassrooms };
  } catch (error) {
    console.error("Error fetching classrooms:", error);
    return { success: false, error: "Failed to fetch classrooms" };
  }
}

export async function getClassroomById(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

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
      return { success: false, error: "Classroom not found" };
    }

    return { success: true, data: classroom };
  } catch (error) {
    console.error("Error fetching classroom:", error);
    return { success: false, error: "Failed to fetch classroom" };
  }
}

export async function createClassroom(data: {
  name: string;
  grade: string;
  section: string;
  academicYear?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const { name, grade, section, academicYear } = data;

    if (!name || !grade || !section) {
      return { success: false, error: "Missing required fields" };
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
        academicYear: academicYear || new Date().getFullYear().toString(),
      })
      .returning();

    return { success: true, data: newClassroom };
  } catch (error) {
    console.error("Error creating classroom:", error);
    return { success: false, error: "Failed to create classroom" };
  }
}

export async function updateClassroom(
  id: string,
  data: {
    name?: string;
    grade?: string;
    section?: string;
    capacity?: number;
    academicYear?: string;
    isActive?: boolean;
  },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const [updatedClassroom] = await db
      .update(classrooms)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(classrooms.id, id))
      .returning();

    if (!updatedClassroom) {
      return { success: false, error: "Classroom not found" };
    }

    return { success: true, data: updatedClassroom };
  } catch (error) {
    console.error("Error updating classroom:", error);
    return { success: false, error: "Failed to update classroom" };
  }
}

export async function deleteClassroom(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

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
      return { success: false, error: "Classroom not found" };
    }

    return { success: true, data: deletedClassroom };
  } catch (error) {
    console.error("Error deleting classroom:", error);
    return { success: false, error: "Failed to delete classroom" };
  }
}
