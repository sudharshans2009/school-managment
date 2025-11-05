import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { exams, subjects, classrooms, studentGrades } from "@/database/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, count } from "drizzle-orm";
import { notFound, unauthorized } from "next/navigation";

// GET /api/exams/[id] - Get a single exam with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      unauthorized();
    }

    const { id } = await params;

    const [exam] = await db
      .select({
        id: exams.id,
        name: exams.name,
        examType: exams.examType,
        examDate: exams.examDate,
        totalMarks: exams.totalMarks,
        passingMarks: exams.passingMarks,
        duration: exams.duration,
        syllabus: exams.syllabus,
        instructions: exams.instructions,
        isFinalized: exams.isFinalized,
        academicYear: exams.academicYear,
        term: exams.term,
        finalizedAt: exams.finalizedAt,
        createdAt: exams.createdAt,
        subject: {
          id: subjects.id,
          name: subjects.name,
          code: subjects.code,
        },
        classroom: {
          id: classrooms.id,
          name: classrooms.name,
          grade: classrooms.grade,
          section: classrooms.section,
        },
      })
      .from(exams)
      .leftJoin(subjects, eq(exams.subjectId, subjects.id))
      .leftJoin(classrooms, eq(exams.classroomId, classrooms.id))
      .where(eq(exams.id, id));

    if (!exam) {
      notFound();
    }

    // Get grade statistics
    const [stats] = await db
      .select({
        totalGrades: count(),
      })
      .from(studentGrades)
      .where(eq(studentGrades.examId, id));

    return NextResponse.json({ ...exam, stats });
  } catch (error) {
    console.error("Error fetching exam:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam" },
      { status: 500 },
    );
  }
}

// PUT /api/exams/[id] - Update an exam (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      unauthorized();
    }

    const { id } = await params;
    const body = await request.json();

    const {
      name,
      examType,
      subjectId,
      classroomId,
      examDate,
      totalMarks,
      passingMarks,
      duration,
      syllabus,
      instructions,
      academicYear,
      term,
    } = body;

    const [updatedExam] = await db
      .update(exams)
      .set({
        ...(name && { name }),
        ...(examType && { examType }),
        ...(subjectId && { subjectId }),
        ...(classroomId && { classroomId }),
        ...(examDate && { examDate: new Date(examDate) }),
        ...(totalMarks !== undefined && { totalMarks }),
        ...(passingMarks !== undefined && { passingMarks }),
        ...(duration !== undefined && { duration }),
        ...(syllabus !== undefined && { syllabus }),
        ...(instructions !== undefined && { instructions }),
        ...(academicYear && { academicYear }),
        ...(term !== undefined && { term }),
        updatedAt: new Date(),
      })
      .where(eq(exams.id, id))
      .returning();

    if (!updatedExam) {
      notFound();
    }

    return NextResponse.json(updatedExam);
  } catch (error) {
    console.error("Error updating exam:", error);
    return NextResponse.json(
      { error: "Failed to update exam" },
      { status: 500 },
    );
  }
}

// DELETE /api/exams/[id] - Delete an exam (Admin only, only if no grades exist)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      unauthorized();
    }

    const { id } = await params;

    // Check if grades exist
    const [gradeCount] = await db
      .select({ count: count() })
      .from(studentGrades)
      .where(eq(studentGrades.examId, id));

    if (gradeCount.count > 0) {
      return NextResponse.json(
        { error: "Cannot delete exam with existing grades" },
        { status: 400 },
      );
    }

    await db.delete(exams).where(eq(exams.id, id));

    return NextResponse.json({ message: "Exam deleted successfully" });
  } catch (error) {
    console.error("Error deleting exam:", error);
    return NextResponse.json(
      { error: "Failed to delete exam" },
      { status: 500 },
    );
  }
}
