import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { users, classrooms, attendance } from "@/database/schema";
import { eq, count, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (
      !session?.user ||
      (session.user as { role?: string }).role !== "admin"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get total students
    const students = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "student"));

    // Get total teachers
    const teachers = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "teacher"));

    // Get active classrooms
    const activeClassrooms = await db
      .select({ count: count() })
      .from(classrooms)
      .where(eq(classrooms.isActive, true));

    // Calculate today's attendance rate
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    return NextResponse.json({
      totalStudents: students[0]?.count || 0,
      totalTeachers: teachers[0]?.count || 0,
      activeClassrooms: activeClassrooms[0]?.count || 0,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 },
    );
  }
}
