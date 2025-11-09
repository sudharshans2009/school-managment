import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { meetingSlots, users } from "@/database/schema";
import { eq, and, gte } from "drizzle-orm";
import { auth } from "@/lib/auth/main";

// GET - Fetch meeting slots with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const teacherId = searchParams.get("teacherId");
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");

    const conditions = [eq(meetingSlots.isActive, true)];

    if (teacherId) {
      conditions.push(eq(meetingSlots.teacherId, teacherId));
    }

    if (date) {
      conditions.push(eq(meetingSlots.date, date));
    } else if (startDate) {
      conditions.push(gte(meetingSlots.date, startDate));
    }

    const slots = await db
      .select({
        id: meetingSlots.id,
        teacherId: meetingSlots.teacherId,
        teacherName: users.name,
        date: meetingSlots.date,
        startTime: meetingSlots.startTime,
        endTime: meetingSlots.endTime,
        duration: meetingSlots.duration,
        location: meetingSlots.location,
        maxBookings: meetingSlots.maxBookings,
        currentBookings: meetingSlots.currentBookings,
        isActive: meetingSlots.isActive,
        createdAt: meetingSlots.createdAt,
      })
      .from(meetingSlots)
      .leftJoin(users, eq(meetingSlots.teacherId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return NextResponse.json(slots);
  } catch (error) {
    console.error("Error fetching meeting slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting slots" },
      { status: 500 },
    );
  }
}

// POST - Create meeting slots (teachers only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || !["admin", "teacher"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date, startTime, endTime, duration, location, maxBookings } = body;

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Date, start time, and end time are required" },
        { status: 400 },
      );
    }

    const [slot] = await db
      .insert(meetingSlots)
      .values({
        teacherId: session.user.id,
        date,
        startTime,
        endTime,
        duration: duration || 15,
        location,
        maxBookings: maxBookings || 1,
        currentBookings: 0,
        isActive: true,
      })
      .returning();

    return NextResponse.json(slot, { status: 201 });
  } catch (error) {
    console.error("Error creating meeting slot:", error);
    return NextResponse.json(
      { error: "Failed to create meeting slot" },
      { status: 500 },
    );
  }
}
