import { NextResponse } from 'next/server';
import { db } from '@/database';
import {
  students,
  attendance,
  studentGrades,
  exams,
  homework,
  homeworkSubmissions,
  subjects,
} from '@/database/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get student record
    const [studentRecord] = await db
      .select()
      .from(students)
      .where(eq(students.userId, session.user.id));

    if (!studentRecord) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
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
    const present = studentAttendance.filter((a) => a.status === 'present').length;
    const absent = studentAttendance.filter((a) => a.status === 'absent').length;
    const late = studentAttendance.filter((a) => a.status === 'late').length;
    const attendanceRate = totalDays > 0 ? (present / totalDays) * 100 : 0;

    const recentTrend = studentAttendance
      .slice(-7)
      .map((a) => ({
        date: new Date(a.date).toISOString().split('T')[0],
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

    const validGrades = studentGradesData.filter((g) => !g.isAbsent && g.percentage);
    const averagePercentage =
      validGrades.length > 0
        ? validGrades.reduce((sum, g) => sum + parseFloat(g.percentage || '0'), 0) / validGrades.length
        : 0;

    // Calculate average grade
    const getLetterGrade = (percentage: number): string => {
      if (percentage >= 90) return 'A+';
      if (percentage >= 80) return 'A';
      if (percentage >= 70) return 'B+';
      if (percentage >= 60) return 'B';
      if (percentage >= 50) return 'C+';
      if (percentage >= 40) return 'C';
      if (percentage >= 33) return 'D';
      return 'F';
    };

    const averageGrade = getLetterGrade(averagePercentage);

    const passedExams = validGrades.filter((g) => {
      const exam = finalizedExamsData.find((e) => e.id === g.examId);
      if (!exam) return false;
      const passingMarks = exam.passingMarks || exam.totalMarks * 0.4;
      return parseFloat(g.marksObtained || '0') >= passingMarks;
    }).length;

    const failedExams = validGrades.length - passedExams;

    // Grades by subject
    const subjectData = await db.select({ id: subjects.id, name: subjects.name }).from(subjects);
    const gradesBySubject = subjectData
      .map((subject) => {
        const subjectExams = finalizedExamsData.filter((e) => e.subjectId === subject.id);
        const subjectGrades = studentGradesData.filter(
          (g) => subjectExams.some((e) => e.id === g.examId) && !g.isAbsent
        );
        const average =
          subjectGrades.length > 0
            ? subjectGrades.reduce((sum, g) => sum + parseFloat(g.percentage || '0'), 0) /
              subjectGrades.length
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
          marks: parseFloat(grade.marksObtained || '0'),
          total: exam.totalMarks,
          grade: grade.grade || '',
          date: new Date(exam.examDate).toISOString().split('T')[0],
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
      .where(eq(homework.classroomId, studentRecord.classroomId || ''));

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
    const graded = studentSubmissions.filter((s) => s.status === 'graded').length;
    const pending = totalAssigned - submitted;

    const gradedSubmissions = studentSubmissions.filter((s) => s.marksObtained);
    const averageScore =
      gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum, s) => sum + parseInt(String(s.marksObtained) || '0'), 0) /
          gradedSubmissions.length
        : 0;

    const onTimeSubmissions = studentSubmissions.filter((s) => {
      const hw = studentHomework.find((h) => h.id === s.homeworkId);
      if (!hw || !s.submittedAt) return false;
      return new Date(s.submittedAt) <= new Date(hw.dueDate);
    }).length;
    const onTimeRate = studentSubmissions.length > 0 ? (onTimeSubmissions / studentSubmissions.length) * 100 : 0;

    // Overall performance
    const classStudents = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.classroomId, studentRecord.classroomId || ''));

    // Simple rank calculation based on average percentage
    const allStudentGrades = await db
      .select({
        studentId: studentGrades.studentId,
        percentage: studentGrades.percentage,
        isAbsent: studentGrades.isAbsent,
      })
      .from(studentGrades);

    const studentAverages = classStudents.map((student) => {
      const grades = allStudentGrades.filter((g) => g.studentId === student.id && !g.isAbsent);
      const avg =
        grades.length > 0
          ? grades.reduce((sum, g) => sum + parseFloat(g.percentage || '0'), 0) / grades.length
          : 0;
      return { studentId: student.id, average: avg };
    });

    studentAverages.sort((a, b) => b.average - a.average);
    const rank = studentAverages.findIndex((s) => s.studentId === studentRecord.id) + 1;

    const performanceLevel =
      averagePercentage >= 85
        ? 'Excellent'
        : averagePercentage >= 70
        ? 'Good'
        : averagePercentage >= 50
        ? 'Average'
        : 'Needs Improvement';

    const analyticsData = {
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
        recentGrades,
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

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error fetching student analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
