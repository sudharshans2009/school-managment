import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { studentGrades, exams, subjects, students } from "@/database/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, desc } from "drizzle-orm";

// GET /api/students/grades - Get student's grades (finalized exams only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student record
    const [studentRecord] = await db
      .select()
      .from(students)
      .where(eq(students.userId, session.user.id));

    if (!studentRecord) {
      return NextResponse.json(
        { error: "Student record not found" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");
    const examType = searchParams.get("examType");

    // Build conditions
    const conditions = [
      eq(studentGrades.studentId, studentRecord.id),
      eq(exams.isFinalized, true), // Only show finalized exams
    ];

    if (subjectId) {
      conditions.push(eq(exams.subjectId, subjectId));
    }

    if (examType) {
      conditions.push(
        eq(
          exams.examType,
          examType as
            | "class_test"
            | "unit_test"
            | "quarterly"
            | "midterm"
            | "final_exam",
        ),
      );
    }

    const grades = await db
      .select({
        id: studentGrades.id,
        marksObtained: studentGrades.marksObtained,
        grade: studentGrades.grade,
        percentage: studentGrades.percentage,
        remarks: studentGrades.remarks,
        isAbsent: studentGrades.isAbsent,
        uploadedAt: studentGrades.uploadedAt,
        exam: {
          id: exams.id,
          name: exams.name,
          examType: exams.examType,
          examDate: exams.examDate,
          totalMarks: exams.totalMarks,
          passingMarks: exams.passingMarks,
          academicYear: exams.academicYear,
          term: exams.term,
        },
        subject: {
          id: subjects.id,
          name: subjects.name,
          code: subjects.code,
        },
      })
      .from(studentGrades)
      .innerJoin(exams, eq(studentGrades.examId, exams.id))
      .leftJoin(subjects, eq(exams.subjectId, subjects.id))
      .where(and(...conditions))
      .orderBy(desc(exams.examDate));

    return NextResponse.json(grades);
  } catch (error) {
    console.error("Error fetching student grades:", error);
    return NextResponse.json(
      { error: "Failed to fetch grades" },
      { status: 500 },
    );
  }
}
