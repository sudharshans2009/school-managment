"use server";

import { db } from "@/database";
import {
  attendance,
  students,
  users,
} from "@/database/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

// ============================================
// ATTENDANCE MANAGEMENT
// ============================================

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classroomId: string;
  date: Date;
  status: "present" | "absent" | "late" | "excused";
  remarks: string | null;
  markedBy: string;
  createdAt: Date | null;
  studentName: string | null;
  studentRollNumber: string | null;
}

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}

export interface StudentAttendanceSummary {
  studentId: string;
  studentName: string;
  rollNumber: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}

/**
 * Mark attendance for students
 * @param records - Array of attendance records to create
 * @param markedBy - User ID of the person marking attendance
 */
export async function markAttendance(
  records: Array<{
    studentId: string;
    classroomId: string;
    status: "present" | "absent" | "late" | "excused";
    date?: string | Date;
    remarks?: string;
  }>,
  markedBy: string
): Promise<{ success: boolean; data?: { count: number }; error?: string }> {
  try {
    if (!records || records.length === 0) {
      return { success: false, error: "No attendance records provided" };
    }

    if (!markedBy) {
      return { success: false, error: "Marker ID is required" };
    }

    // Check if attendance already exists for these students on this date
    const sampleDate = records[0].date ? new Date(records[0].date) : new Date();
    const dateStart = new Date(sampleDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(sampleDate);
    dateEnd.setHours(23, 59, 59, 999);

    const classroomId = records[0].classroomId;

    // Check for existing records
    const existingRecords = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.classroomId, classroomId),
          gte(attendance.date, dateStart),
          lte(attendance.date, dateEnd)
        )
      );

    if (existingRecords.length > 0) {
      // Update existing records
      for (const record of records) {
        const existing = existingRecords.find(
          r => r.studentId === record.studentId
        );
        
        if (existing) {
          await db
            .update(attendance)
            .set({
              status: record.status,
              remarks: record.remarks || null,
              markedBy,
            })
            .where(eq(attendance.id, existing.id));
        } else {
          // Insert new record if student wasn't previously marked
          await db.insert(attendance).values({
            studentId: record.studentId,
            classroomId: record.classroomId,
            date: record.date ? new Date(record.date) : new Date(),
            status: record.status,
            remarks: record.remarks || null,
            markedBy,
          });
        }
      }
    } else {
      // Insert all new records
      const attendanceData = records.map((record) => ({
        studentId: record.studentId,
        classroomId: record.classroomId,
        date: record.date ? new Date(record.date) : new Date(),
        status: record.status,
        remarks: record.remarks || null,
        markedBy,
      }));

      await db.insert(attendance).values(attendanceData);
    }

    return { success: true, data: { count: records.length } };
  } catch (error) {
    console.error("Error marking attendance:", error);
    return { success: false, error: "Failed to mark attendance" };
  }
}

/**
 * Get attendance records by classroom
 * @param classroomId - Classroom ID
 * @param startDate - Start date (optional)
 * @param endDate - End date (optional)
 */
