"use server";

import { db } from "@/database";
import { classrooms } from "@/database/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

export type ClassroomFormData = {
  name: string;
  grade: string;
  section: string;
  capacity?: number;
  academicYear: string;
};

export type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Generate a unique classroom code and key
 */
function generateClassroomCredentials() {
  const code = nanoid(6).toUpperCase();
  const key = nanoid(16);
  return { code, key };
}

/**
 * Get all classrooms with their students and teacher assignments
 */
export async function getClassrooms(): Promise<ActionResult> {
  try {
    const allClassrooms = await db.query.classrooms.findMany({
      orderBy: (classrooms, { asc }) => [asc(classrooms.grade), asc(classrooms.section)],
      with: {
        students: {
          with: {
            user: true,
          },
        },
        teacherAssignments: {
          with: {
            teacher: true,
            subject: true,
          },
        },
      },
    });

    return {
      success: true,
      data: allClassrooms,
    };
  } catch (error) {
    console.error("Error fetching classrooms:", error);
    return {
      success: false,
      error: "Failed to fetch classrooms",
    };
  }
}

/**
 * Get a single classroom by ID
 */
export async function getClassroomById(id: string): Promise<ActionResult> {
  try {
    const classroom = await db.query.classrooms.findFirst({
      where: eq(classrooms.id, id),
      with: {
        students: {
          with: {
            user: true,
          },
        },
        teacherAssignments: {
          with: {
            teacher: true,
            subject: true,
          },
        },
      },
    });

    if (!classroom) {
      return {
        success: false,
        error: "Classroom not found",
      };
    }

    return {
      success: true,
      data: classroom,
    };
  } catch (error) {
    console.error("Error fetching classroom:", error);
    return {
      success: false,
      error: "Failed to fetch classroom",
    };
  }
}

/**
 * Create a new classroom
 */
export async function createClassroom(data: ClassroomFormData): Promise<ActionResult> {
  try {
    const { name, grade, section, capacity = 30, academicYear } = data;

    if (!name || !grade || !section || !academicYear) {
      return {
        success: false,
        error: "Name, grade, section, and academic year are required",
      };
    }

    // Check if classroom already exists for this grade-section combination
    const existingClassroom = await db.query.classrooms.findFirst({
      where: (classrooms, { and, eq }) =>
        and(
          eq(classrooms.grade, grade),
          eq(classrooms.section, section),
          eq(classrooms.academicYear, academicYear)
        ),
    });

    if (existingClassroom) {
      return {
        success: false,
        error: `Classroom already exists for Grade ${grade} Section ${section} in ${academicYear}`,
      };
    }

    // Generate unique code and key
    const { code, key } = generateClassroomCredentials();

    const [newClassroom] = await db
      .insert(classrooms)
      .values({
        name,
        grade,
        section,
        classroomCode: code,
        classroomKey: key,
        capacity,
        currentStrength: 0,
        academicYear,
        isActive: true,
      })
      .returning();

    // Revalidate the classrooms page
    revalidatePath("/admin/classrooms");

    return {
      success: true,
      data: newClassroom,
    };
  } catch (error) {
    console.error("Error creating classroom:", error);
    return {
      success: false,
      error: "Failed to create classroom",
    };
  }
}

/**
 * Update an existing classroom
 */
export async function updateClassroom(
  id: string,
  data: ClassroomFormData
): Promise<ActionResult> {
  try {
    const { name, grade, section, capacity = 30, academicYear } = data;

    if (!name || !grade || !section || !academicYear) {
      return {
        success: false,
        error: "Name, grade, section, and academic year are required",
      };
    }

    // Check if another classroom exists with same grade-section-year combination
    const existingClassroom = await db.query.classrooms.findFirst({
      where: (classrooms, { and, eq, not }) =>
        and(
          not(eq(classrooms.id, id)),
          eq(classrooms.grade, grade),
          eq(classrooms.section, section),
          eq(classrooms.academicYear, academicYear)
        ),
    });

    if (existingClassroom) {
      return {
        success: false,
        error: `Another classroom already exists for Grade ${grade} Section ${section} in ${academicYear}`,
      };
    }

    const [updatedClassroom] = await db
      .update(classrooms)
      .set({
        name,
        grade,
        section,
        capacity,
        academicYear,
      })
      .where(eq(classrooms.id, id))
      .returning();

    if (!updatedClassroom) {
      return {
        success: false,
        error: "Classroom not found",
      };
    }

    // Revalidate the classrooms page
    revalidatePath("/admin/classrooms");
    revalidatePath(`/admin/classrooms/${id}`);

    return {
      success: true,
      data: updatedClassroom,
    };
  } catch (error) {
    console.error("Error updating classroom:", error);
    return {
      success: false,
      error: "Failed to update classroom",
    };
  }
}

/**
 * Delete a classroom
 */
export async function deleteClassroom(id: string): Promise<ActionResult> {
  try {
    // Check if classroom has students
    const classroom = await db.query.classrooms.findFirst({
      where: eq(classrooms.id, id),
      with: {
        students: true,
      },
    });

    if (!classroom) {
      return {
        success: false,
        error: "Classroom not found",
      };
    }

    if (classroom.students && classroom.students.length > 0) {
      return {
        success: false,
        error: "Cannot delete classroom with enrolled students. Please transfer students first.",
      };
    }

    const [deletedClassroom] = await db
      .delete(classrooms)
      .where(eq(classrooms.id, id))
      .returning();

    // Revalidate the classrooms page
    revalidatePath("/admin/classrooms");

    return {
      success: true,
      data: deletedClassroom,
    };
  } catch (error) {
    console.error("Error deleting classroom:", error);
    return {
      success: false,
      error: "Failed to delete classroom",
    };
  }
}

/**
 * Toggle classroom active status
 */
export async function toggleClassroomStatus(id: string): Promise<ActionResult> {
  try {
    const classroom = await db.query.classrooms.findFirst({
      where: eq(classrooms.id, id),
    });

    if (!classroom) {
      return {
        success: false,
        error: "Classroom not found",
      };
    }

    const [updatedClassroom] = await db
      .update(classrooms)
      .set({
        isActive: !classroom.isActive,
      })
      .where(eq(classrooms.id, id))
      .returning();

    // Revalidate the classrooms page
    revalidatePath("/admin/classrooms");
    revalidatePath(`/admin/classrooms/${id}`);

    return {
      success: true,
      data: updatedClassroom,
    };
  } catch (error) {
    console.error("Error toggling classroom status:", error);
    return {
      success: false,
      error: "Failed to toggle classroom status",
    };
  }
}

/**
 * Regenerate classroom credentials (code and key)
 */
export async function regenerateClassroomCredentials(id: string): Promise<ActionResult> {
  try {
    const classroom = await db.query.classrooms.findFirst({
      where: eq(classrooms.id, id),
    });

    if (!classroom) {
      return {
        success: false,
        error: "Classroom not found",
      };
    }

    const { code, key } = generateClassroomCredentials();

    const [updatedClassroom] = await db
      .update(classrooms)
      .set({
        classroomCode: code,
        classroomKey: key,
      })
      .where(eq(classrooms.id, id))
      .returning();

    // Revalidate the classrooms page
    revalidatePath("/admin/classrooms");
    revalidatePath(`/admin/classrooms/${id}`);

    return {
      success: true,
      data: updatedClassroom,
    };
  } catch (error) {
    console.error("Error regenerating classroom credentials:", error);
    return {
      success: false,
      error: "Failed to regenerate classroom credentials",
    };
  }
}
