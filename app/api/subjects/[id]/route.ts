import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import {
  subjects,
  timetable,
  homework,
  teacherAssignments,
} from "@/database/schema";
import { eq } from "drizzle-orm";

// GET single subject
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const subject = await db.query.subjects.findFirst({
      where: eq(subjects.id, id),
      with: {
        teacherAssignments: {
          with: {
            teacher: true,
            classroom: true,
          },
        },
      },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    return NextResponse.json(subject);
  } catch (error) {
    console.error("Error fetching subject:", error);
    return NextResponse.json(
      { error: "Failed to fetch subject" },
      { status: 500 },
    );
  }
}

// PUT update subject
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, code, description, applicableGrades, applicableSections } =
      body;

    // Check if subject exists
    const existingSubject = await db.query.subjects.findFirst({
      where: eq(subjects.id, id),
    });

    if (!existingSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Check if code is being changed and if it's already taken
    if (code && code !== existingSubject.code) {
      const codeExists = await db.query.subjects.findFirst({
        where: eq(subjects.code, code),
      });
      if (codeExists) {
        return NextResponse.json(
          { error: "Subject code already in use" },
          { status: 400 },
        );
      }
    }

    const updateData: Record<string, unknown> = {};

    if (name) updateData.name = name;
    if (code) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (applicableGrades !== undefined) {
      updateData.applicableGrades = applicableGrades
        ? JSON.stringify(applicableGrades)
        : null;
    }
    if (applicableSections !== undefined) {
      updateData.applicableSections = applicableSections
        ? JSON.stringify(applicableSections)
        : null;
    }

    const [updatedSubject] = await db
      .update(subjects)
      .set(updateData)
      .where(eq(subjects.id, id))
      .returning();

    return NextResponse.json(updatedSubject);
  } catch (error) {
    console.error("Error updating subject:", error);
    return NextResponse.json(
      { error: "Failed to update subject" },
      { status: 500 },
    );
  }
}

// DELETE subject
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Check if subject exists
    const existingSubject = await db.query.subjects.findFirst({
      where: eq(subjects.id, id),
    });

    if (!existingSubject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Delete related timetable entries first
    await db.delete(timetable).where(eq(timetable.subjectId, id));

    // Delete related homework
    await db.delete(homework).where(eq(homework.subjectId, id));

    // Delete teacher assignments
    await db
      .delete(teacherAssignments)
      .where(eq(teacherAssignments.subjectId, id));

    // Now delete the subject
    await db.delete(subjects).where(eq(subjects.id, id));

    return NextResponse.json({ message: "Subject deleted successfully" });
  } catch (error) {
    console.error("Error deleting subject:", error);
    return NextResponse.json(
      { error: "Failed to delete subject" },
      { status: 500 },
    );
  }
}
