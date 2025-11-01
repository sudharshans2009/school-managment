import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { workDone, users, classrooms, subjects } from "@/database/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - Fetch work done records
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin and teacher can access work done records
    if (session.user.role !== "admin" && session.user.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden: Only admin and teachers can view work done records" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const classroomId = searchParams.get("classroomId");
    const subjectId = searchParams.get("subjectId");
    const teacherId = searchParams.get("teacherId");
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const isSubstitute = searchParams.get("isSubstitute");

    const conditions = [];

    if (classroomId) {
      conditions.push(eq(workDone.classroomId, classroomId));
    }

    if (subjectId) {
      conditions.push(eq(workDone.subjectId, subjectId));
    }

    if (teacherId) {
      conditions.push(eq(workDone.teacherId, teacherId));
    }

    if (date) {
      conditions.push(eq(workDone.date, date));
    }

    if (startDate) {
      conditions.push(gte(workDone.date, startDate));
    }

    if (endDate) {
      conditions.push(lte(workDone.date, endDate));
    }

    if (isSubstitute === 'true') {
      conditions.push(eq(workDone.isSubstitute, true));
    } else if (isSubstitute === 'false') {
      conditions.push(eq(workDone.isSubstitute, false));
    }

    const records = await db
      .select({
        id: workDone.id,
        classroomId: workDone.classroomId,
        subjectId: workDone.subjectId,
        teacherId: workDone.teacherId,
        date: workDone.date,
        periodNumber: workDone.periodNumber,
        topicsCovered: workDone.topicsCovered,
        homeworkAssigned: workDone.homeworkAssigned,
        remarks: workDone.remarks,
        isSubstitute: workDone.isSubstitute,
        substituteAssignmentId: workDone.substituteAssignmentId,
        createdAt: workDone.createdAt,
        updatedAt: workDone.updatedAt,
        teacherName: users.name,
        teacherEmail: users.email,
        classroomName: classrooms.name,
        classroomGrade: classrooms.grade,
        classroomSection: classrooms.section,
        subjectName: subjects.name,
        subjectCode: subjects.code,
      })
      .from(workDone)
      .leftJoin(users, eq(workDone.teacherId, users.id))
      .leftJoin(classrooms, eq(workDone.classroomId, classrooms.id))
      .leftJoin(subjects, eq(workDone.subjectId, subjects.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(workDone.date), desc(workDone.periodNumber));

    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching work done records:", error);
    return NextResponse.json({ error: "Failed to fetch work done records" }, { status: 500 });
  }
}

// POST - Create work done record (after period ends)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin and teacher can create work done records
    if (session.user.role !== "admin" && session.user.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden: Only admin and teachers can create work done records" }, { status: 403 });
    }

    const body = await request.json();
    const {
      classroomId,
      subjectId,
      teacherId,
      date,
      periodNumber,
      topicsCovered,
      homeworkAssigned,
      remarks,
      isSubstitute,
      substituteAssignmentId,
    } = body;

    // Validation
    if (!classroomId || !subjectId || !teacherId || !date || !periodNumber || !topicsCovered) {
      return NextResponse.json(
        { error: "Required fields: classroomId, subjectId, teacherId, date, periodNumber, topicsCovered" },
        { status: 400 }
      );
    }

    // Create work done record
    const newRecord = await db
      .insert(workDone)
      .values({
        classroomId,
        subjectId,
        teacherId,
        date,
        periodNumber,
        topicsCovered,
        homeworkAssigned: homeworkAssigned || null,
        remarks: remarks || null,
        isSubstitute: isSubstitute || false,
        substituteAssignmentId: substituteAssignmentId || null,
      })
      .returning();

    return NextResponse.json(newRecord[0], { status: 201 });
  } catch (error) {
    console.error("Error creating work done record:", error);
    return NextResponse.json({ error: "Failed to create work done record" }, { status: 500 });
  }
}
