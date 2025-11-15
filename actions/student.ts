"use server";

import { db } from "@/database";
import {
  students,
  attendance,
  studentGrades,
  exams,
  homework,
  homeworkSubmissions,
  subjects,
  timetable,
  classroomMessages,
  teacherAssignments,
  users,
  messages,
  classrooms,
} from "@/database/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

export interface StudentProfile {
  id: string;
  userId: string;
  classroomId: string | null;
  rollNumber: string;
  admissionNumber: string;
  dateOfBirth: Date;
  classroom: {
    id: string;
    name: string;
    grade: string;
    section: string;
  };
}

export interface StudentHomework {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  assignedDate: string;
  subject: {
    id: string;
    name: string;
  };
  classroom: {
    id: string;
    name: string;
  };
  submission?: {
    id: string;
    status: string;
    submittedAt: Date | null;
    marksObtained: number | null;
  };
}

export interface StudentTimetableEntry {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  teacher: {
    id: string;
    name: string;
  };
}

export interface ClassroomMessage {
  id: string;
  message: string;
  messageType: string;
  postedBy: string;
  createdAt: Date;
  postedByName: string;
}

export interface ClassroomTeacher {
  id: string;
  name: string;
  email: string;
  subject: {
    id: string;
    name: string;
  };
  isPrimary: boolean | null;
}

export interface StudentGrade {
  id: string;
  marksObtained: string;
  grade: string;
  percentage: string;
  remarks?: string | null;
  isAbsent: boolean;
  uploadedAt: Date;
  exam: {
    id: string;
    name: string;
    examType: string;
    examDate: string;
    totalMarks: number;
    passingMarks?: number | null;
    academicYear: string;
    term?: string | null;
  };
  subject: {
    id: string;
    name: string;
    code: string;
  };
}

export interface StudentAnalytics {
  attendance: {
    totalDays: number;
    present: number;
    absent: number;
    late: number;
    rate: number;
    recentTrend: { date: string; status: string }[];
  };
  grades: {
    totalExams: number;
    averagePercentage: number;
    averageGrade: string;
    passed: number;
    failed: number;
    bySubject: { subject: string; average: number; grade: string }[];
    recentGrades: {
      exam: string;
      marks: number;
      total: number;
      grade: string;
      date: string;
    }[];
  };
  homework: {
    totalAssigned: number;
    submitted: number;
    graded: number;
    pending: number;
    averageScore: number;
    onTimeRate: number;
  };
  overall: {
    rank: number;
    totalStudents: number;
    performanceLevel: string;
  };
}

// ============================================================================
// STUDENT PROFILE
// ============================================================================

/**
 * Get student profile by user ID
 */
export async function getStudentProfile(
  userId: string,
): Promise<StudentProfile | null> {
  try {
    const [student] = await db
      .select({
        id: students.id,
        userId: students.userId,
        classroomId: students.classroomId,
        rollNumber: students.rollNumber,
        admissionNumber: students.admissionNumber,
        dateOfBirth: students.dateOfBirth,
        classroomName: classrooms.name,
        classroomGrade: classrooms.grade,
        classroomSection: classrooms.section,
        classroomIdFull: classrooms.id,
      })
      .from(students)
      .leftJoin(classrooms, eq(students.classroomId, classrooms.id))
      .where(eq(students.userId, userId))
      .limit(1);

    if (!student) return null;

    return {
      id: student.id,
      userId: student.userId,
      classroomId: student.classroomId,
      rollNumber: student.rollNumber,
      admissionNumber: student.admissionNumber,
      dateOfBirth: student.dateOfBirth,
      classroom: {
        id: student.classroomIdFull || "",
        name: student.classroomName || "",
        grade: student.classroomGrade?.toString() || "",
        section: student.classroomSection || "",
      },
    };
  } catch (error) {
    console.error("Error fetching student profile:", error);
    throw new Error("Failed to fetch student profile");
  }
}

