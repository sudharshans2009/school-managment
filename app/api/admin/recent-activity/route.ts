import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import {
  users,
  homework,
  teacherAssignments,
  teacherLeaves,
  students,
} from "@/database/schema";
import { desc, sql } from "drizzle-orm";
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

    const activities: Array<{
      id: string;
      type: string;
      action: string;
      detail: string;
      time: string;
    }> = [];

    // Get recent students (last 5)
    const recentStudents = await db
      .select({
        id: users.id,
        name: users.name,
        createdAt: users.createdAt,
      })
      .from(users)
      .innerJoin(students, sql`${users.id} = ${students.userId}`)
      .where(sql`${users.role} = 'student'`)
      .orderBy(desc(users.createdAt))
      .limit(2);

    recentStudents.forEach((student) => {
      activities.push({
        id: student.id,
        type: "student",
        action: "New student enrolled",
        detail: student.name,
        time: getRelativeTime(student.createdAt),
      });
    });

    // Get recent homework (last 3)
    const recentHomework = await db
      .select({
        id: homework.id,
        title: homework.title,
        createdAt: homework.createdAt,
      })
      .from(homework)
      .orderBy(desc(homework.createdAt))
      .limit(2);

    recentHomework.forEach((hw) => {
      activities.push({
        id: hw.id,
        type: "homework",
        action: "Homework assigned",
        detail: hw.title,
        time: getRelativeTime(hw.createdAt),
      });
    });

    // Get recent teacher assignments (last 2)
    const recentAssignments = await db
      .select({
        id: teacherAssignments.id,
        teacherName: users.name,
        createdAt: teacherAssignments.createdAt,
      })
      .from(teacherAssignments)
      .innerJoin(users, sql`${teacherAssignments.teacherId} = ${users.id}`)
      .orderBy(desc(teacherAssignments.createdAt))
      .limit(1);

    recentAssignments.forEach((assignment) => {
      activities.push({
        id: assignment.id,
        type: "teacher",
        action: "Teacher assigned",
        detail: assignment.teacherName,
        time: getRelativeTime(assignment.createdAt),
      });
    });

    // Get recent leave requests (last 2) - Only if table exists
    try {
      const recentLeaves = await db
        .select({
          id: teacherLeaves.id,
          teacherName: users.name,
          leaveType: teacherLeaves.leaveType,
          createdAt: teacherLeaves.createdAt,
        })
        .from(teacherLeaves)
        .innerJoin(users, sql`${teacherLeaves.teacherId} = ${users.id}`)
        .orderBy(desc(teacherLeaves.createdAt))
        .limit(1);

      recentLeaves.forEach((leave) => {
        activities.push({
          id: leave.id,
          type: "leave",
          action: "Leave request submitted",
          detail: `${leave.teacherName} - ${leave.leaveType}`,
          time: getRelativeTime(leave.createdAt),
        });
      });
    } catch {
      // Table doesn't exist yet, skip
      console.log("Teacher leaves table not found, skipping...");
    }

    // Sort all activities by time
    activities.sort((a, b) => {
      const timeA = parseRelativeTime(a.time);
      const timeB = parseRelativeTime(b.time);
      return timeA - timeB;
    });

    return NextResponse.json(activities.slice(0, 6));
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent activity" },
      { status: 500 },
    );
  }
}

function getRelativeTime(date: Date | null): string {
  if (!date) return "Unknown";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

function parseRelativeTime(timeStr: string): number {
  if (timeStr === "Just now") return 0;
  if (timeStr === "Unknown") return Infinity;

  const match = timeStr.match(/(\d+)\s+(minute|hour|day)s?\s+ago/);
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2];
    if (unit === "minute") return value;
    if (unit === "hour") return value * 60;
    if (unit === "day") return value * 1440;
  }

  return Infinity;
}
