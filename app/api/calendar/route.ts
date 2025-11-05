import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { calendarDays } from "@/database/schema";
import { eq, gte, lte, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { unauthorized } from "next/navigation";

// GET /api/calendar - Fetch calendar days with optional date range
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get("startDate"); // YYYY-MM-DD
    const endDate = searchParams.get("endDate"); // YYYY-MM-DD
    const date = searchParams.get("date"); // Single date YYYY-MM-DD

    if (date) {
      // Fetch single date
      const days = await db
        .select()
        .from(calendarDays)
        .where(eq(calendarDays.date, date));
      return NextResponse.json(days[0] || null);
    } else if (startDate && endDate) {
      // Fetch range
      const days = await db
        .select()
        .from(calendarDays)
        .where(
          and(
            gte(calendarDays.date, startDate),
            lte(calendarDays.date, endDate),
          ),
        );
      return NextResponse.json(days);
    } else {
      // Fetch all
      const days = await db.select().from(calendarDays);
      return NextResponse.json(days);
    }
  } catch (error) {
    console.error("Error fetching calendar days:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar days" },
      { status: 500 },
    );
  }
}

// POST /api/calendar - Create or update calendar day
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user || session.user.role !== "admin") {
      unauthorized();
    }

    const body = await req.json();
    const {
      date,
      dayType,
      dayDuration,
      holidayFor,
      holidayName,
      customTimetable,
      notes,
    } = body;

    if (!date || !dayType || !dayDuration) {
      return NextResponse.json(
        { error: "Date, dayType, and dayDuration are required" },
        { status: 400 },
      );
    }

    // Check if day already exists
    const existing = await db
      .select()
      .from(calendarDays)
      .where(eq(calendarDays.date, date));

    if (existing.length > 0) {
      // Update existing
      const [updated] = await db
        .update(calendarDays)
        .set({
          dayType,
          dayDuration,
          holidayFor: dayType === "holiday" ? holidayFor : null,
          holidayName: dayType === "holiday" ? holidayName : null,
          customTimetable,
          notes,
          updatedAt: new Date(),
        })
        .where(eq(calendarDays.date, date))
        .returning();

      return NextResponse.json(updated);
    } else {
      // Create new
      const [created] = await db
        .insert(calendarDays)
        .values({
          date,
          dayType,
          dayDuration,
          holidayFor: dayType === "holiday" ? holidayFor : null,
          holidayName: dayType === "holiday" ? holidayName : null,
          customTimetable,
          notes,
          createdBy: session.user.id,
        })
        .returning();

      return NextResponse.json(created);
    }
  } catch (error) {
    console.error("Error creating/updating calendar day:", error);
    return NextResponse.json(
      { error: "Failed to create/update calendar day" },
      { status: 500 },
    );
  }
}

// DELETE /api/calendar - Reset day to default (delete custom config)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user || session.user.role !== "admin") {
      unauthorized();
    }

    const searchParams = req.nextUrl.searchParams;
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    await db.delete(calendarDays).where(eq(calendarDays.date, date));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting calendar day:", error);
    return NextResponse.json(
      { error: "Failed to delete calendar day" },
      { status: 500 },
    );
  }
}
