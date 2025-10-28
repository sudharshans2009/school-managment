import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { classrooms, timetable, attendance, homework, announcements, students } from "@/database/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classroomId: string }> }
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
        { status: 404 }
      );
    }

    // Get today's date
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0-6 (Sunday-Saturday)
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    // Get today's timetable
    const todaySchedule = await db.query.timetable.findMany({
      where: and(
        eq(timetable.classroomId, classroomId),
        eq(timetable.dayOfWeek, dayOfWeek)
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
        lte(attendance.date, todayEnd)
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
    const presentCount = attendanceRecords.filter((a) => a.status === "present").length;
    const absentCount = attendanceRecords.filter((a) => a.status === "absent").length;
    const lateCount = attendanceRecords.filter((a) => a.status === "late").length;
    
    const attendancePercentage = totalStudents.length > 0 
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
        gte(homework.dueDate, new Date())
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

    // Format the response
    const response = {
      classroom: {
        id: classroom.id,
        name: `Class ${classroom.grade}${classroom.section}`,
        grade: classroom.grade,
        section: classroom.section,
        classTeacher: classroom.teacherAssignments.find((ta) => ta.isPrimary)?.teacher?.name || "Not Assigned",
        totalStrength: totalStudents.length,
      },
      schedule: todaySchedule.map((item, index) => ({
        period: index + 1,
        time: `${item.startTime} - ${item.endTime}`,
        subject: item.subject?.name || "Unknown",
        teacher: item.teacher?.name || "Unknown",
        room: item.room || "TBA",
        type: item.subject?.name === "Break" ? "Break" : "Lecture",
      })),
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
        dueDate: hw.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        dueTime: hw.dueDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        assignedBy: hw.teacher?.name || "Unknown",
        priority: "medium", // Default priority since it's not in schema
        totalMarks: hw.totalMarks || 0,
      })),
      announcements: recentAnnouncements.map((ann) => ({
        id: ann.id,
        title: ann.title,
        message: ann.content,
        date: ann.createdAt ? ann.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A",
        priority: ann.priority || "normal",
        postedBy: "Administration",
        icon: ann.priority === "high" ? "🔔" : ann.priority === "medium" ? "📢" : "ℹ️",
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching smartboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch smartboard data" },
      { status: 500 }
    );
  }
}
