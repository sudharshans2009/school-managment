import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { attendance } from "@/database/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: studentId } = await params;

    // Get attendance records for the student
    const attendanceRecords = await db
      .select({
        status: attendance.status,
      })
      .from(attendance)
      .where(eq(attendance.studentId, studentId));

    const totalDays = attendanceRecords.length;
    const present = attendanceRecords.filter(
      (r) => r.status === "present",
    ).length;
    const absent = attendanceRecords.filter(
      (r) => r.status === "absent",
    ).length;
    const late = attendanceRecords.filter((r) => r.status === "late").length;
    const excused = attendanceRecords.filter(
      (r) => r.status === "excused",
    ).length;

    const attendanceRate = totalDays > 0 ? (present / totalDays) * 100 : 0;

    return NextResponse.json({
      totalDays,
      present,
      absent,
      late,
      excused,
      attendanceRate,
    });
  } catch (error) {
    console.error("Error fetching attendance stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance stats" },
      { status: 500 },
    );
  }
}
