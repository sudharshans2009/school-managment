import { NextRequest, NextResponse } from "next/server";
import { getDayConfiguration, isWorkingDayFor } from "@/lib/calendar-utils";

// GET /api/calendar/check - Check if a date is a working day
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const dateStr = searchParams.get("date"); // YYYY-MM-DD
    const userType = searchParams.get("userType") as "students" | "teachers" | "office" | null;

    if (!dateStr) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    const config = await getDayConfiguration(date);

    if (userType) {
      const isWorking = await isWorkingDayFor(date, userType);
      return NextResponse.json({
        ...config,
        isWorkingForUserType: isWorking,
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error checking calendar day:", error);
    return NextResponse.json(
      { error: "Failed to check calendar day" },
      { status: 500 }
    );
  }
}
