"use server";

import { db } from "@/database";
import {
  teacherAssignments,
  classrooms,
  messages,
  teacherLeaves,
  substituteAssignments,
  workDone,
  classroomMessages,
  homework,
  homeworkSubmissions,
  exams,
  studentGrades,
  students,
  attendance,
  timetable,
  subjects,
} from "@/database/schema";
import { eq, and, desc, gte, count, sql } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

export interface TeacherAssignment {
  id: string;
  classroomId: string;
  isPrimary: boolean | null;
  classroom: {
    id: string;
    name: string;
    grade: string;
    section: string;
    currentStrength: number | null;
  };
  subject: {
    id: string;
    name: string;
    code: string;
  };
}

export interface Message {
  id: string;
  subject: string;
  message: string;
  messageType: string | null;
  status: string | null;
  createdAt: string;
  senderName: string;
  senderEmail: string;
}

export interface TeacherLeave {
  id: string;
  teacherId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  approvedBy?: string;
  approvalNotes?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface SubstituteAssignment {
  id: string;
  originalTeacherId: string;
  originalTeacherName: string;
  classroomId: string;
  classroomName: string;
  classroomGrade: string;
  classroomSection: string;
  subjectId: string;
  subjectName: string;
  date: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  reason?: string;
}

export interface WorkDone {
  id: string;
  classroomId: string;
  classroomName: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName?: string;
  date: string;
  periodNumber: number;
  topicsCovered: string;
  homeworkAssigned?: string;
  remarks?: string;
  isSubstitute: boolean | null;
  createdAt: string;
}

export interface ClassroomMessage {
  id: string;
  classroomId: string;
  teacherId: string;
  content: string;
  messageType: string;
  date: string;
  createdAt: string;
  classroom?: {
    id: string;
    name: string;
  };
}

export interface HomeworkItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  totalMarks: number;
  createdAt: string;
  classroom: {
    id: string;
    name: string;
    grade: string;
    section: string;
  };
  subject: {
    id: string;
    name: string;
  };
  submissionCount: number;
  totalStudents: number;
}

export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  submittedAt: string;
  submissionText?: string;
  attachments?: string;
  marksObtained?: number;
  feedback?: string;
  gradedAt?: string;
  student: {
    id: string;
    rollNumber: string;
    user: {
      name: string;
      email: string;
    };
  };
}

export interface ExamItem {
  id: string;
  name: string;
  examDate: string;
  duration: number | null;
  totalMarks: number;
  isFinalized: boolean | null;
  createdAt: string;
  classroom: {
    id: string;
    name: string;
    grade: string;
    section: string;
  };
  subject: {
    id: string;
    name: string;
  };
  gradedCount: number;
  totalStudents: number;
}

export interface ExamGrade {
  id: string;
  examId: string;
  studentId: string;
  marksObtained: number;
  remarks?: string;
  gradedAt: string;
  student: {
    id: string;
    rollNumber: string;
    user: {
      name: string;
      email: string;
    };
  };
}

export interface TeacherAnalytics {
  totalClasses: number;
  totalStudents: number;
  homeworkAssigned: number;
  examsScheduled: number;
  leavesTaken: number;
  substituteDuties: number;
  attendanceRate: number;
  recentActivity: {
    type: string;
    description: string;
    date: string;
  }[];
}

export interface ClassroomDetail {
  id: string;
  name: string;
  grade: string;
  section: string;
  currentStrength: number;
  subjects: {
    id: string;
    name: string;
    code: string;
  }[];
  students: {
    id: string;
    rollNumber: string;
    dateOfBirth: string;
    user: {
      name: string;
      email: string;
    };
  }[];
  recentAttendance: {
    date: string;
    presentCount: number;
    absentCount: number;
    lateCount: number;
  }[];
}

// ============================================================================
// TEACHER ASSIGNMENTS
// ============================================================================

export async function getTeacherAssignments(
  teacherId: string,
): Promise<TeacherAssignment[]> {
  try {
    const assignments = await db.query.teacherAssignments.findMany({
      where: eq(teacherAssignments.teacherId, teacherId),
      with: {
        classroom: true,
        subject: true,
      },
    });

    return assignments.map((a) => ({
      id: a.id,
      classroomId: a.classroomId,
      isPrimary: a.isPrimary,
      classroom: {
        id: a.classroom.id,
        name: `Class ${a.classroom.grade}${a.classroom.section}`,
        grade: a.classroom.grade,
        section: a.classroom.section,
        currentStrength: a.classroom.currentStrength,
      },
      subject: {
        id: a.subject.id,
        name: a.subject.name,
        code: a.subject.code,
      },
    }));
  } catch (error) {
    console.error("Error fetching teacher assignments:", error);
    return [];
  }
}

