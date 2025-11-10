"use server";

import { db } from "@/database";
import {
  attendance,
  studentGrades,
  exams,
  homework,
  homeworkSubmissions,
  students,
  users,
  classrooms,
  subjects,
  teacherAssignments,
} from "@/database/schema";
import { auth } from "@/lib/auth/main";
import { headers } from "next/headers";
import { eq, gte } from "drizzle-orm";

export interface AnalyticsData {
  attendance: {
    overall: number;
    byGrade: { grade: string; rate: number }[];
    trend: { date: string; rate: number }[];
  };
  grades: {
    averagePercentage: number;
    passingRate: number;
    bySubject: { subject: string; average: number }[];
    distribution: { grade: string; count: number }[];
  };
  homework: {
    totalAssigned: number;
    completionRate: number;
    onTimeRate: number;
    bySubject: { subject: string; completion: number }[];
  };
  exams: {
    totalConducted: number;
    averageScore: number;
    finalized: number;
    pending: number;
  };
  students: {
    total: number;
    active: number;
    byGrade: { grade: string; count: number }[];
  };
  teachers: {
    total: number;
    active: number;
    assignmentRate: number;
  };
}

export async function getAnalytics(days: number = 30) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Attendance Analytics
    const attendanceRecords = await db
      .select({
        date: attendance.date,
        status: attendance.status,
        classroomId: attendance.classroomId,
      })
      .from(attendance)
      .where(gte(attendance.date, startDate));

    const totalAttendance = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(
      (r) => r.status === "present",
    ).length;
    const overallAttendanceRate =
      totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

    // Attendance by grade
    const classroomData = await db
      .select({
        id: classrooms.id,
        grade: classrooms.grade,
      })
      .from(classrooms);

    const attendanceByGrade = classroomData.map((classroom) => {
      const classAttendance = attendanceRecords.filter(
        (r) => r.classroomId === classroom.id,
      );
      const classPresent = classAttendance.filter(
        (r) => r.status === "present",
      ).length;
      const rate =
        classAttendance.length > 0
          ? (classPresent / classAttendance.length) * 100
          : 0;
      return { grade: classroom.grade, rate };
    });

    // Attendance trend (last 7 days)
    const attendanceTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayAttendance = attendanceRecords.filter((r) => {
        const recordDate = new Date(r.date).toISOString().split("T")[0];
        return recordDate === dateStr;
      });

      const dayPresent = dayAttendance.filter(
        (r) => r.status === "present",
      ).length;
      const rate =
        dayAttendance.length > 0
          ? (dayPresent / dayAttendance.length) * 100
          : 0;

      attendanceTrend.push({ date: dateStr, rate });
    }

    // Grades Analytics
    const finalizedExams = await db
      .select({
        id: exams.id,
        totalMarks: exams.totalMarks,
        passingMarks: exams.passingMarks,
        subjectId: exams.subjectId,
      })
      .from(exams)
      .where(eq(exams.isFinalized, true));

    const allGrades = await db
      .select({
        marksObtained: studentGrades.marksObtained,
        percentage: studentGrades.percentage,
        grade: studentGrades.grade,
        isAbsent: studentGrades.isAbsent,
        examId: studentGrades.examId,
      })
      .from(studentGrades);

    const validGrades = allGrades.filter((g) => !g.isAbsent && g.percentage);
    const averagePercentage =
      validGrades.length > 0
        ? validGrades.reduce(
            (sum, g) => sum + parseFloat(g.percentage || "0"),
            0,
          ) / validGrades.length
        : 0;

    const passingGrades = validGrades.filter((g) => {
      const exam = finalizedExams.find((e) => e.id === g.examId);
      if (!exam) return false;
      const passingMarks = exam.passingMarks || exam.totalMarks * 0.4;
      return parseFloat(g.marksObtained || "0") >= passingMarks;
    });
    const passingRate =
      validGrades.length > 0
        ? (passingGrades.length / validGrades.length) * 100
        : 0;

    // Grades by subject
    const subjectData = await db
      .select({ id: subjects.id, name: subjects.name })
      .from(subjects);
    const gradesBySubject = subjectData
      .map((subject) => {
        const subjectExams = finalizedExams.filter(
          (e) => e.subjectId === subject.id,
        );
        const subjectGrades = allGrades.filter(
          (g) => subjectExams.some((e) => e.id === g.examId) && !g.isAbsent,
        );
        const average =
          subjectGrades.length > 0
            ? subjectGrades.reduce(
                (sum, g) => sum + parseFloat(g.percentage || "0"),
                0,
              ) / subjectGrades.length
            : 0;
        return { subject: subject.name, average };
      })
      .filter((s) => s.average > 0);

    // Grade distribution
    const gradeDistribution = [
      { grade: "A+", count: allGrades.filter((g) => g.grade === "A+").length },
      { grade: "A", count: allGrades.filter((g) => g.grade === "A").length },
      { grade: "B+", count: allGrades.filter((g) => g.grade === "B+").length },
      { grade: "B", count: allGrades.filter((g) => g.grade === "B").length },
      { grade: "C", count: allGrades.filter((g) => g.grade === "C").length },
      { grade: "D", count: allGrades.filter((g) => g.grade === "D").length },
      { grade: "F", count: allGrades.filter((g) => g.grade === "F").length },
    ].filter((d) => d.count > 0);

    // Homework Analytics
    const allHomework = await db
      .select({
        id: homework.id,
        subjectId: homework.subjectId,
        dueDate: homework.dueDate,
      })
      .from(homework)
      .where(gte(homework.assignedDate, startDate));

    const allSubmissions = await db
      .select({
        homeworkId: homeworkSubmissions.homeworkId,
        submittedAt: homeworkSubmissions.submittedAt,
        status: homeworkSubmissions.status,
      })
      .from(homeworkSubmissions);

    const totalHomework = allHomework.length;
    const completedSubmissions = allSubmissions.filter(
      (s) => s.status === "graded" || s.status === "submitted",
    );
    const completionRate =
      totalHomework > 0
        ? (completedSubmissions.length / (totalHomework * 30)) * 100
        : 0; // Assuming avg 30 students

    const onTimeSubmissions = allSubmissions.filter((s) => {
      const hw = allHomework.find((h) => h.id === s.homeworkId);
      if (!hw || !s.submittedAt) return false;
      return new Date(s.submittedAt) <= new Date(hw.dueDate);
    });
    const onTimeRate =
      allSubmissions.length > 0
        ? (onTimeSubmissions.length / allSubmissions.length) * 100
        : 0;

    // Homework by subject
    const homeworkBySubject = subjectData
      .map((subject) => {
        const subjectHomework = allHomework.filter(
          (h) => h.subjectId === subject.id,
        );
        const subjectSubmissions = allSubmissions.filter((s) =>
          subjectHomework.some((h) => h.id === s.homeworkId),
        );
        const completion =
          subjectHomework.length > 0
            ? (subjectSubmissions.length / (subjectHomework.length * 30)) * 100
            : 0;
        return { subject: subject.name, completion };
      })
      .filter((s) => s.completion > 0);

    // Exam Analytics
    const allExams = await db.select().from(exams);
    const totalConducted = allExams.length;
    const finalizedCount = allExams.filter((e) => e.isFinalized).length;
    const pendingCount = totalConducted - finalizedCount;

    const examGrades = await db
      .select({
        marksObtained: studentGrades.marksObtained,
        examId: studentGrades.examId,
      })
      .from(studentGrades)
      .where(eq(studentGrades.isAbsent, false));

    const averageScore =
      examGrades.length > 0
        ? examGrades.reduce(
            (sum, g) => sum + parseFloat(g.marksObtained || "0"),
            0,
          ) / examGrades.length
        : 0;

    // Student Analytics
    const allStudents = await db
      .select({ id: students.id, classroomId: students.classroomId })
      .from(students);
    const activeStudents = await db
      .select({ userId: students.userId })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .where(eq(users.isActive, true));

    const studentsByGrade = classroomData
      .map((classroom) => ({
        grade: classroom.grade,
        count: allStudents.filter((s) => s.classroomId === classroom.id).length,
      }))
      .filter((g) => g.count > 0);

    // Teacher Analytics
    const allTeachers = await db
      .select()
      .from(users)
      .where(eq(users.role, "teacher"));

    const assignments = await db.select().from(teacherAssignments);
    const assignmentRate =
      allTeachers.length > 0
        ? (assignments.length / (allTeachers.length * 3)) * 100
        : 0; // Assuming avg 3 assignments per teacher

    const analyticsData: AnalyticsData = {
      attendance: {
        overall: overallAttendanceRate,
        byGrade: attendanceByGrade,
        trend: attendanceTrend,
      },
      grades: {
        averagePercentage,
        passingRate,
        bySubject: gradesBySubject,
        distribution: gradeDistribution,
      },
      homework: {
        totalAssigned: totalHomework,
        completionRate,
        onTimeRate,
        bySubject: homeworkBySubject,
      },
      exams: {
        totalConducted,
        averageScore,
        finalized: finalizedCount,
        pending: pendingCount,
      },
      students: {
        total: allStudents.length,
        active: activeStudents.length,
        byGrade: studentsByGrade,
      },
      teachers: {
        total: allTeachers.length,
        active: allTeachers.filter((t) => t.isActive).length,
        assignmentRate,
      },
    };

    return { success: true, data: analyticsData };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return { success: false, error: "Failed to fetch analytics" };
  }
}