// ============================================================================
// HOMEWORK
// ============================================================================

/**
 * Get homework for student's classroom
 */
export async function getStudentHomework(
  classroomId: string,
  userId: string,
): Promise<StudentHomework[]> {
  try {
    // First get student ID
    const [student] = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.userId, userId))
      .limit(1);

    if (!student) return [];

    const homeworkList = await db
      .select({
        id: homework.id,
        title: homework.title,
        description: homework.description,
        dueDate: homework.dueDate,
        assignedDate: homework.assignedDate,
        subjectId: subjects.id,
        subjectName: subjects.name,
        classroomId: classrooms.id,
        classroomName: classrooms.name,
        submissionId: homeworkSubmissions.id,
        submissionStatus: homeworkSubmissions.status,
        submittedAt: homeworkSubmissions.submittedAt,
        marksObtained: homeworkSubmissions.marksObtained,
      })
      .from(homework)
      .leftJoin(subjects, eq(homework.subjectId, subjects.id))
      .leftJoin(classrooms, eq(homework.classroomId, classrooms.id))
      .leftJoin(
        homeworkSubmissions,
        and(
          eq(homeworkSubmissions.homeworkId, homework.id),
          eq(homeworkSubmissions.studentId, student.id),
        ),
      )
      .where(eq(homework.classroomId, classroomId))
      .orderBy(desc(homework.dueDate));

    return homeworkList.map((hw) => ({
      id: hw.id,
      title: hw.title,
      description: hw.description,
      dueDate: hw.dueDate.toISOString(),
      assignedDate: hw.assignedDate?.toISOString() || "",
      subject: {
        id: hw.subjectId || "",
        name: hw.subjectName || "",
      },
      classroom: {
        id: hw.classroomId || "",
        name: hw.classroomName || "",
      },
      submission: hw.submissionId
        ? {
            id: hw.submissionId,
            status: hw.submissionStatus || "",
            submittedAt: hw.submittedAt,
            marksObtained: hw.marksObtained,
          }
        : undefined,
    }));
  } catch (error) {
    console.error("Error fetching student homework:", error);
    throw new Error("Failed to fetch homework");
  }
}

// ============================================================================
// TIMETABLE
// ============================================================================

/**
 * Get timetable for student's classroom
 */
export async function getStudentTimetable(
  classroomId: string,
): Promise<StudentTimetableEntry[]> {
  try {
    const timetableEntries = await db
      .select({
        id: timetable.id,
        dayOfWeek: timetable.dayOfWeek,
        startTime: timetable.startTime,
        endTime: timetable.endTime,
        room: timetable.room,
        subjectId: subjects.id,
        subjectName: subjects.name,
        subjectCode: subjects.code,
        teacherId: users.id,
        teacherName: users.name,
      })
      .from(timetable)
      .leftJoin(subjects, eq(timetable.subjectId, subjects.id))
      .leftJoin(users, eq(timetable.teacherId, users.id))
      .where(
        and(
          eq(timetable.classroomId, classroomId),
          eq(timetable.isActive, true),
        ),
      )
      .orderBy(timetable.dayOfWeek, timetable.periodNumber);

    return timetableEntries.map((entry) => ({
      id: entry.id,
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      room: entry.room,
      subject: {
        id: entry.subjectId || "",
        name: entry.subjectName || "",
        code: entry.subjectCode || "",
      },
      teacher: {
        id: entry.teacherId || "",
        name: entry.teacherName || "",
      },
    }));
  } catch (error) {
    console.error("Error fetching student timetable:", error);
    throw new Error("Failed to fetch timetable");
  }
}

// ============================================================================
// CLASSROOM MESSAGES
// ============================================================================

/**
 * Get classroom messages (announcements, quotes)
 */