// ============================================================================
// MESSAGES
// ============================================================================

export async function getTeacherMessages(userId: string): Promise<Message[]> {
  try {
    const messageList = await db.query.messages.findMany({
      where: eq(messages.receiverId, userId),
      orderBy: [desc(messages.createdAt)],
      limit: 50,
      with: {
        sender: true,
      },
    });

    return messageList.map((m) => ({
      id: m.id,
      subject: m.subject,
      message: m.message,
      messageType: m.messageType,
      status: m.status,
      createdAt: m.createdAt?.toISOString() || "",
      senderName: m.sender?.name || "Unknown",
      senderEmail: m.sender?.email || "",
    }));
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
}

// ============================================================================
// LEAVES
// ============================================================================

export async function getTeacherLeaves(
  teacherId: string,
): Promise<TeacherLeave[]> {
  try {
    const leaves = await db.query.teacherLeaves.findMany({
      where: eq(teacherLeaves.teacherId, teacherId),
      orderBy: [desc(teacherLeaves.createdAt)],
    });

    return leaves.map((l) => ({
      id: l.id,
      teacherId: l.teacherId,
      leaveType: l.leaveType,
      startDate: new Date(l.startDate).toISOString().split("T")[0],
      endDate: new Date(l.endDate).toISOString().split("T")[0],
      reason: l.reason,
      status: l.status,
      approvedBy: l.approvedBy || undefined,
      approvalNotes: l.approvalNotes || undefined,
      approvedAt: l.approvedAt?.toISOString(),
      createdAt: l.createdAt?.toISOString() || "",
    }));
  } catch (error) {
    console.error("Error fetching teacher leaves:", error);
    return [];
  }
}

export async function createTeacherLeave(data: {
  teacherId: string;
  leaveType: "casual" | "sick" | "earned" | "duty" | "emergency";
  startDate: string;
  endDate: string;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await db.insert(teacherLeaves).values({
      teacherId: data.teacherId,
      leaveType: data.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      status: "pending",
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating leave request:", error);
    return { success: false, error: "Failed to create leave request" };
  }
}

export async function cancelTeacherLeave(
  leaveId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(teacherLeaves)
      .set({ status: "cancelled" })
      .where(eq(teacherLeaves.id, leaveId));

    return { success: true };
  } catch (error) {
    console.error("Error cancelling leave:", error);
    return { success: false, error: "Failed to cancel leave" };
  }
}

// ============================================================================
// SUBSTITUTE ASSIGNMENTS
// ============================================================================

export async function getSubstituteAssignments(
  substituteTeacherId: string,
): Promise<SubstituteAssignment[]> {
  try {
    const assignments = await db.query.substituteAssignments.findMany({
      where: eq(substituteAssignments.substituteTeacherId, substituteTeacherId),
      orderBy: [substituteAssignments.date, substituteAssignments.periodNumber],
      with: {
        classroom: true,
        subject: true,
        originalTeacher: true,
      },
    });

    return assignments.map((a) => ({
      id: a.id,
      originalTeacherId: a.originalTeacherId,
      originalTeacherName: a.originalTeacher?.name || "Unknown",
      classroomId: a.classroomId,
      classroomName: `Class ${a.classroom.grade}${a.classroom.section}`,
      classroomGrade: a.classroom.grade,
      classroomSection: a.classroom.section,
      subjectId: a.subjectId,
      subjectName: a.subject?.name || "Unknown",
      date: new Date(a.date).toISOString().split("T")[0],
      periodNumber: a.periodNumber,
      startTime: a.startTime,
      endTime: a.endTime,
      reason: a.reason || undefined,
    }));
  } catch (error) {
    console.error("Error fetching substitute assignments:", error);
    return [];
  }
}

// ============================================================================
// WORK DONE
// ============================================================================

export async function getWorkDoneByTeacher(
  teacherId: string,
): Promise<WorkDone[]> {
  try {
    const records = await db.query.workDone.findMany({
      where: eq(workDone.teacherId, teacherId),
      orderBy: [desc(workDone.date), desc(workDone.periodNumber)],
      with: {
        classroom: true,
        subject: true,
        teacher: true,
      },
    });

    return records.map((r) => ({
      id: r.id,
      classroomId: r.classroomId,
      classroomName: `Class ${r.classroom.grade}${r.classroom.section}`,
      subjectId: r.subjectId,
      subjectName: r.subject?.name || "Unknown",
      teacherId: r.teacherId,
      teacherName: r.teacher?.name,
      date: new Date(r.date).toISOString().split("T")[0],
      periodNumber: r.periodNumber,
      topicsCovered: r.topicsCovered,
      homeworkAssigned: r.homeworkAssigned || undefined,
      remarks: r.remarks || undefined,
      isSubstitute: r.isSubstitute,
      createdAt: r.createdAt?.toISOString() || "",
    }));
  } catch (error) {
    console.error("Error fetching work done records:", error);
    return [];
  }
}

export async function getWorkDoneByClassroom(
  classroomId: string,
): Promise<WorkDone[]> {
  try {
    const records = await db.query.workDone.findMany({
      where: eq(workDone.classroomId, classroomId),
      orderBy: [desc(workDone.date), desc(workDone.periodNumber)],
      with: {
        classroom: true,
        subject: true,
        teacher: true,
      },
    });

    return records.map((r) => ({
      id: r.id,
      classroomId: r.classroomId,
      classroomName: `Class ${r.classroom.grade}${r.classroom.section}`,
      subjectId: r.subjectId,
      subjectName: r.subject?.name || "Unknown",
      teacherId: r.teacherId,
      teacherName: r.teacher?.name,
      date: new Date(r.date).toISOString().split("T")[0],
      periodNumber: r.periodNumber,
      topicsCovered: r.topicsCovered,
      homeworkAssigned: r.homeworkAssigned || undefined,
      remarks: r.remarks || undefined,
      isSubstitute: r.isSubstitute,
      createdAt: r.createdAt?.toISOString() || "",
    }));
  } catch (error) {
    console.error("Error fetching classroom work done:", error);
    return [];
  }
}

export async function createWorkDone(data: {
  classroomId: string;
  subjectId: string;
  teacherId: string;
  date: string;
  periodNumber: number;
  topicsCovered: string;
  homeworkAssigned?: string;
  remarks?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await db.insert(workDone).values({
      classroomId: data.classroomId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      date: data.date,
      periodNumber: data.periodNumber,
      topicsCovered: data.topicsCovered,
      homeworkAssigned: data.homeworkAssigned || null,
      remarks: data.remarks || null,
      isSubstitute: false,
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating work done record:", error);
    return { success: false, error: "Failed to create work done record" };
  }
}

// ============================================================================
// CLASSROOM MESSAGES
// ============================================================================

export async function getClassroomMessages(
  classroomId: string,
): Promise<ClassroomMessage[]> {
  try {
    const messagesList = await db.query.classroomMessages.findMany({
      where: eq(classroomMessages.classroomId, classroomId),
      orderBy: [desc(classroomMessages.createdAt)],
      with: {
        classroom: true,
      },
    });

    return messagesList.map((m) => ({
      id: m.id,
      classroomId: m.classroomId,
      teacherId: m.teacherId,
      content: m.content,
      messageType: m.messageType,
      date: m.date ? new Date(m.date).toISOString().split("T")[0] : "",
      createdAt: m.createdAt?.toISOString() || "",
      classroom: m.classroom
        ? {
            id: m.classroom.id,
            name: `Class ${m.classroom.grade}${m.classroom.section}`,
          }
        : undefined,
    }));
  } catch (error) {
    console.error("Error fetching classroom messages:", error);
    return [];
  }
}

export async function createClassroomMessage(data: {
  classroomId: string;
  teacherId: string;
  content: string;
  messageType: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await db.insert(classroomMessages).values({
      classroomId: data.classroomId,
      teacherId: data.teacherId,
      content: data.content,
      messageType: data.messageType,
      date: new Date(),
      isActive: true,
      createdAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating classroom message:", error);
    return { success: false, error: "Failed to create message" };
  }
}

// ============================================================================
// HOMEWORK
// ============================================================================

export async function getTeacherHomework(
  teacherId: string,
): Promise<HomeworkItem[]> {
  try {
    const homeworkList = await db.query.homework.findMany({
      where: eq(homework.teacherId, teacherId),
      orderBy: [desc(homework.createdAt)],
      with: {
        classroom: true,
        subject: true,
      },
    });

    // Get submission counts
    const homeworkWithCounts = await Promise.all(
      homeworkList.map(async (hw) => {
        const [submissionData] = await db
          .select({ count: count() })
          .from(homeworkSubmissions)
          .where(eq(homeworkSubmissions.homeworkId, hw.id));

        const [studentData] = await db
          .select({ count: count() })
          .from(students)
          .where(eq(students.classroomId, hw.classroomId));

        return {
          id: hw.id,
          title: hw.title,
          description: hw.description,
          dueDate: hw.dueDate.toISOString(),
          totalMarks: hw.totalMarks || 0,
          createdAt: hw.createdAt?.toISOString() || "",
          classroom: {
            id: hw.classroom.id,
            name: `Class ${hw.classroom.grade}${hw.classroom.section}`,
            grade: hw.classroom.grade,
            section: hw.classroom.section,
          },
          subject: {
            id: hw.subject?.id || "",
            name: hw.subject?.name || "Unknown",
          },
          submissionCount: submissionData?.count || 0,
          totalStudents: studentData?.count || 0,
        };
      }),
    );

    return homeworkWithCounts;
  } catch (error) {
    console.error("Error fetching homework:", error);
    return [];
  }
}

export async function createHomework(data: {
  classroomId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description: string;
  dueDate: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await db.insert(homework).values({
      classroomId: data.classroomId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      title: data.title,
      description: data.description,
      dueDate: new Date(data.dueDate),
      createdAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating homework:", error);
    return { success: false, error: "Failed to create homework" };
  }
}

export async function getHomeworkSubmissions(
  homeworkId: string,
): Promise<HomeworkSubmission[]> {
  try {
    const submissions = await db.query.homeworkSubmissions.findMany({
      where: eq(homeworkSubmissions.homeworkId, homeworkId),
      with: {
        student: {
          with: {
            user: true,
          },
        },
      },
    });

    return submissions.map((s) => ({
      id: s.id,
      homeworkId: s.homeworkId,
      studentId: s.studentId,
      submittedAt: s.submittedAt?.toISOString() || "",
      submissionText: s.submissionText || undefined,
      attachments: s.attachments || undefined,
      marksObtained: s.marksObtained || undefined,
      feedback: s.feedback || undefined,
      gradedAt: s.gradedAt?.toISOString(),
      student: {
        id: s.student.id,
        rollNumber: s.student.rollNumber,
        user: {
          name: s.student.user.name,
          email: s.student.user.email,
        },
      },
    }));
  } catch (error) {
    console.error("Error fetching homework submissions:", error);
    return [];
  }
}

export async function gradeHomeworkSubmission(data: {
  submissionId: string;
  marksObtained: number;
  feedback?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(homeworkSubmissions)
      .set({
        marksObtained: data.marksObtained,
        feedback: data.feedback || null,
        gradedAt: new Date(),
        status: "graded",
      })
      .where(eq(homeworkSubmissions.id, data.submissionId));

    return { success: true };
  } catch (error) {
    console.error("Error grading submission:", error);
    return { success: false, error: "Failed to grade submission" };
  }
}

export async function createHomeworkSubmission(data: {
  homeworkId: string;
  studentId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await db.insert(homeworkSubmissions).values({
      homeworkId: data.homeworkId,
      studentId: data.studentId,
      status: "submitted",
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating homework submission:", error);
    return { success: false, error: "Failed to mark submission" };
  }
}

export async function deleteHomeworkSubmission(
  submissionId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .delete(homeworkSubmissions)
      .where(eq(homeworkSubmissions.id, submissionId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting submission:", error);
    return { success: false, error: "Failed to delete submission" };
  }
}

export async function getClassroomStudents(
  classroomId: string,
): Promise<
  Array<{
    id: string;
    rollNumber: string;
    user: { name: string; email: string };
  }>
> {
  try {
    const studentsList = await db.query.students.findMany({
      where: eq(students.classroomId, classroomId),
      with: { user: true },
    });

    return studentsList.map((s) => ({
      id: s.id,
      rollNumber: s.rollNumber,
      user: {
        name: s.user.name,
        email: s.user.email,
      },
    }));
  } catch (error) {
    console.error("Error fetching classroom students:", error);
    return [];
  }
}

// ============================================================================
// EXAMS
// ============================================================================

export async function getTeacherExams(teacherId: string): Promise<ExamItem[]> {
  try {
    // Get all exams for classrooms where this teacher teaches
    const teacherClasses = await db.query.teacherAssignments.findMany({
      where: eq(teacherAssignments.teacherId, teacherId),
      columns: {
        classroomId: true,
      },
    });

    const classroomIds = teacherClasses.map((tc) => tc.classroomId);

    if (classroomIds.length === 0) {
      return [];
    }

    const examsList = await db.query.exams.findMany({
      orderBy: [desc(exams.examDate)],
      with: {
        classroom: true,
        subject: true,
      },
    });

    // Filter exams for teacher's classrooms
    const filteredExams = examsList.filter((exam) =>
      classroomIds.includes(exam.classroomId),
    );

    const examsWithCounts = await Promise.all(
      filteredExams.map(async (exam) => {
        const [gradeData] = await db
          .select({ count: count() })
          .from(studentGrades)
          .where(eq(studentGrades.examId, exam.id));

        const [studentData] = await db
          .select({ count: count() })
          .from(students)
          .where(eq(students.classroomId, exam.classroomId));

        return {
          id: exam.id,
          name: exam.name,
          examDate: exam.examDate.toISOString(),
          duration: exam.duration,
          totalMarks: exam.totalMarks,
          isFinalized: exam.isFinalized,
          createdAt: exam.createdAt?.toISOString() || "",
          classroom: {
            id: exam.classroom.id,
            name: `Class ${exam.classroom.grade}${exam.classroom.section}`,
            grade: exam.classroom.grade,
            section: exam.classroom.section,
          },
          subject: {
            id: exam.subject?.id || "",
            name: exam.subject?.name || "Unknown",
          },
          gradedCount: gradeData?.count || 0,
          totalStudents: studentData?.count || 0,
        };
      }),
    );

    return examsWithCounts;
  } catch (error) {
    console.error("Error fetching exams:", error);
    return [];
  }
}

export async function createExam(data: {
  classroomId: string;
  subjectId: string;
  teacherId: string;
  name: string;
  examType: "class_test" | "unit_test" | "quarterly" | "midterm" | "final_exam";
  examDate: string;
  duration: number;
  totalMarks: number;
  academicYear: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await db.insert(exams).values({
      classroomId: data.classroomId,
      subjectId: data.subjectId,
      createdBy: data.teacherId,
      name: data.name,
      examType: data.examType,
      examDate: new Date(data.examDate),
      duration: data.duration,
      totalMarks: data.totalMarks,
      academicYear: data.academicYear,
      isFinalized: false,
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating exam:", error);
    return { success: false, error: "Failed to create exam" };
  }
}

export async function getExamGrades(examId: string): Promise<ExamGrade[]> {
  try {
    const grades = await db.query.studentGrades.findMany({
      where: eq(studentGrades.examId, examId),
      with: {
        student: {
          with: {
            user: true,
          },
        },
      },
    });

    return grades.map((g) => ({
      id: g.id,
      examId: g.examId,
      studentId: g.studentId,
      marksObtained: parseFloat(g.marksObtained),
      remarks: g.remarks || undefined,
      gradedAt: g.uploadedAt?.toISOString() || "",
      student: {
        id: g.student.id,
        rollNumber: g.student.rollNumber,
        user: {
          name: g.student.user.name,
          email: g.student.user.email,
        },
      },
    }));
  } catch (error) {
    console.error("Error fetching exam grades:", error);
    return [];
  }
}

export async function createExamGrade(data: {
  examId: string;
  studentId: string;
  marksObtained: number;
  uploadedBy: string;
  remarks?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await db.insert(studentGrades).values({
      examId: data.examId,
      studentId: data.studentId,
      marksObtained: data.marksObtained.toString(),
      remarks: data.remarks || null,
      uploadedBy: data.uploadedBy,
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating exam grade:", error);
    return { success: false, error: "Failed to create grade" };
  }
}

export async function finalizeExam(
  examId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(exams)
      .set({ isFinalized: true })
      .where(eq(exams.id, examId));

    return { success: true };
  } catch (error) {
    console.error("Error finalizing exam:", error);
    return { success: false, error: "Failed to finalize exam" };
  }
}

// ============================================================================
// ANALYTICS
// ============================================================================

export async function getTeacherAnalytics(
  teacherId: string,
): Promise<TeacherAnalytics> {
  try {
    // Get assignments count
    const [assignmentsData] = await db
      .select({ count: count() })
      .from(teacherAssignments)
      .where(eq(teacherAssignments.teacherId, teacherId));

    // Get total students from all assigned classrooms
    const assignedClassrooms = await db.query.teacherAssignments.findMany({
      where: eq(teacherAssignments.teacherId, teacherId),
    });

    const classroomIds = assignedClassrooms.map((a) => a.classroomId);
    const totalStudents =
      classroomIds.length > 0
        ? await db
            .select({ count: count() })
            .from(students)
            .where(
              sql`${students.classroomId} IN ${sql.raw(`(${classroomIds.map((id) => `'${id}'`).join(",")})`)}`,
            )
        : [{ count: 0 }];

    // Get homework count
    const [homeworkData] = await db
      .select({ count: count() })
      .from(homework)
      .where(eq(homework.teacherId, teacherId));

    // Get exams count for teacher's classrooms
    const teacherClassrooms = await db.query.teacherAssignments.findMany({
      where: eq(teacherAssignments.teacherId, teacherId),
      columns: { classroomId: true },
    });

    const teacherClassroomIds = teacherClassrooms.map((tc) => tc.classroomId);
    const examsData =
      teacherClassroomIds.length > 0
        ? await db
            .select({ count: count() })
            .from(exams)
            .where(
              sql`${exams.classroomId} IN ${sql.raw(`(${teacherClassroomIds.map((id) => `'${id}'`).join(",")})`)}`,
            )
        : [{ count: 0 }];

    // Get leaves count
    const [leavesData] = await db
      .select({ count: count() })
      .from(teacherLeaves)
      .where(
        and(
          eq(teacherLeaves.teacherId, teacherId),
          eq(teacherLeaves.status, "approved"),
        ),
      );

    // Get substitute duties count
    const [substituteData] = await db
      .select({ count: count() })
      .from(substituteAssignments)
      .where(eq(substituteAssignments.substituteTeacherId, teacherId));

    // Calculate attendance rate (placeholder - would need actual logic)
    const attendanceRate = 95.5;

    // Get recent activity
    const recentHomework = await db.query.homework.findMany({
      where: eq(homework.teacherId, teacherId),
      orderBy: [desc(homework.createdAt)],
      limit: 3,
      with: { classroom: true, subject: true },
    });

    // Get recent exams for teacher's classrooms
    const recentExams =
      teacherClassroomIds.length > 0
        ? await db.query.exams.findMany({
            orderBy: [desc(exams.createdAt)],
            limit: 3,
            with: { classroom: true, subject: true },
          })
        : [];

    const filteredRecentExams = recentExams.filter((e) =>
      teacherClassroomIds.includes(e.classroomId),
    );

    const recentActivity = [
      ...recentHomework.map((h) => ({
        type: "homework",
        description: `Assigned "${h.title}" to ${h.classroom.name}`,
        date: h.createdAt?.toISOString() || "",
      })),
      ...filteredRecentExams.map((e) => ({
        type: "exam",
        description: `Created exam "${e.name}" for ${e.classroom.name}`,
        date: e.createdAt?.toISOString() || "",
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return {
      totalClasses: assignmentsData?.count || 0,
      totalStudents: totalStudents[0]?.count || 0,
      homeworkAssigned: homeworkData?.count || 0,
      examsScheduled: examsData[0]?.count || 0,
      leavesTaken: leavesData?.count || 0,
      substituteDuties: substituteData?.count || 0,
      attendanceRate,
      recentActivity,
    };
  } catch (error) {
    console.error("Error fetching teacher analytics:", error);
    return {
      totalClasses: 0,
      totalStudents: 0,
      homeworkAssigned: 0,
      examsScheduled: 0,
      leavesTaken: 0,
      substituteDuties: 0,
      attendanceRate: 0,
      recentActivity: [],
    };
  }
}

// ============================================================================
// CLASSROOM DETAILS
// ============================================================================

export async function getClassroomDetails(
  classroomId: string,
): Promise<ClassroomDetail | null> {
  try {
    const classroom = await db.query.classrooms.findFirst({
      where: eq(classrooms.id, classroomId),
    });

    if (!classroom) return null;

    // Get subjects for this classroom
    const subjectsList = await db.query.teacherAssignments.findMany({
      where: eq(teacherAssignments.classroomId, classroomId),
      with: { subject: true },
    });

    // Get students
    const studentsList = await db.query.students.findMany({
      where: eq(students.classroomId, classroomId),
      with: { user: true },
    });

    // Get recent attendance (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const attendanceRecords = await db.query.attendance.findMany({
      where: and(
        eq(attendance.classroomId, classroomId),
        gte(attendance.date, sevenDaysAgo),
      ),
    });

    // Group by date
    const attendanceByDate: { [key: string]: typeof attendanceRecords } = {};
    attendanceRecords.forEach((record) => {
      const dateKey = new Date(record.date).toISOString().split("T")[0];
      if (!attendanceByDate[dateKey]) {
        attendanceByDate[dateKey] = [];
      }
      attendanceByDate[dateKey].push(record);
    });

    const recentAttendance = Object.entries(attendanceByDate).map(
      ([date, records]) => ({
        date,
        presentCount: records.filter((r) => r.status === "present").length,
        absentCount: records.filter((r) => r.status === "absent").length,
        lateCount: records.filter((r) => r.status === "late").length,
      }),
    );

    return {
      id: classroom.id,
      name: `Class ${classroom.grade}${classroom.section}`,
      grade: classroom.grade,
      section: classroom.section,
      currentStrength: classroom.currentStrength || 0,
      subjects: subjectsList.map((s) => ({
        id: s.subject.id,
        name: s.subject.name,
        code: s.subject.code,
      })),
      students: studentsList.map((s) => ({
        id: s.id,
        rollNumber: s.rollNumber,
        dateOfBirth: s.dateOfBirth.toISOString().split("T")[0],
        user: {
          name: s.user.name,
          email: s.user.email,
        },
      })),
      recentAttendance,
    };
  } catch (error) {
    console.error("Error fetching classroom details:", error);
    return null;
  }
}

// ============================================================================
// TIMETABLE
// ============================================================================

export interface TeacherTimetableEntry {
  id: string;
  dayOfWeek: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  room: string | null;
  classroomId: string;
  classroomName: string;
  classroomGrade: number;
  classroomSection: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  sessionType: string | null;
}

/**
 * Get teacher's timetable across all their assigned classes
 * This searches through all timetable entries where the teacher is assigned
 */
export async function getTeacherTimetable(
  teacherId: string,
): Promise<TeacherTimetableEntry[]> {
  try {
    const timetableEntries = await db
      .select({
        id: timetable.id,
        dayOfWeek: timetable.dayOfWeek,
        periodNumber: timetable.periodNumber,
        startTime: timetable.startTime,
        endTime: timetable.endTime,
        room: timetable.room,
        sessionType: timetable.sessionType,
        classroomId: classrooms.id,
        classroomName: classrooms.name,
        classroomGrade: classrooms.grade,
        classroomSection: classrooms.section,
        subjectId: subjects.id,
        subjectName: subjects.name,
        subjectCode: subjects.code,
      })
      .from(timetable)
      .leftJoin(classrooms, eq(timetable.classroomId, classrooms.id))
      .leftJoin(subjects, eq(timetable.subjectId, subjects.id))
      .where(and(eq(timetable.teacherId, teacherId), eq(timetable.isActive, true)))
      .orderBy(timetable.dayOfWeek, timetable.periodNumber);

    return timetableEntries.map((entry) => ({
      id: entry.id,
      dayOfWeek: entry.dayOfWeek,
      periodNumber: entry.periodNumber,
      startTime: entry.startTime,
      endTime: entry.endTime,
      room: entry.room,
      classroomId: entry.classroomId || "",
      classroomName: entry.classroomName || "",
      classroomGrade:
        typeof entry.classroomGrade === "string"
          ? parseInt(entry.classroomGrade, 10)
          : entry.classroomGrade || 0,
      classroomSection: entry.classroomSection || "",
      subjectId: entry.subjectId || "",
      subjectName: entry.subjectName || "",
      subjectCode: entry.subjectCode || "",
      sessionType: entry.sessionType,
    }));
  } catch (error) {
    console.error("Error fetching teacher timetable:", error);
    throw new Error("Failed to fetch teacher timetable");
  }
}
