import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { reportCards } from "@/database/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

// GET - Fetch report cards
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("studentId");
    const classroomId = searchParams.get("classroomId");
    const academicYear = searchParams.get("academicYear");
    const term = searchParams.get("term");

    const conditions = [];

    if (studentId) {
      conditions.push(eq(reportCards.studentId, studentId));
    }

    if (classroomId) {
      conditions.push(eq(reportCards.classroomId, classroomId));
    }

    if (academicYear) {
      conditions.push(eq(reportCards.academicYear, academicYear));
    }

    if (term) {
      conditions.push(eq(reportCards.term, term));
    }

    const cards = await db
      .select({
        id: reportCards.id,
        studentId: reportCards.studentId,
        classroomId: reportCards.classroomId,
        academicYear: reportCards.academicYear,
        term: reportCards.term,
        totalMarks: reportCards.totalMarks,
        marksObtained: reportCards.marksObtained,
        percentage: reportCards.percentage,
        gpa: reportCards.gpa,
        grade: reportCards.grade,
        rank: reportCards.rank,
        attendance: reportCards.attendance,
        teacherRemarks: reportCards.teacherRemarks,
        principalRemarks: reportCards.principalRemarks,
        promotionStatus: reportCards.promotionStatus,
        isFinalized: reportCards.isFinalized,
        pdfUrl: reportCards.pdfUrl,
        generatedAt: reportCards.generatedAt,
      })
      .from(reportCards)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(reportCards.generatedAt));

    return NextResponse.json(cards);
  } catch (error) {
    console.error("Error fetching report cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch report cards" },
      { status: 500 },
    );
  }
}

// POST - Create/Generate report card (admin/teacher only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || !["admin", "teacher"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      studentId,
      classroomId,
      academicYear,
      term,
      totalMarks,
      marksObtained,
      percentage,
      gpa,
      grade,
      rank,
      attendance,
      teacherRemarks,
      principalRemarks,
      promotionStatus,
    } = body;

    if (
      !studentId ||
      !classroomId ||
      !academicYear ||
      !term ||
      totalMarks === undefined ||
      marksObtained === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Student ID, classroom ID, academic year, term, total marks, and marks obtained are required",
        },
        { status: 400 },
      );
    }

    const [reportCard] = await db
      .insert(reportCards)
      .values({
        studentId,
        classroomId,
        academicYear,
        term,
        totalMarks,
        marksObtained,
        percentage,
        gpa,
        grade,
        rank,
        attendance,
        teacherRemarks,
        principalRemarks,
        promotionStatus,
        generatedBy: session.user.id,
        isFinalized: false,
      })
      .returning();

    return NextResponse.json(reportCard, { status: 201 });
  } catch (error) {
    console.error("Error creating report card:", error);
    return NextResponse.json(
      { error: "Failed to create report card" },
      { status: 500 },
    );
  }
}
