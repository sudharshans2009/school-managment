import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import {
  teacherLeaves,
  timetable,
  substituteAssignments,
  users,
  classrooms,
  subjects,
} from "@/database/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

// GET - Get list of periods without teachers (due to approved leaves/duties) that need substitutes
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date =
      searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Get day of week for the date (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = new Date(date).getDay();

    // Step 1: Get all approved leaves that overlap with the given date
    const approvedLeaves = await db
      .select({
        teacherId: teacherLeaves.teacherId,
        startDate: teacherLeaves.startDate,
        endDate: teacherLeaves.endDate,
      })
      .from(teacherLeaves)
      .where(
        and(
          eq(teacherLeaves.status, "approved"),
          lte(teacherLeaves.startDate, date),
          gte(teacherLeaves.endDate, date),
        ),
      );

    const teachersOnLeave = approvedLeaves.map((leave) => leave.teacherId);

    if (teachersOnLeave.length === 0) {
      return NextResponse.json([]);
    }

    // Step 2: Get all timetable entries for teachers on leave for this day
    const affectedPeriods = await db
      .select({
        id: timetable.id,
        classroomId: timetable.classroomId,
        subjectId: timetable.subjectId,
        teacherId: timetable.teacherId,
        dayOfWeek: timetable.dayOfWeek,
        periodNumber: timetable.periodNumber,
        startTime: timetable.startTime,
        endTime: timetable.endTime,
        room: timetable.room,
        teacherName: users.name,
        teacherEmail: users.email,
        classroomName: classrooms.name,
        classroomGrade: classrooms.grade,
        classroomSection: classrooms.section,
        subjectName: subjects.name,
        subjectCode: subjects.code,
      })
      .from(timetable)
      .leftJoin(users, eq(timetable.teacherId, users.id))
      .leftJoin(classrooms, eq(timetable.classroomId, classrooms.id))
      .leftJoin(subjects, eq(timetable.subjectId, subjects.id))
      .where(
        and(
          eq(timetable.dayOfWeek, dayOfWeek),
          sql`${timetable.teacherId} = ANY(${teachersOnLeave})`,
          eq(timetable.isActive, true),
        ),
      );

    // Step 3: Get all substitute assignments already created for this date
    const existingAssignments = await db
      .select({
        classroomId: substituteAssignments.classroomId,
        periodNumber: substituteAssignments.periodNumber,
        originalTeacherId: substituteAssignments.originalTeacherId,
      })
      .from(substituteAssignments)
      .where(eq(substituteAssignments.date, date));

    // Step 4: Filter out periods that already have substitute assignments
    const unassignedPeriods = affectedPeriods.filter((period) => {
      return !existingAssignments.some(
        (assignment) =>
          assignment.classroomId === period.classroomId &&
          assignment.periodNumber === period.periodNumber &&
          assignment.originalTeacherId === period.teacherId,
      );
    });

    // Add the date to each unassigned period
    const periodsWithDate = unassignedPeriods.map((period) => ({
      ...period,
      date,
    }));

    return NextResponse.json(periodsWithDate);
  } catch (error) {
    console.error("Error fetching unassigned periods:", error);
    return NextResponse.json(
      { error: "Failed to fetch unassigned periods" },
      { status: 500 },
    );
  }
}
