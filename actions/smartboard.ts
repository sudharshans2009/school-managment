"use server";

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
import { getTimetableDay } from "@/lib/calendar-utils";

// Types
interface ClassroomInfo {
  id: string;
  name: string;
  grade: string;
  section: string;
  classTeacher: string;
  totalStrength: number;
}

interface ScheduleItem {
  period: number;
  time: string;
  subject: string;
  teacher: string;
  room: string;
  type: string;
}

interface AttendanceData {
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
  absentStudents: string[];
  lateStudents: string[];
}

interface Homework {
  id: string;
  subject: string;
  title: string;
  dueDate: string;
  dueTime: string;
  assignedBy: string;
  priority: string;
  totalMarks: number;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  date: string;
  priority: string;
  postedBy: string;
  icon: string;
}

interface Quote {
  content: string;
  author: string;
  date: string;
}

export interface SmartboardData {
  classroom: ClassroomInfo;
  schedule: ScheduleItem[];
  attendance: AttendanceData;
  homework: Homework[];
  announcements: Announcement[];
  quote: Quote | null;
}

export interface VerifyResult {
  success: boolean;
  error?: string;
  classroom?: {
    id: string;
    name: string;
    grade: string;
    section: string;
  };
}

/**
 * Verify smartboard credentials (Classroom ID and Key)
 */
export async function verifySmartboardCredentials(
  classroomId: string,
  classroomKey: string,
): Promise<VerifyResult> {
  try {
    if (!classroomId || !classroomKey) {
      return {
        success: false,
        error: "Classroom ID and Key are required",
      };
    }

    // Verify classroom credentials
    const classroom = await db.query.classrooms.findFirst({
      where: and(
        eq(classrooms.id, classroomId),
        eq(classrooms.classroomKey, classroomKey),
      ),
      with: {
        teacherAssignments: {
          with: {
            teacher: true,
          },
        },
      },
    });

    if (!classroom) {
      return {
        success: false,
        error: "Invalid Classroom ID or Key",
      };
    }

    // Return classroom basic info
    return {
      success: true,
      classroom: {
        id: classroom.id,
        name: classroom.name,
        grade: classroom.grade,
        section: classroom.section,
      },
    };
  } catch (error) {
    console.error("Error verifying smartboard credentials:", error);
    return {
      success: false,
      error: "Failed to verify credentials",
    };
  }
}

/**
 * Fetch all smartboard data for a classroom
 */
export async function getSmartboardData(
  classroomId: string,
): Promise<SmartboardData | null> {
  try {
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
      throw new Error("Classroom not found");
    }

    // Get today's date
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

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
        ? parseFloat(((presentCount / totalStudents.length) * 100).toFixed(1))
        : 0.0;

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
    const scheduleMap = new Map(
      todaySchedule.map((item) => [item.periodNumber, item]),
    );

    // Create complete schedule following the fixed structure
    const completeSchedule = TIMETABLE_STRUCTURE.filter(
      (period) => !period.isBreak,
    ).map((period) => {
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
    return {
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
        percentage: attendancePercentage,
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
  } catch (error) {
    console.error("Error fetching smartboard data:", error);
    return null;
  }
}

/**
 * Get smartboard notifications (recent announcements, homework, messages)
 */
export interface SmartboardNotificationsData {
  announcements: Array<{
    id: string;
    type: "announcement";
    title: string;
    content: string;
    priority: string;
    createdBy: string;
    createdAt: string;
    scope: "class" | "school";
    event: {
      title: string;
      startDate: string;
    } | null;
  }>;
  homework: Array<{
    id: string;
    type: "homework";
    title: string;
    subject: string;
    teacher: string;
    dueDate: string;
    createdAt: string;
  }>;
  messages: Array<{
    id: string;
    type: string;
    content: string;
    teacher: string;
    createdAt: string;
  }>;
  lastUpdated: string;
}

export async function getSmartboardNotifications(
  classroomId: string,
): Promise<SmartboardNotificationsData> {
  try {
    // Calculate time threshold (last 24 hours for recent updates)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Fetch class announcements (class-specific + school-wide)
    const classAnnouncements = await db.query.announcements.findMany({
      where: and(
        eq(announcements.isActive, true),
        gte(announcements.createdAt, oneDayAgo),
      ),
      orderBy: [desc(announcements.createdAt)],
      limit: 5,
      with: {
        creator: {
          columns: {
            name: true,
          },
        },
        event: {
          columns: {
            title: true,
            startDate: true,
          },
        },
      },
    });

    // Filter for this classroom or school-wide
    const relevantAnnouncements = classAnnouncements.filter(
      (ann) => ann.classroomId === classroomId || ann.classroomId === null,
    );

    // Fetch recent homework for this classroom
    const recentHomework = await db.query.homework.findMany({
      where: and(
        eq(homework.classroomId, classroomId),
        gte(homework.createdAt, oneDayAgo),
      ),
      orderBy: [desc(homework.createdAt)],
      limit: 5,
      with: {
        subject: {
          columns: {
            name: true,
          },
        },
        teacher: {
          columns: {
            name: true,
          },
        },
      },
    });

    // Fetch recent classroom messages (quotes, reminders)
    const recentMessages = await db.query.classroomMessages.findMany({
      where: and(
        eq(classroomMessages.classroomId, classroomId),
        eq(classroomMessages.isActive, true),
        gte(classroomMessages.createdAt, oneDayAgo),
      ),
      orderBy: [desc(classroomMessages.createdAt)],
      limit: 3,
      with: {
        teacher: {
          columns: {
            name: true,
          },
        },
      },
    });

    // Format response
    return {
      announcements: relevantAnnouncements.map((ann) => ({
        id: ann.id,
        type: "announcement" as const,
        title: ann.title,
        content: ann.content,
        priority: ann.priority || "normal",
        createdBy: ann.creator?.name || "Unknown",
        createdAt: ann.createdAt?.toISOString() || new Date().toISOString(),
        scope: (ann.classroomId ? "class" : "school") as "class" | "school",
        event: ann.event
          ? {
              title: ann.event.title,
              startDate: ann.event.startDate.toISOString(),
            }
          : null,
      })),
      homework: recentHomework.map((hw) => ({
        id: hw.id,
        type: "homework" as const,
        title: hw.title,
        subject: hw.subject?.name || "Unknown",
        teacher: hw.teacher?.name || "Unknown",
        dueDate: hw.dueDate.toISOString(),
        createdAt: hw.createdAt?.toISOString() || new Date().toISOString(),
      })),
      messages: recentMessages.map((msg) => ({
        id: msg.id,
        type: msg.messageType || "message",
        content: msg.content,
        teacher: msg.teacher?.name || "Unknown",
        createdAt: msg.createdAt?.toISOString() || new Date().toISOString(),
      })),
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching smartboard notifications:", error);
    return {
      announcements: [],
      homework: [],
      messages: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}