export async function getClassroomMessages(
  classroomId: string,
): Promise<ClassroomMessage[]> {
  try {
    const messages = await db
      .select({
        id: classroomMessages.id,
        message: classroomMessages.content,
        messageType: classroomMessages.messageType,
        postedBy: classroomMessages.teacherId,
        createdAt: classroomMessages.createdAt,
        postedByName: users.name,
      })
      .from(classroomMessages)
      .leftJoin(users, eq(classroomMessages.teacherId, users.id))
      .where(eq(classroomMessages.classroomId, classroomId))
      .orderBy(desc(classroomMessages.createdAt));

    return messages.map((msg) => ({
      id: msg.id,
      message: msg.message,
      messageType: msg.messageType || "",
      postedBy: msg.postedBy,
      createdAt: msg.createdAt || new Date(),
      postedByName: msg.postedByName || "Unknown",
    }));
  } catch (error) {
    console.error("Error fetching classroom messages:", error);
    throw new Error("Failed to fetch classroom messages");
  }
}

// ============================================================================
// TEACHERS
// ============================================================================

/**
 * Get teachers for student's classroom
 */
export async function getClassroomTeachers(
  classroomId: string,
): Promise<ClassroomTeacher[]> {
  try {
    const teachers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        isPrimary: teacherAssignments.isPrimary,
        subjectId: subjects.id,
        subjectName: subjects.name,
      })
      .from(teacherAssignments)
      .leftJoin(users, eq(teacherAssignments.teacherId, users.id))
      .leftJoin(subjects, eq(teacherAssignments.subjectId, subjects.id))
      .where(eq(teacherAssignments.classroomId, classroomId));

    return teachers.map((teacher) => ({
      id: teacher.id || "",
      name: teacher.name || "",
      email: teacher.email || "",
      subject: {
        id: teacher.subjectId || "",
        name: teacher.subjectName || "",
      },
      isPrimary: teacher.isPrimary,
    }));
  } catch (error) {
    console.error("Error fetching classroom teachers:", error);
    throw new Error("Failed to fetch teachers");
  }
}

// ============================================================================
// MESSAGES
// ============================================================================

/**
 * Send a message to a teacher
 */
export async function sendMessage(data: {
  senderId: string;
  receiverId: string;
  subject: string;
  message: string;
  messageType: "absence" | "query" | "request" | "general";
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const [newMessage] = await db
      .insert(messages)
      .values({
        senderId: data.senderId,
        receiverId: data.receiverId,
        subject: data.subject,
        message: data.message,
        messageType: data.messageType,
        status: "sent",
      })
      .returning();

    return { success: true, messageId: newMessage.id };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error: "Failed to send message" };
  }
}

/**
 * Get sent messages for a student
 */
export async function getSentMessages(userId: string): Promise<
  {
    id: string;
    subject: string;
    message: string;
    messageType: string | null;
    status: string | null;
    receiverName: string;
    receiverEmail: string;
    createdAt: string;
    readAt: string | null;
  }[]
> {
  try {
    const sentMessages = await db.query.messages.findMany({
      where: eq(messages.senderId, userId),
      orderBy: [desc(messages.createdAt)],
      limit: 50,
      with: {
        receiver: true,
      },
    });

    return sentMessages.map((m) => ({
      id: m.id,
      subject: m.subject,
      message: m.message,
      messageType: m.messageType,
      status: m.status,
      receiverName: m.receiver?.name || "Unknown",
      receiverEmail: m.receiver?.email || "",
      createdAt: m.createdAt?.toISOString() || "",
      readAt: m.readAt?.toISOString() || null,
    }));
  } catch (error) {
    console.error("Error fetching sent messages:", error);
    return [];
  }
}

/**
 * Update a sent message (only if unread)
 */