export async function getAttendanceByClassroom(
  classroomId: string,
  startDate?: string | Date,
  endDate?: string | Date
): Promise<{ success: boolean; data?: AttendanceRecord[]; error?: string }> {
  try {
    if (!classroomId) {
      return { success: false, error: "Classroom ID is required" };
    }

    const conditions = [eq(attendance.classroomId, classroomId)];

    if (startDate) {
      conditions.push(gte(attendance.date, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(attendance.date, new Date(endDate)));
    }

    const records = await db
      .select({
        id: attendance.id,
        studentId: attendance.studentId,
        classroomId: attendance.classroomId,
        date: attendance.date,
        status: attendance.status,
        remarks: attendance.remarks,
        markedBy: attendance.markedBy,
        createdAt: attendance.createdAt,
        studentName: users.name,
        studentRollNumber: students.rollNumber,
      })
      .from(attendance)
      .leftJoin(students, eq(attendance.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(attendance.date));

    return { success: true, data: records as AttendanceRecord[] };
  } catch (error) {
    console.error("Error fetching attendance by classroom:", error);
    return { success: false, error: "Failed to fetch attendance records" };
  }
}

/**
 * Get attendance records by student
 * @param studentId - Student ID
 * @param startDate - Start date (optional)
 * @param endDate - End date (optional)
 */
export async function getAttendanceByStudent(
  studentId: string,
  startDate?: string | Date,
  endDate?: string | Date
): Promise<{ success: boolean; data?: AttendanceRecord[]; error?: string }> {
  try {
    if (!studentId) {
      return { success: false, error: "Student ID is required" };
    }

    const conditions = [eq(attendance.studentId, studentId)];

    if (startDate) {
      conditions.push(gte(attendance.date, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(attendance.date, new Date(endDate)));
    }

    const records = await db
      .select({
        id: attendance.id,
        studentId: attendance.studentId,
        classroomId: attendance.classroomId,
        date: attendance.date,
        status: attendance.status,
        remarks: attendance.remarks,
        markedBy: attendance.markedBy,
        createdAt: attendance.createdAt,
        studentName: users.name,
        studentRollNumber: students.rollNumber,
      })
      .from(attendance)
      .leftJoin(students, eq(attendance.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(attendance.date));

    return { success: true, data: records as AttendanceRecord[] };
  } catch (error) {
    console.error("Error fetching attendance by student:", error);
    return { success: false, error: "Failed to fetch attendance records" };
  }
}

/**
 * Get attendance statistics for a classroom
 * @param classroomId - Classroom ID
 * @param startDate - Start date (optional)
 * @param endDate - End date (optional)
 */
export async function getAttendanceStats(
  classroomId: string,
  startDate?: string | Date,
  endDate?: string | Date
): Promise<{ success: boolean; data?: AttendanceStats; error?: string }> {
  try {
    if (!classroomId) {
      return { success: false, error: "Classroom ID is required" };
    }

    const conditions = [eq(attendance.classroomId, classroomId)];

    if (startDate) {
      conditions.push(gte(attendance.date, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(attendance.date, new Date(endDate)));
    }

    const records = await db
      .select()
      .from(attendance)
      .where(and(...conditions));

    const total = records.length;
    const present = records.filter((r) => r.status === "present").length;
    const absent = records.filter((r) => r.status === "absent").length;
    const late = records.filter((r) => r.status === "late").length;
    const excused = records.filter((r) => r.status === "excused").length;
    const percentage = total > 0 ? (present / total) * 100 : 0;

    return {
      success: true,
      data: {
        total,
        present,
        absent,
        late,
        excused,
        percentage,
      },
    };
  } catch (error) {
    console.error("Error calculating attendance stats:", error);
    return { success: false, error: "Failed to calculate statistics" };
  }
}

/**
 * Get attendance summary for all students in a classroom
 * @param classroomId - Classroom ID
 * @param startDate - Start date (optional)
 * @param endDate - End date (optional)
 */
export async function getClassroomAttendanceSummary(
  classroomId: string,
  startDate?: string | Date,
  endDate?: string | Date
): Promise<{
  success: boolean;
  data?: StudentAttendanceSummary[];
  error?: string;
}> {
  try {
    if (!classroomId) {
      return { success: false, error: "Classroom ID is required" };
    }

    // Get all students in the classroom
    const classroomStudents = await db
      .select({
        id: students.id,
        name: users.name,
        rollNumber: students.rollNumber,
      })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .where(eq(students.classroomId, classroomId))
      .orderBy(students.rollNumber);

    // Get attendance records for the date range
    const conditions = [eq(attendance.classroomId, classroomId)];

    if (startDate) {
      conditions.push(gte(attendance.date, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(attendance.date, new Date(endDate)));
    }

    const records = await db
      .select()
      .from(attendance)
      .where(and(...conditions));

    // Calculate summary for each student
    const summary = classroomStudents.map((student) => {
      const studentRecords = records.filter((r) => r.studentId === student.id);
      const total = studentRecords.length;
      const present = studentRecords.filter((r) => r.status === "present").length;
      const absent = studentRecords.filter((r) => r.status === "absent").length;
      const late = studentRecords.filter((r) => r.status === "late").length;
      const excused = studentRecords.filter((r) => r.status === "excused").length;
      const percentage = total > 0 ? (present / total) * 100 : 0;

      return {
        studentId: student.id,
        studentName: student.name || "Unknown",
        rollNumber: student.rollNumber || "N/A",
        total,
        present,
        absent,
        late,
        excused,
        percentage,
      };
    });

    return { success: true, data: summary };
  } catch (error) {
    console.error("Error fetching classroom attendance summary:", error);
    return { success: false, error: "Failed to fetch attendance summary" };
  }
}

/**
 * Delete attendance record
 * @param attendanceId - Attendance record ID
 */
export async function deleteAttendance(
  attendanceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!attendanceId) {
      return { success: false, error: "Attendance ID is required" };
    }

    await db.delete(attendance).where(eq(attendance.id, attendanceId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting attendance:", error);
    return { success: false, error: "Failed to delete attendance record" };
  }
}

/**
 * Get attendance for a specific date
 * @param classroomId - Classroom ID
 * @param date - Date to check
 */
export async function getAttendanceForDate(
  classroomId: string,
  date: string | Date
): Promise<{ success: boolean; data?: AttendanceRecord[]; error?: string }> {
  try {
    if (!classroomId || !date) {
      return { success: false, error: "Classroom ID and date are required" };
    }

    const targetDate = new Date(date);
    const dateStart = new Date(targetDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(targetDate);
    dateEnd.setHours(23, 59, 59, 999);

    const records = await db
      .select({
        id: attendance.id,
        studentId: attendance.studentId,
        classroomId: attendance.classroomId,
        date: attendance.date,
        status: attendance.status,
        remarks: attendance.remarks,
        markedBy: attendance.markedBy,
        createdAt: attendance.createdAt,
        studentName: users.name,
        studentRollNumber: students.rollNumber,
      })
      .from(attendance)
      .leftJoin(students, eq(attendance.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .where(
        and(
          eq(attendance.classroomId, classroomId),
          gte(attendance.date, dateStart),
          lte(attendance.date, dateEnd)
        )
      )
      .orderBy(students.rollNumber);

    return { success: true, data: records as AttendanceRecord[] };
  } catch (error) {
    console.error("Error fetching attendance for date:", error);
    return { success: false, error: "Failed to fetch attendance records" };
  }
}

/**
 * Get students by classroom
 */
export async function getStudentsByClassroom(classroomId: string) {
  try {
    const studentsList = await db
      .select({
        id: students.id,
        rollNumber: students.rollNumber,
        user: {
          name: users.name,
        },
      })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .where(eq(students.classroomId, classroomId));

    return { success: true, data: studentsList };
  } catch (error) {
    console.error("Error fetching students:", error);
    return { success: false, error: "Failed to fetch students" };
  }
}
