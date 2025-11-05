import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import {
  teacherAssignments,
  students,
  attendance,
  homework,
  homeworkSubmissions,
  exams,
  studentGrades,
  workDone,
  subjects,
  classrooms,
} from "@/database/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, gte } from "drizzle-orm";
import { unauthorized } from "next/navigation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      unauthorized();
    }

    const { id: teacherId } = await params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get teacher's assignments
    const assignments = await db
      .select({
        id: teacherAssignments.id,
        classroomId: teacherAssignments.classroomId,
        subjectId: teacherAssignments.subjectId,
        isPrimary: teacherAssignments.isPrimary,
      })
      .from(teacherAssignments)
      .where(eq(teacherAssignments.teacherId, teacherId));

    const classroomIds = [...new Set(assignments.map((a) => a.classroomId))];
    const subjectIds = [...new Set(assignments.map((a) => a.subjectId))];

    // Get classroom and subject details
    const classroomData = await db
      .select({ id: classrooms.id, name: classrooms.name })
      .from(classrooms)
      .where(eq(classrooms.id, classroomIds[0] || ""));

    const subjectData = await db
      .select({ id: subjects.id, name: subjects.name })
      .from(subjects);

    // Students in teacher's classes
    const classStudents = await db
      .select({ id: students.id, classroomId: students.classroomId })
      .from(students);

    const teacherStudents = classStudents.filter(
      (s) => s.classroomId && classroomIds.includes(s.classroomId),
    );

    // Classes analytics
    const isPrimaryTeacher = assignments.some((a) => a.isPrimary);

    // Attendance analytics
    const teacherAttendance = await db
      .select({
        status: attendance.status,
        classroomId: attendance.classroomId,
        markedBy: attendance.markedBy,
      })
      .from(attendance)
      .where(
        and(
          eq(attendance.markedBy, teacherId),
          gte(attendance.date, startDate),
        ),
      );

    const totalMarked = teacherAttendance.length;
    const presentCount = teacherAttendance.filter(
      (a) => a.status === "present",
    ).length;
    const averageRate =
      totalMarked > 0 ? (presentCount / totalMarked) * 100 : 0;

    // Attendance by class
    const attendanceByClass = classroomData.map((classroom) => {
      const classAttendance = teacherAttendance.filter(
        (a) => a.classroomId === classroom.id,
      );
      const classPresent = classAttendance.filter(
        (a) => a.status === "present",
      ).length;
      const rate =
        classAttendance.length > 0
          ? (classPresent / classAttendance.length) * 100
          : 0;
      return { className: classroom.name, rate };
    });

    // Homework analytics
    const teacherHomework = await db
      .select({
        id: homework.id,
        subjectId: homework.subjectId,
      })
      .from(homework)
      .where(
        and(
          eq(homework.teacherId, teacherId),
          gte(homework.assignedDate, startDate),
        ),
      );

    const homeworkIds = teacherHomework.map((h) => h.id);
    const submissions = await db
      .select({
        homeworkId: homeworkSubmissions.homeworkId,
        status: homeworkSubmissions.status,
        gradedBy: homeworkSubmissions.gradedBy,
      })
      .from(homeworkSubmissions);

    const teacherSubmissions = submissions.filter((s) =>
      homeworkIds.includes(s.homeworkId),
    );
    const gradedSubmissions = teacherSubmissions.filter(
      (s) => s.status === "graded" && s.gradedBy === teacherId,
    );
    const pendingSubmissions = teacherSubmissions.filter(
      (s) => s.status === "submitted" && !s.gradedBy,
    );

    const completionRate =
      teacherHomework.length > 0
        ? (teacherSubmissions.length /
            (teacherHomework.length * teacherStudents.length)) *
          100
        : 0;

    // Exam analytics
    const teacherExams = await db
      .select({
        id: exams.id,
        isFinalized: exams.isFinalized,
        subjectId: exams.subjectId,
        classroomId: exams.classroomId,
      })
      .from(exams)
      .where(eq(exams.isFinalized, false));

    const availableExams = teacherExams.filter((e) =>
      assignments.some(
        (a) => a.subjectId === e.subjectId && a.classroomId === e.classroomId,
      ),
    );

    const teacherGrades = await db
      .select({
        id: studentGrades.id,
        uploadedBy: studentGrades.uploadedBy,
        studentId: studentGrades.studentId,
      })
      .from(studentGrades)
      .where(eq(studentGrades.uploadedBy, teacherId));

    const uniqueStudentsGraded = [
      ...new Set(teacherGrades.map((g) => g.studentId)),
    ].length;

    // Work Done analytics
    const teacherWorkDone = await db
      .select({
        id: workDone.id,
        subjectId: workDone.subjectId,
      })
      .from(workDone)
      .where(
        and(
          eq(workDone.teacherId, teacherId),
          gte(workDone.date, startDate.toISOString().split("T")[0]),
        ),
      );

    const workDoneBySubject = subjectIds
      .map((subjectId) => {
        const subject = subjectData.find((s) => s.id === subjectId);
        const count = teacherWorkDone.filter(
          (w) => w.subjectId === subjectId,
        ).length;
        return {
          subject: subject?.name || "Unknown",
          count,
        };
      })
      .filter((s) => s.count > 0);

    const analyticsData = {
      classes: {
        total: assignments.length,
        students: teacherStudents.length,
        subjects: subjectIds.length,
        isPrimary: isPrimaryTeacher,
      },
      attendance: {
        totalMarked,
        averageRate,
        byClass: attendanceByClass,
      },
      homework: {
        totalAssigned: teacherHomework.length,
        totalSubmissions: teacherSubmissions.length,
        graded: gradedSubmissions.length,
        pending: pendingSubmissions.length,
        completionRate,
      },
      exams: {
        canUpload: availableExams.length,
        gradesUploaded: teacherGrades.length,
        studentsGraded: uniqueStudentsGraded,
      },
      workDone: {
        totalRecords: teacherWorkDone.length,
        bySubject: workDoneBySubject,
      },
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error("Error fetching teacher analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