export async function updateSentMessage(data: {
  messageId: string;
  senderId: string;
  subject: string;
  message: string;
  messageType: "absence" | "query" | "request" | "general";
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if message exists, belongs to sender, and is unread
    const [existingMessage] = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.id, data.messageId),
          eq(messages.senderId, data.senderId),
          sql`${messages.readAt} IS NULL`,
        ),
      );

    if (!existingMessage) {
      return {
        success: false,
        error:
          "Message not found, already read, or you don't have permission to edit it",
      };
    }

    await db
      .update(messages)
      .set({
        subject: data.subject,
        message: data.message,
        messageType: data.messageType,
      })
      .where(eq(messages.id, data.messageId));

    return { success: true };
  } catch (error) {
    console.error("Error updating message:", error);
    return { success: false, error: "Failed to update message" };
  }
}

/**
 * Delete a sent message (only if unread)
 */
export async function deleteSentMessage(
  messageId: string,
  senderId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if message exists, belongs to sender, and is unread
    const [existingMessage] = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.id, messageId),
          eq(messages.senderId, senderId),
          sql`${messages.readAt} IS NULL`,
        ),
      );

    if (!existingMessage) {
      return {
        success: false,
        error:
          "Message not found, already read, or you don't have permission to delete it",
      };
    }

    await db.delete(messages).where(eq(messages.id, messageId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting message:", error);
    return { success: false, error: "Failed to delete message" };
  }
}

// ============================================================================
// GRADES
// ============================================================================

/**
 * Get student grades (finalized exams only)
 */
export async function getStudentGrades(
  userId: string,
  filters?: {
    subjectId?: string;
    examType?: string;
  },
): Promise<StudentGrade[]> {
  try {
    // Get student record
    const [studentRecord] = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.userId, userId))
      .limit(1);

    if (!studentRecord) {
      throw new Error("Student record not found");
    }

    // Build conditions
    const conditions = [
      eq(studentGrades.studentId, studentRecord.id),
      eq(exams.isFinalized, true),
    ];

    if (filters?.subjectId) {
      conditions.push(eq(exams.subjectId, filters.subjectId));
    }

    if (filters?.examType) {
      conditions.push(
        eq(
          exams.examType,
          filters.examType as
            | "class_test"
            | "unit_test"
            | "quarterly"
            | "midterm"
            | "final_exam",
        ),
      );
    }

    const grades = await db
      .select({
        id: studentGrades.id,
        marksObtained: studentGrades.marksObtained,
        grade: studentGrades.grade,
        percentage: studentGrades.percentage,
        remarks: studentGrades.remarks,
        isAbsent: studentGrades.isAbsent,
        uploadedAt: studentGrades.uploadedAt,
        examId: exams.id,
        examName: exams.name,
        examType: exams.examType,
        examDate: exams.examDate,
        totalMarks: exams.totalMarks,
        passingMarks: exams.passingMarks,
        academicYear: exams.academicYear,
        term: exams.term,
        subjectId: subjects.id,
        subjectName: subjects.name,
        subjectCode: subjects.code,
      })
      .from(studentGrades)
      .innerJoin(exams, eq(studentGrades.examId, exams.id))
      .leftJoin(subjects, eq(exams.subjectId, subjects.id))
      .where(and(...conditions))
      .orderBy(desc(exams.examDate));

    return grades.map((g) => ({
      id: g.id,
      marksObtained: g.marksObtained || "0",
      grade: g.grade || "",
      percentage: g.percentage || "0",
      remarks: g.remarks,
      isAbsent: g.isAbsent || false,
      uploadedAt: g.uploadedAt || new Date(),
      exam: {
        id: g.examId,
        name: g.examName,
        examType: g.examType,
        examDate: g.examDate.toISOString(),
        totalMarks: g.totalMarks,
        passingMarks: g.passingMarks,
        academicYear: g.academicYear,
        term: g.term,
      },
      subject: {
        id: g.subjectId || "",
        name: g.subjectName || "",
        code: g.subjectCode || "",
      },
    }));
  } catch (error) {
    console.error("Error fetching student grades:", error);
    throw new Error("Failed to fetch grades");
  }
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get comprehensive student analytics
 */
