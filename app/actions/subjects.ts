"use server";

import { db } from "@/database";
import { subjects } from "@/database/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type SubjectFormData = {
  name: string;
  code: string;
  description?: string;
  applicableGrades?: string[];
  applicableSections?: string[];
};

export type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Get all subjects with their teacher assignments
 */
export async function getSubjects(): Promise<ActionResult> {
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

    return {
      success: true,
      data: allSubjects,
    };
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return {
      success: false,
      error: "Failed to fetch subjects",
    };
  }
}

/**
 * Get a single subject by ID
 */
export async function getSubjectById(id: string): Promise<ActionResult> {
  try {
    const subject = await db.query.subjects.findFirst({
      where: eq(subjects.id, id),
      with: {
        teacherAssignments: {
          with: {
            teacher: true,
          },
        },
      },
    });

    if (!subject) {
      return {
        success: false,
        error: "Subject not found",
      };
    }

    return {
      success: true,
      data: subject,
    };
  } catch (error) {
    console.error("Error fetching subject:", error);
    return {
      success: false,
      error: "Failed to fetch subject",
    };
  }
}

/**
 * Create a new subject
 */
export async function createSubject(data: SubjectFormData): Promise<ActionResult> {
  try {
    const { name, code, description, applicableGrades, applicableSections } = data;

    if (!name || !code) {
      return {
        success: false,
        error: "Name and code are required",
      };
    }

    // Check if code already exists
    const existingSubject = await db.query.subjects.findFirst({
      where: eq(subjects.code, code),
    });

    if (existingSubject) {
      return {
        success: false,
        error: "Subject code already exists",
      };
    }

    const [newSubject] = await db
      .insert(subjects)
      .values({
        name,
        code,
        description: description || null,
        // Note: Arrays stored as JSON strings to match existing schema.
        // For complex filtering needs, consider using a junction table or JSONB column type.
        applicableGrades: applicableGrades ? JSON.stringify(applicableGrades) : null,
        applicableSections: applicableSections ? JSON.stringify(applicableSections) : null,
      })
      .returning();

    // Revalidate the subjects page
    revalidatePath("/admin/subjects");

    return {
      success: true,
      data: newSubject,
    };
  } catch (error) {
    console.error("Error creating subject:", error);
    return {
      success: false,
      error: "Failed to create subject",
    };
  }
}

/**
 * Update an existing subject
 */
export async function updateSubject(
  id: string,
  data: SubjectFormData
): Promise<ActionResult> {
  try {
    const { name, code, description, applicableGrades, applicableSections } = data;

    if (!name || !code) {
      return {
        success: false,
        error: "Name and code are required",
      };
    }

    // Check if code already exists for a different subject
    const existingSubject = await db.query.subjects.findFirst({
      where: eq(subjects.code, code),
    });

    if (existingSubject && existingSubject.id !== id) {
      return {
        success: false,
        error: "Subject code already exists",
      };
    }

    const [updatedSubject] = await db
      .update(subjects)
      .set({
        name,
        code,
        description: description || null,
        applicableGrades: applicableGrades ? JSON.stringify(applicableGrades) : null,
        applicableSections: applicableSections ? JSON.stringify(applicableSections) : null,
      })
      .where(eq(subjects.id, id))
      .returning();

    if (!updatedSubject) {
      return {
        success: false,
        error: "Subject not found",
      };
    }

    // Revalidate the subjects page
    revalidatePath("/admin/subjects");

    return {
      success: true,
      data: updatedSubject,
    };
  } catch (error) {
    console.error("Error updating subject:", error);
    return {
      success: false,
      error: "Failed to update subject",
    };
  }
}

/**
 * Delete a subject
 */
export async function deleteSubject(id: string): Promise<ActionResult> {
  try {
    const [deletedSubject] = await db
      .delete(subjects)
      .where(eq(subjects.id, id))
      .returning();

    if (!deletedSubject) {
      return {
        success: false,
        error: "Subject not found",
      };
    }

    // Revalidate the subjects page
    revalidatePath("/admin/subjects");

    return {
      success: true,
      data: deletedSubject,
    };
  } catch (error) {
    console.error("Error deleting subject:", error);
    return {
      success: false,
      error: "Failed to delete subject",
    };
  }
}
