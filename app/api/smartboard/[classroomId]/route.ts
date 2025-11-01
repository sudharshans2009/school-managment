import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import {
  classrooms,
  timetable,
  attendance,
  homework,
  announcements,
  students,
  classroomMessages,
} from "@/database/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { TIMETABLE_STRUCTURE } from "@/lib/timetable-structure";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classroomId: string }> },
) {
  try {
    const { classroomId } = await params;

    // Get classroom info
    const classroom = await db.query.classrooms.findFirst({
      where: eq(classrooms.id, classroomId),
      with: {
        teacherAssignments: {
          with: {
            teacher: true,
            subject: true,
          },
        },
      },
    });

    if (!classroom) {
      return NextResponse.json(
        { error: "Classroom not found" },
        { status: 404 },
      );
    }

    // Get today's date
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    // Import calendar utils
    const { getTimetableDay } = await import("@/lib/calendar-utils");

    // Get the effective timetable day (respects calendar settings)
    const dayOfWeek = await getTimetableDay(today);

    // Get today's timetable
    const todaySchedule = await db.query.timetable.findMany({
      where: and(
        eq(timetable.classroomId, classroomId),
        eq(timetable.dayOfWeek, dayOfWeek),
      ),
      with: {
        subject: true,
        teacher: true,
      },
      orderBy: [timetable.startTime],
    });

    // Get today's attendance
    const attendanceRecords = await db.query.attendance.findMany({
      where: and(
        eq(attendance.classroomId, classroomId),
        gte(attendance.date, todayStart),
        lte(attendance.date, todayEnd),
      ),
      with: {
        student: {
          with: {
            user: true,
          },
        },
      },
    });

    // Get total students in classroom
    const totalStudents = await db.query.students.findMany({
      where: eq(students.classroomId, classroomId),
      with: {
        user: true,
      },
    });

    // Calculate attendance stats
    const presentCount = attendanceRecords.filter(
      (a) => a.status === "present",
    ).length;
    const absentCount = attendanceRecords.filter(
      (a) => a.status === "absent",
    ).length;
    const lateCount = attendanceRecords.filter(
      (a) => a.status === "late",
    ).length;

    const attendancePercentage =
      totalStudents.length > 0
        ? ((presentCount / totalStudents.length) * 100).toFixed(1)
        : "0.0";

    // Get absent and late students
    const absentStudents = attendanceRecords
      .filter((a) => a.status === "absent")
      .map((a) => a.student?.user?.name || "Unknown");

    const lateStudents = attendanceRecords
      .filter((a) => a.status === "late")
      .map((a) => a.student?.user?.name || "Unknown");

    // Get pending homework
    const pendingHomework = await db.query.homework.findMany({
      where: and(
        eq(homework.classroomId, classroomId),
        gte(homework.dueDate, new Date()),
      ),
      with: {
        subject: true,
        teacher: true,
      },
      orderBy: [homework.dueDate],
      limit: 10,
    });

    // Get recent announcements
    const recentAnnouncements = await db.query.announcements.findMany({
      where: eq(announcements.classroomId, classroomId),
      orderBy: [desc(announcements.createdAt)],
      limit: 10,
    });

    // Get today's quote from classroom messages
    const todayQuote = await db.query.classroomMessages.findFirst({
      where: and(
        eq(classroomMessages.classroomId, classroomId),
        eq(classroomMessages.messageType, "quote"),
      ),
      with: {
        teacher: true,
      },
      orderBy: [desc(classroomMessages.date)],
    });

    // Build complete timetable with fixed structure
    // Map fetched schedule to period numbers
    const scheduleMap = new Map(
      todaySchedule.map((item) => [item.periodNumber, item]),
    );

    // Create complete schedule following the fixed structure
    // Filter out breaks as per user requirement - breaks are separate fixed timings
    const completeSchedule = TIMETABLE_STRUCTURE.filter(
      (period) => !period.isBreak,
    ) // Only show teaching periods
      .map((period) => {
        // Get scheduled subject for this period
        const scheduled = scheduleMap.get(period.periodNumber);

        return {
          period: period.periodNumber,
          time: `${period.startTime} - ${period.endTime}`,
          subject: scheduled?.subject?.name || "Not Scheduled",
          teacher: scheduled?.teacher?.name || "-",
          room: scheduled?.room || "TBA",
          type: scheduled ? "Lecture" : "Free",
        };
      });

    // Format the response
    const response = {
      classroom: {
        id: classroom.id,
        name: `Class ${classroom.grade}${classroom.section}`,
        grade: classroom.grade,
        section: classroom.section,
        classTeacher:
          classroom.teacherAssignments.find((ta) => ta.isPrimary)?.teacher
            ?.name || "Not Assigned",
        totalStrength: totalStudents.length,
      },
      schedule: completeSchedule,
      attendance: {
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        total: totalStudents.length,
        percentage: parseFloat(attendancePercentage),
        absentStudents,
        lateStudents,
      },
      homework: pendingHomework.map((hw) => ({
        id: hw.id,
        subject: hw.subject?.name || "Unknown",
        title: hw.title,
        dueDate: hw.dueDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        dueTime: hw.dueDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        assignedBy: hw.teacher?.name || "Unknown",
        priority: "medium", // Default priority since it's not in schema
        totalMarks: hw.totalMarks || 0,
      })),
      announcements: recentAnnouncements.map((ann) => ({
        id: ann.id,
        title: ann.title,
        message: ann.content,
        date: ann.createdAt
          ? ann.createdAt.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "N/A",
        priority: ann.priority || "normal",
        postedBy: "Administration",
        icon:
          ann.priority === "high"
            ? "🔔"
            : ann.priority === "medium"
              ? "📢"
              : "ℹ️",
      })),
      quote: todayQuote
        ? {
            content: todayQuote.content,
            author: todayQuote.teacher?.name || "Class Teacher",
            date: todayQuote.date
              ? new Date(todayQuote.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "",
          }
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching smartboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch smartboard data" },
      { status: 500 },
    );
  }
}
