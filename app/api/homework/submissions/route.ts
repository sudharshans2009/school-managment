import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import {
  homework,
  homeworkSubmissions,
  students,
  subjects,
  users,
} from "@/database/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

// GET - Fetch homework submissions for a teacher
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (
      !session?.user ||
      (session.user.role !== "teacher" && session.user.role !== "admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const homeworkId = searchParams.get("homeworkId");
    const classroomId = searchParams.get("classroomId");
    const studentId = searchParams.get("studentId");

    if (!homeworkId && !classroomId) {
      return NextResponse.json(
        { error: "Either homeworkId or classroomId is required" },
        { status: 400 },
      );
    }

    // If fetching by homeworkId
    if (homeworkId) {
      const submissions = await db
        .select({
          id: homeworkSubmissions.id,
          homeworkId: homeworkSubmissions.homeworkId,
          studentId: homeworkSubmissions.studentId,
          submissionText: homeworkSubmissions.submissionText,
          submittedAt: homeworkSubmissions.submittedAt,
          marksObtained: homeworkSubmissions.marksObtained,
          feedback: homeworkSubmissions.feedback,
          gradedAt: homeworkSubmissions.gradedAt,
          status: homeworkSubmissions.status,
          studentName: users.name,
          studentRollNumber: students.rollNumber,
          homeworkTitle: homework.title,
          totalMarks: homework.totalMarks,
        })
        .from(homeworkSubmissions)
        .innerJoin(students, eq(homeworkSubmissions.studentId, students.id))
        .innerJoin(users, eq(students.userId, users.id))
        .innerJoin(homework, eq(homeworkSubmissions.homeworkId, homework.id))
        .where(eq(homeworkSubmissions.homeworkId, homeworkId))
        .orderBy(desc(homeworkSubmissions.submittedAt));

      return NextResponse.json(submissions);
    }

    // If fetching by classroomId - get all submissions for teacher's subjects in that classroom
    const teacherHomeworks = await db
      .select({
        id: homework.id,
      })
      .from(homework)
      .where(
        and(
          eq(homework.classroomId, classroomId!),
          session.user.role === "teacher"
            ? eq(homework.teacherId, session.user.id)
            : undefined,
        ),
      );

    const homeworkIds = teacherHomeworks.map((h) => h.id);

    if (homeworkIds.length === 0) {
      return NextResponse.json([]);
    }

    const submissions = await db
      .select({
        id: homeworkSubmissions.id,
        homeworkId: homeworkSubmissions.homeworkId,
        studentId: homeworkSubmissions.studentId,
        submissionText: homeworkSubmissions.submissionText,
        submittedAt: homeworkSubmissions.submittedAt,
        marksObtained: homeworkSubmissions.marksObtained,
        feedback: homeworkSubmissions.feedback,
        gradedAt: homeworkSubmissions.gradedAt,
        status: homeworkSubmissions.status,
        studentName: users.name,
        studentRollNumber: students.rollNumber,
        homeworkTitle: homework.title,
        subjectName: subjects.name,
        totalMarks: homework.totalMarks,
        dueDate: homework.dueDate,
      })
      .from(homeworkSubmissions)
      .innerJoin(students, eq(homeworkSubmissions.studentId, students.id))
      .innerJoin(users, eq(students.userId, users.id))
      .innerJoin(homework, eq(homeworkSubmissions.homeworkId, homework.id))
      .innerJoin(subjects, eq(homework.subjectId, subjects.id))
      .where(
        studentId ? eq(homeworkSubmissions.studentId, studentId) : undefined,
      )
      .orderBy(desc(homeworkSubmissions.submittedAt));

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Error fetching homework submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 },
    );
  }
}

// POST - Mark homework as submitted (physical submission)
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { homeworkId, studentId, submissionText } = body;

    if (!homeworkId || !studentId) {
      return NextResponse.json(
        { error: "homeworkId and studentId are required" },
        { status: 400 },
      );
    }

    // Verify teacher has access to this homework
    const homeworkRecord = await db
      .select()
      .from(homework)
      .where(eq(homework.id, homeworkId))
      .limit(1);

    if (homeworkRecord.length === 0) {
      return NextResponse.json(
        { error: "Homework not found" },
        { status: 404 },
      );
    }

    if (homeworkRecord[0].teacherId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to mark this homework" },
        { status: 403 },
      );
    }

    // Check if submission already exists
    const existing = await db
      .select()
      .from(homeworkSubmissions)
      .where(
        and(
          eq(homeworkSubmissions.homeworkId, homeworkId),
          eq(homeworkSubmissions.studentId, studentId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Submission already exists" },
        { status: 400 },
      );
    }

    // Create submission
    const [submission] = await db
      .insert(homeworkSubmissions)
      .values({
        homeworkId,
        studentId,
        submissionText: submissionText || "Physical submission received",
        status: "submitted",
        submittedAt: new Date(),
      })
      .returning();

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json(
      { error: "Failed to create submission" },
      { status: 500 },
    );
  }
}
