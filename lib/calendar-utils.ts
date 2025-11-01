import { db } from "@/database";
import { calendarDays } from "@/database/schema";
import { eq } from "drizzle-orm";
import { format, getDay } from "date-fns";

export interface DayConfiguration {
  date: string;
  isWorkingDay: boolean;
  isHoliday: boolean;
  isHalfDay: boolean;
  holidayFor: "all" | "students" | "teachers" | "office" | null;
  holidayName: string | null;
  timetableDayOfWeek: number; // 0-6, the day whose timetable to use
  actualDayOfWeek: number; // 0-6, the actual day of the week
  notes: string | null;
}

/**
 * Get the effective day configuration for a given date
 * Handles default behavior and custom configurations
 */
export async function getDayConfiguration(
  date: Date,
): Promise<DayConfiguration> {
  const dateStr = format(date, "yyyy-MM-dd");
  const actualDayOfWeek = getDay(date); // 0 = Sunday, 1 = Monday, etc.

  // Check for custom configuration
  const customConfig = await db
    .select()
    .from(calendarDays)
    .where(eq(calendarDays.date, dateStr))
    .limit(1);

  if (customConfig.length > 0) {
    const config = customConfig[0];

    return {
      date: dateStr,
      isWorkingDay: config.dayType === "working",
      isHoliday: config.dayType === "holiday",
      isHalfDay: config.dayDuration === "half",
      holidayFor: config.holidayFor,
      holidayName: config.holidayName,
      timetableDayOfWeek: config.customTimetable || actualDayOfWeek,
      actualDayOfWeek,
      notes: config.notes,
    };
  }

  // Default behavior: Mon-Sat working (1-6), Sunday holiday (0)
  const isWorkingDay = actualDayOfWeek >= 1 && actualDayOfWeek <= 6;

  return {
    date: dateStr,
    isWorkingDay,
    isHoliday: !isWorkingDay,
    isHalfDay: false,
    holidayFor: !isWorkingDay ? "all" : null,
    holidayName: !isWorkingDay ? "Sunday" : null,
    timetableDayOfWeek: actualDayOfWeek,
    actualDayOfWeek,
    notes: null,
  };
}

/**
 * Check if a specific user type should be working on a given date
 */
export async function isWorkingDayFor(
  date: Date,
  userType: "students" | "teachers" | "office",
): Promise<boolean> {
  const config = await getDayConfiguration(date);

  if (!config.isWorkingDay) {
    // It's marked as a holiday
    if (config.holidayFor === "all") return false;
    if (config.holidayFor === userType) return false;
    return true; // Holiday for others, but not for this user type
  }

  return true; // It's a working day
}

/**
 * Get the timetable day to use for a given date
 * Returns the day of week (0-6) whose timetable should be followed
 */
export async function getTimetableDay(date: Date): Promise<number> {
  const config = await getDayConfiguration(date);
  return config.timetableDayOfWeek;
}
