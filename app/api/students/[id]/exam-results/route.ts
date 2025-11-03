import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { studentGrades, exams, subjects } from "@/database/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;

    // Get exam results for the student
    const results = await db
      .select({
        id: studentGrades.id,
        marksObtained: studentGrades.marksObtained,
        grade: studentGrades.grade,
        percentage: studentGrades.percentage,
        examName: exams.name,
        examDate: exams.examDate,
        totalMarks: exams.totalMarks,
        subjectName: subjects.name,
      })
      .from(studentGrades)
      .leftJoin(exams, eq(studentGrades.examId, exams.id))
      .leftJoin(subjects, eq(exams.subjectId, subjects.id))
      .where(eq(studentGrades.studentId, studentId))
      .orderBy(desc(exams.examDate));

    const formattedResults = results.map((result) => ({
      id: result.id,
      examName: result.examName || "Unknown Exam",
      subjectName: result.subjectName || "Unknown Subject",
      marksObtained: typeof result.marksObtained === 'string' 
        ? parseFloat(result.marksObtained) 
        : Number(result.marksObtained || 0),
      totalMarks: result.totalMarks || 0,
      percentage: typeof result.percentage === 'string'
        ? parseFloat(result.percentage)
        : Number(result.percentage || 0),
      grade: result.grade || "N/A",
      date: result.examDate ? result.examDate.toISOString() : "",
    }));

    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error("Error fetching exam results:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam results" },
      { status: 500 }
    );
  }
}
