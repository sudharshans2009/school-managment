"use server";

import { db } from "@/database";
import { calendarDays } from "@/database/schema";
import { eq, gte, lte, and } from "drizzle-orm";
import { auth } from "@/lib/auth/main";
import { headers } from "next/headers";

export interface CalendarDay {
  id: string;
  date: string;
  dayType: "working" | "holiday";
  dayDuration: "full" | "half";
  holidayFor: "all" | "students" | "teachers" | "office" | null;
  holidayName: string | null;
  customTimetable: number | null;
  notes: string | null;
}

export async function getCalendarDays(params?: {
  startDate?: string;
  endDate?: string;
  date?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (params?.date) {
      // Fetch single date
      const days = await db
        .select()
        .from(calendarDays)
        .where(eq(calendarDays.date, params.date));
      return { success: true, data: days[0] || null };
    } else if (params?.startDate && params?.endDate) {
      // Fetch range
      const days = await db
        .select()
        .from(calendarDays)
        .where(
          and(
            gte(calendarDays.date, params.startDate),
            lte(calendarDays.date, params.endDate),
          ),
        );
      return { success: true, data: days };
    } else {
      // Fetch all
      const days = await db.select().from(calendarDays);
      return { success: true, data: days };
    }
  } catch (error) {
    console.error("Error fetching calendar days:", error);
    return { success: false, error: "Failed to fetch calendar days" };
  }
}

export async function saveCalendarDay(data: {
  date: string;
  dayType: "working" | "holiday";
  dayDuration: "full" | "half";
  holidayFor?: "all" | "students" | "teachers" | "office" | null;
  holidayName?: string | null;
  customTimetable?: number | null;
  notes?: string | null;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const {
      date,
      dayType,
      dayDuration,
      holidayFor,
      holidayName,
      customTimetable,
      notes,
    } = data;

    if (!date || !dayType || !dayDuration) {
      return {
        success: false,
        error: "Date, dayType, and dayDuration are required",
      };
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

      return { success: true, data: updated };
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

      return { success: true, data: created };
    }
  } catch (error) {
    console.error("Error creating/updating calendar day:", error);
    return { success: false, error: "Failed to create/update calendar day" };
  }
}

export async function deleteCalendarDay(date: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    if (!date) {
      return { success: false, error: "Date is required" };
    }

    await db.delete(calendarDays).where(eq(calendarDays.date, date));

    return { success: true, data: null };
  } catch (error) {
    console.error("Error deleting calendar day:", error);
    return { success: false, error: "Failed to delete calendar day" };
  }
}
