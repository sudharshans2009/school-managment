import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { timetable } from "@/database/schema";
import { eq, and } from "drizzle-orm";

// GET /api/timetable - List timetable entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get("classroomId");

    let query;
    if (classroomId) {
      query = db.query.timetable.findMany({
        where: eq(timetable.classroomId, classroomId),
        with: {
          classroom: true,
          subject: true,
          teacher: true,
        },
        orderBy: (timetable, { asc }) => [
          asc(timetable.dayOfWeek),
          asc(timetable.startTime),
        ],
      });
    } else {
      query = db.query.timetable.findMany({
        with: {
          classroom: true,
          subject: true,
          teacher: true,
        },
        orderBy: (timetable, { asc }) => [
          asc(timetable.dayOfWeek),
          asc(timetable.startTime),
        ],
      });
    }

    const entries = await query;
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching timetable:", error);
    return NextResponse.json(
      { error: "Failed to fetch timetable" },
      { status: 500 },
    );
  }
}

// POST /api/timetable - Create timetable entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      classroomId,
      subjectId,
      teacherId,
      dayOfWeek,
      periodNumber,
      startTime,
      endTime,
      room,
      sessionType,
    } = body;

    if (
      !classroomId ||
      !subjectId ||
      !teacherId ||
      dayOfWeek === undefined ||
      periodNumber === undefined ||
      !startTime ||
      !endTime
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check for time conflicts
    const existing = await db.query.timetable.findFirst({
      where: and(
        eq(timetable.classroomId, classroomId),
        eq(timetable.dayOfWeek, dayOfWeek),
        eq(timetable.periodNumber, periodNumber),
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Period slot already occupied" },
        { status: 400 },
      );
    }

    const [newEntry] = await db
      .insert(timetable)
      .values({
        classroomId,
        subjectId,
        teacherId,
        dayOfWeek,
        periodNumber,
        startTime,
        endTime,
        room,
        sessionType: sessionType || "regular",
      })
      .returning();

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error("Error creating timetable entry:", error);
    return NextResponse.json(
      { error: "Failed to create timetable entry" },
      { status: 500 },
    );
  }
}
