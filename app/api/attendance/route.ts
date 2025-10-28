import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { attendance, students, users } from "@/database/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

// GET - Fetch attendance records
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const classroomId = searchParams.get("classroomId");
    const studentId = searchParams.get("studentId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!classroomId && !studentId) {
      return NextResponse.json(
        { error: "Either Classroom ID or Student ID is required" },
        { status: 400 }
      );
    }

    const conditions = [];

    if (classroomId) {
      conditions.push(eq(attendance.classroomId, classroomId));
    }

    if (studentId) {
      conditions.push(eq(attendance.studentId, studentId));
    }

    if (startDate) {
      conditions.push(gte(attendance.date, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(attendance.date, new Date(endDate)));
    }

    const attendanceRecords = await db
      .select({
        id: attendance.id,
        studentId: attendance.studentId,
        classroomId: attendance.classroomId,
        date: attendance.date,
        status: attendance.status,
        remarks: attendance.remarks,
        markedBy: attendance.markedBy,
        createdAt: attendance.createdAt,
        studentName: users.name,
        studentRollNumber: students.rollNumber,
      })
      .from(attendance)
      .leftJoin(students, eq(attendance.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(attendance.date));

    return NextResponse.json(attendanceRecords);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

// POST - Mark attendance for students
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { records, markedBy } = body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "Attendance records array is required" },
        { status: 400 }
      );
    }

    if (!markedBy) {
      return NextResponse.json({ error: "Teacher ID (markedBy) is required" }, { status: 400 });
    }

    // Insert multiple attendance records
    const attendanceData = records.map((record: {
      studentId: string;
      classroomId: string;
      status: 'present' | 'absent' | 'late' | 'excused';
      date?: Date;
      remarks?: string;
    }) => ({
      studentId: record.studentId,
      classroomId: record.classroomId,
      date: record.date || new Date(),
      status: record.status,
      remarks: record.remarks,
      markedBy,
    }));

    const newRecords = await db.insert(attendance).values(attendanceData).returning();

    return NextResponse.json(newRecords, { status: 201 });
  } catch (error) {
    console.error("Error marking attendance:", error);
    return NextResponse.json({ error: "Failed to mark attendance" }, { status: 500 });
  }
}
