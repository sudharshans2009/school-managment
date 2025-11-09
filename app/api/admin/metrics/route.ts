import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import {
  attendance,
  homework,
  homeworkSubmissions,
  teacherAssignments,
  timetable,
} from "@/database/schema";
import { count, sql } from "drizzle-orm";
import { auth } from "@/lib/auth/main";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (
      !session?.user ||
      (session.user as { role?: string }).role !== "admin"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate attendance rate (today)
    const todayAttendance = await db
      .select({
        total: count(),
        present: sql<number>`count(*) filter (where ${attendance.status} = 'present')`,
      })
      .from(attendance)
      .where(sql`DATE(${attendance.date}) = DATE(${today.toISOString()})`);

    const attendanceRate =
      todayAttendance[0]?.total > 0
        ? (Number(todayAttendance[0].present) / todayAttendance[0].total) * 100
        : 0;

    // Calculate fee collection rate (placeholder - implement when fee system is ready)
    const feeCollectionRate = 87.3; // Mock data for now

    // Calculate homework completion rate
    const totalHomework = await db.select({ count: count() }).from(homework);

    const completedSubmissions = await db
      .select({ count: count() })
      .from(homeworkSubmissions)
      .where(sql`${homeworkSubmissions.status} IN ('submitted', 'graded')`);

    const homeworkCompletionRate =
      totalHomework[0]?.count > 0
        ? (completedSubmissions[0]?.count / totalHomework[0].count) * 100
        : 0;

    // Calculate teacher assignment rate
    const totalTimetableSlots = await db
      .select({ count: count() })
      .from(timetable);

    const assignedSlots = await db
      .select({ count: count() })
      .from(teacherAssignments);

    const teacherAssignmentRate =
      totalTimetableSlots[0]?.count > 0
        ? Math.min(
            100,
            (assignedSlots[0]?.count / totalTimetableSlots[0].count) * 100,
          )
        : 100;

    return NextResponse.json({
      attendanceRate: Math.round(attendanceRate * 10) / 10,
      feeCollectionRate: Math.round(feeCollectionRate * 10) / 10,
      homeworkCompletionRate: Math.round(homeworkCompletionRate * 10) / 10,
      teacherAssignmentRate: Math.round(teacherAssignmentRate * 10) / 10,
    });
  } catch (error) {
    console.error("Error fetching admin metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 },
    );
  }
}