export async function getStudentAnalytics(
  userId: string,
): Promise<StudentAnalytics> {
  try {
    // Get student record
    const [studentRecord] = await db
      .select({
        id: students.id,
        classroomId: students.classroomId,
      })
      .from(students)
      .where(eq(students.userId, userId))
      .limit(1);

    if (!studentRecord) {
      throw new Error("Student record not found");
    }

    // Attendance Analytics
    const studentAttendance = await db
      .select({
        date: attendance.date,
        status: attendance.status,
      })
      .from(attendance)
      .where(eq(attendance.studentId, studentRecord.id));

    const totalDays = studentAttendance.length;
    const present = studentAttendance.filter(
      (a) => a.status === "present",
    ).length;
    const absent = studentAttendance.filter(
      (a) => a.status === "absent",
    ).length;
    const late = studentAttendance.filter((a) => a.status === "late").length;
    const attendanceRate = totalDays > 0 ? (present / totalDays) * 100 : 0;

    const recentTrend = studentAttendance.slice(-7).map((a) => ({
      date: new Date(a.date).toISOString().split("T")[0],
      status: a.status,
    }));

    // Grades Analytics
    const studentGradesData = await db
      .select({
        marksObtained: studentGrades.marksObtained,
        percentage: studentGrades.percentage,
        grade: studentGrades.grade,
        isAbsent: studentGrades.isAbsent,
        examId: studentGrades.examId,
      })
      .from(studentGrades)
      .where(eq(studentGrades.studentId, studentRecord.id));

    const finalizedExamsData = await db
      .select({
        id: exams.id,
        name: exams.name,
        examDate: exams.examDate,
        totalMarks: exams.totalMarks,
        passingMarks: exams.passingMarks,
        subjectId: exams.subjectId,
      })
      .from(exams)
      .where(eq(exams.isFinalized, true));

    const validGrades = studentGradesData.filter(
      (g) => !g.isAbsent && g.percentage,
    );
    const averagePercentage =
      validGrades.length > 0
        ? validGrades.reduce(
            (sum, g) => sum + parseFloat(g.percentage || "0"),
            0,
          ) / validGrades.length
        : 0;

    const getLetterGrade = (percentage: number): string => {
      if (percentage >= 90) return "A+";
      if (percentage >= 80) return "A";
      if (percentage >= 70) return "B+";
      if (percentage >= 60) return "B";
      if (percentage >= 50) return "C+";
      if (percentage >= 40) return "C";
      if (percentage >= 33) return "D";
      return "F";
    };

    const averageGrade = getLetterGrade(averagePercentage);

    const passedExams = validGrades.filter((g) => {
      const exam = finalizedExamsData.find((e) => e.id === g.examId);
      if (!exam) return false;
      const passingMarks = exam.passingMarks || exam.totalMarks * 0.4;
      return parseFloat(g.marksObtained || "0") >= passingMarks;
    }).length;

    const failedExams = validGrades.length - passedExams;

    // Grades by subject
    const subjectData = await db
      .select({ id: subjects.id, name: subjects.name })
      .from(subjects);
    const gradesBySubject = subjectData
      .map((subject) => {
        const subjectExams = finalizedExamsData.filter(
          (e) => e.subjectId === subject.id,
        );
        const subjectGrades = studentGradesData.filter(
          (g) => subjectExams.some((e) => e.id === g.examId) && !g.isAbsent,
        );
        const average =
          subjectGrades.length > 0
            ? subjectGrades.reduce(
                (sum, g) => sum + parseFloat(g.percentage || "0"),
                0,
              ) / subjectGrades.length
            : 0;
        return {
          subject: subject.name,
          average,
          grade: getLetterGrade(average),
        };
      })
      .filter((s) => s.average > 0);

    // Recent grades
    const recentGrades = finalizedExamsData
      .map((exam) => {
        const grade = studentGradesData.find((g) => g.examId === exam.id);
        if (!grade || grade.isAbsent) return null;
        return {
          exam: exam.name,
          marks: parseFloat(grade.marksObtained || "0"),
          total: exam.totalMarks,
          grade: grade.grade || "",
          date: new Date(exam.examDate).toISOString().split("T")[0],
        };
      })
      .filter((g) => g !== null)
      .slice(-10);

    // Homework Analytics
    const studentHomework = await db
      .select({
        id: homework.id,
        dueDate: homework.dueDate,
        classroomId: homework.classroomId,
      })
      .from(homework)
      .where(eq(homework.classroomId, studentRecord.classroomId || ""));

    const studentSubmissions = await db
      .select({
        homeworkId: homeworkSubmissions.homeworkId,
        submittedAt: homeworkSubmissions.submittedAt,
        marksObtained: homeworkSubmissions.marksObtained,
        status: homeworkSubmissions.status,
      })
      .from(homeworkSubmissions)
      .where(eq(homeworkSubmissions.studentId, studentRecord.id));

    const totalAssigned = studentHomework.length;
    const submitted = studentSubmissions.length;
    const graded = studentSubmissions.filter(
      (s) => s.status === "graded",
    ).length;
    const pending = totalAssigned - submitted;

    const gradedSubmissions = studentSubmissions.filter((s) => s.marksObtained);
    const averageScore =
      gradedSubmissions.length > 0
        ? gradedSubmissions.reduce(
            (sum, s) => sum + parseInt(String(s.marksObtained) || "0"),
            0,
          ) / gradedSubmissions.length
        : 0;

    const onTimeSubmissions = studentSubmissions.filter((s) => {
      const hw = studentHomework.find((h) => h.id === s.homeworkId);
      if (!hw || !s.submittedAt) return false;
      return new Date(s.submittedAt) <= new Date(hw.dueDate);
    }).length;
    const onTimeRate =
      studentSubmissions.length > 0
        ? (onTimeSubmissions / studentSubmissions.length) * 100
        : 0;

    // Overall performance
    const classStudents = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.classroomId, studentRecord.classroomId || ""));

    const allStudentGrades = await db
      .select({
        studentId: studentGrades.studentId,
        percentage: studentGrades.percentage,
        isAbsent: studentGrades.isAbsent,
      })
      .from(studentGrades);

    const studentAverages = classStudents.map((student) => {
      const grades = allStudentGrades.filter(
        (g) => g.studentId === student.id && !g.isAbsent,
      );
      const avg =
        grades.length > 0
          ? grades.reduce(
              (sum, g) => sum + parseFloat(g.percentage || "0"),
              0,
            ) / grades.length
          : 0;
      return { studentId: student.id, average: avg };
    });

    studentAverages.sort((a, b) => b.average - a.average);
    const rank =
      studentAverages.findIndex((s) => s.studentId === studentRecord.id) + 1;

    const performanceLevel =
      averagePercentage >= 85
        ? "Excellent"
        : averagePercentage >= 70
          ? "Good"
          : averagePercentage >= 50
            ? "Average"
            : "Needs Improvement";

    return {
      attendance: {
        totalDays,
        present,
        absent,
        late,
        rate: attendanceRate,
        recentTrend,
      },
      grades: {
        totalExams: validGrades.length,
        averagePercentage,
        averageGrade,
        passed: passedExams,
        failed: failedExams,
        bySubject: gradesBySubject,
        recentGrades: recentGrades.filter((g) => g !== null) as {
          exam: string;
          marks: number;
          total: number;
          grade: string;
          date: string;
        }[],
      },
      homework: {
        totalAssigned,
        submitted,
        graded,
        pending,
        averageScore,
        onTimeRate,
      },
      overall: {
        rank,
        totalStudents: classStudents.length,
        performanceLevel,
      },
    };
  } catch (error) {
    console.error("Error fetching student analytics:", error);
    throw new Error("Failed to fetch analytics");
  }
}
