"use server";

import { db } from "@/database";
import {
  users,
  teacherLeaves,
  workDone,
  classrooms,
  subjects,
  substituteAssignments,
  timetable,
  admissionApplications,
  entranceTests,
} from "@/database/schema";
import { eq, and, gte, lte, desc, sql, inArray } from "drizzle-orm";
import { hashPassword } from "@/lib/helpers";

// ============================================
// TEACHER MANAGEMENT
// ============================================

export interface Teacher {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  address: string | null;
  emailVerified: boolean;
  isActive: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  teacherAssignments?: {
    id: string;
    teacherId: string;
    classroomId: string;
    subjectId: string;
    isPrimary: boolean | null;
    classroom: {
      id: string;
      name: string;
      grade: string;
      section: string;
    };
    subject: {
      id: string;
      name: string;
      code: string;
    };
  }[];
}

export interface TeacherLeaveStats {
  totalLeaves: number;
  sickLeaves: number;
  casualLeaves: number;
  earnedLeaves: number;
  pendingLeaves: number;
}

export interface WorkDoneRecord {
  id: string;
  classroomId: string;
  subjectId: string;
  teacherId: string;
  date: string;
  periodNumber: number;
  topicsCovered: string;
  homeworkAssigned: string | null;
  remarks: string | null;
  isSubstitute: boolean | null;
  substituteAssignmentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  teacherName: string | null;
  teacherEmail: string | null;
  classroomName: string | null;
  classroomGrade: number | null;
  classroomSection: string | null;
  subjectName: string | null;
  subjectCode: string | null;
}

/**
 * Get all teachers with their assignments
 */
export async function getAllTeachers(): Promise<Teacher[]> {
  try {
    const teachers = await db.query.users.findMany({
      where: eq(users.role, "teacher"),
      with: {
        teacherAssignments: {
          with: {
            classroom: true,
            subject: true,
          },
        },
      },
      orderBy: (users, { asc }) => [asc(users.name)],
    });

    return teachers.map((t) => ({
      ...t,
      teacherAssignments: t.teacherAssignments.map((a) => ({
        id: a.id,
        teacherId: a.teacherId,
        classroomId: a.classroomId,
        subjectId: a.subjectId,
        isPrimary: a.isPrimary,
        classroom: {
          id: a.classroom.id,
          name: a.classroom.name,
          grade: a.classroom.grade.toString(),
          section: a.classroom.section,
        },
        subject: {
          id: a.subject.id,
          name: a.subject.name,
          code: a.subject.code,
        },
      })),
    }));
  } catch (error) {
    console.error("Error fetching teachers:", error);
    throw new Error("Failed to fetch teachers");
  }
}

/**
 * Get single teacher by ID
 */
export async function getTeacherById(teacherId: string): Promise<Teacher> {
  try {
    const teacher = await db.query.users.findFirst({
      where: eq(users.id, teacherId),
      with: {
        teacherAssignments: {
          with: {
            classroom: true,
            subject: true,
          },
        },
      },
    });

    if (!teacher || teacher.role !== "teacher") {
      throw new Error("Teacher not found");
    }

    return {
      ...teacher,
      teacherAssignments: teacher.teacherAssignments.map((a) => ({
        id: a.id,
        teacherId: a.teacherId,
        classroomId: a.classroomId,
        subjectId: a.subjectId,
        isPrimary: a.isPrimary,
        classroom: {
          id: a.classroom.id,
          name: a.classroom.name,
          grade: a.classroom.grade.toString(),
          section: a.classroom.section,
        },
        subject: {
          id: a.subject.id,
          name: a.subject.name,
          code: a.subject.code,
        },
      })),
    };
  } catch (error) {
    console.error("Error fetching teacher:", error);
    throw new Error("Failed to fetch teacher");
  }
}

/**
 * Create a new teacher
 */
export async function createTeacher(data: {
  email: string;
  name: string;
  phone?: string;
  address?: string;
  password: string;
}): Promise<{ success: boolean; teacher?: Partial<Teacher>; error?: string }> {
  try {
    const { email, name, phone, address, password } = data;

    if (!email || !name || !password) {
      return { success: false, error: "Missing required fields" };
    }

    // Check if email already exists
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existing) {
      return { success: false, error: "Email already exists" };
    }

    const passwordHash = await hashPassword(password);

    const [newTeacher] = await db
      .insert(users)
      .values({
        email,
        name,
        role: "teacher",
        passwordHash,
        phone: phone || null,
        address: address || null,
        emailVerified: true,
        isActive: true,
      })
      .returning();

    // Remove password hash from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...teacherData } = newTeacher;

    return { success: true, teacher: teacherData };
  } catch (error) {
    console.error("Error creating teacher:", error);
    return { success: false, error: "Failed to create teacher" };
  }
}

/**
 * Update a teacher
 */
export async function updateTeacher(
  teacherId: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    password?: string;
  },
): Promise<{ success: boolean; teacher?: Partial<Teacher>; error?: string }> {
  try {
    const { name, email, phone, address, password } = data;

    // Check if teacher exists
    const existingTeacher = await db.query.users.findFirst({
      where: eq(users.id, teacherId),
    });

    if (!existingTeacher || existingTeacher.role !== "teacher") {
      return { success: false, error: "Teacher not found" };
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingTeacher.email) {
      const emailExists = await db.query.users.findFirst({
        where: eq(users.email, email),
      });
      if (emailExists) {
        return { success: false, error: "Email already in use" };
      }
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }

    const [updatedTeacher] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, teacherId))
      .returning();

    // Remove password hash from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...teacherData } = updatedTeacher;

    return { success: true, teacher: teacherData };
  } catch (error) {
    console.error("Error updating teacher:", error);
    return { success: false, error: "Failed to update teacher" };
  }
}

/**
 * Delete a teacher
 */
export async function deleteTeacher(
  teacherId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if teacher exists
    const existingTeacher = await db.query.users.findFirst({
      where: eq(users.id, teacherId),
    });

    if (!existingTeacher || existingTeacher.role !== "teacher") {
      return { success: false, error: "Teacher not found" };
    }

    // Delete teacher (cascade will handle assignments)
    await db.delete(users).where(eq(users.id, teacherId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting teacher:", error);
    return { success: false, error: "Failed to delete teacher" };
  }
}

/**
 * Bulk upload teachers
 */
export async function bulkUploadTeachers(
  teachers: Array<{
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }>,
): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const teacher of teachers) {
    try {
      const { name, email, password, phone, address } = teacher;

      // Validate required fields
      if (!name || !email || !password) {
        results.failed++;
        results.errors.push(
          `Missing required fields for ${email || "unknown"}`,
        );
        continue;
      }

      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingUser) {
        results.failed++;
        results.errors.push(`User with email ${email} already exists`);
        continue;
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      await db.insert(users).values({
        name,
        email,
        role: "teacher",
        passwordHash,
        phone: phone || null,
        address: address || null,
        emailVerified: true,
        isActive: true,
      });

      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(
        `Error creating teacher ${teacher.email}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  return results;
}

/**
 * Get teacher leave statistics
 */
export async function getTeacherLeaveStats(
  teacherId: string,
): Promise<TeacherLeaveStats> {
  try {
    // Get leave records for the teacher
    const leaveRecords = await db
      .select({
        leaveType: teacherLeaves.leaveType,
        status: teacherLeaves.status,
      })
      .from(teacherLeaves)
      .where(eq(teacherLeaves.teacherId, teacherId));

    const totalLeaves = leaveRecords.filter(
      (r) => r.status === "approved",
    ).length;
    const sickLeaves = leaveRecords.filter(
      (r) => r.leaveType === "sick" && r.status === "approved",
    ).length;
    const casualLeaves = leaveRecords.filter(
      (r) => r.leaveType === "casual" && r.status === "approved",
    ).length;
    const earnedLeaves = leaveRecords.filter(
      (r) => r.leaveType === "earned" && r.status === "approved",
    ).length;
    const pendingLeaves = leaveRecords.filter(
      (r) => r.status === "pending",
    ).length;

    return {
      totalLeaves,
      sickLeaves,
      casualLeaves,
      earnedLeaves,
      pendingLeaves,
    };
  } catch (error) {
    console.error("Error fetching leave stats:", error);
    throw new Error("Failed to fetch leave stats");
  }
}

// ============================================
// WORK DONE MANAGEMENT
// ============================================

/**
 * Get work done records with filtering
 */
export async function getWorkDoneRecords(filters?: {
  classroomId?: string;
  subjectId?: string;
  teacherId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  isSubstitute?: boolean;
}): Promise<WorkDoneRecord[]> {
  try {
    const conditions = [];

    if (filters?.classroomId) {
      conditions.push(eq(workDone.classroomId, filters.classroomId));
    }

    if (filters?.subjectId) {
      conditions.push(eq(workDone.subjectId, filters.subjectId));
    }

    if (filters?.teacherId) {
      conditions.push(eq(workDone.teacherId, filters.teacherId));
    }

    if (filters?.date) {
      conditions.push(eq(workDone.date, filters.date));
    }

    if (filters?.startDate) {
      conditions.push(gte(workDone.date, filters.startDate));
    }

    if (filters?.endDate) {
      conditions.push(lte(workDone.date, filters.endDate));
    }

    if (filters?.isSubstitute !== undefined) {
      conditions.push(eq(workDone.isSubstitute, filters.isSubstitute));
    }

    const records = await db
      .select({
        id: workDone.id,
        classroomId: workDone.classroomId,
        subjectId: workDone.subjectId,
        teacherId: workDone.teacherId,
        date: workDone.date,
        periodNumber: workDone.periodNumber,
        topicsCovered: workDone.topicsCovered,
        homeworkAssigned: workDone.homeworkAssigned,
        remarks: workDone.remarks,
        isSubstitute: workDone.isSubstitute,
        substituteAssignmentId: workDone.substituteAssignmentId,
        createdAt: workDone.createdAt,
        updatedAt: workDone.updatedAt,
        teacherName: users.name,
        teacherEmail: users.email,
        classroomName: classrooms.name,
        classroomGrade: classrooms.grade,
        classroomSection: classrooms.section,
        subjectName: subjects.name,
        subjectCode: subjects.code,
      })
      .from(workDone)
      .leftJoin(users, eq(workDone.teacherId, users.id))
      .leftJoin(classrooms, eq(workDone.classroomId, classrooms.id))
      .leftJoin(subjects, eq(workDone.subjectId, subjects.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(workDone.date), desc(workDone.periodNumber));

    return records as WorkDoneRecord[];
  } catch (error) {
    console.error("Error fetching work done records:", error);
    throw new Error("Failed to fetch work done records");
  }
}

// ============================================
// TEACHER LEAVE MANAGEMENT (ADMIN)
// ============================================

export interface AdminTeacherLeave {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  approvedBy: string | null;
  approvalNotes: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all teacher leaves (admin view)
 */
export async function getAllTeacherLeaves(): Promise<AdminTeacherLeave[]> {
  try {
    const leaves = await db
      .select({
        id: teacherLeaves.id,
        teacherId: teacherLeaves.teacherId,
        leaveType: teacherLeaves.leaveType,
        startDate: teacherLeaves.startDate,
        endDate: teacherLeaves.endDate,
        reason: teacherLeaves.reason,
        status: teacherLeaves.status,
        approvedBy: teacherLeaves.approvedBy,
        approvalNotes: teacherLeaves.approvalNotes,
        approvedAt: teacherLeaves.approvedAt,
        createdAt: teacherLeaves.createdAt,
        updatedAt: teacherLeaves.updatedAt,
        teacherName: users.name,
        teacherEmail: users.email,
      })
      .from(teacherLeaves)
      .leftJoin(users, eq(teacherLeaves.teacherId, users.id))
      .orderBy(desc(teacherLeaves.createdAt));

    return leaves.map((leave) => ({
      id: leave.id,
      teacherId: leave.teacherId,
      teacherName: leave.teacherName || "Unknown",
      teacherEmail: leave.teacherEmail || "",
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason,
      status: leave.status,
      approvedBy: leave.approvedBy,
      approvalNotes: leave.approvalNotes,
      approvedAt: leave.approvedAt,
      createdAt: leave.createdAt || new Date(),
      updatedAt: leave.updatedAt || new Date(),
    }));
  } catch (error) {
    console.error("Error fetching all teacher leaves:", error);
    throw new Error("Failed to fetch teacher leaves");
  }
}

/**
 * Update teacher leave status (approve/reject)
 */
export async function updateTeacherLeaveStatus(
  leaveId: string,
  data: {
    status: "approved" | "rejected";
    approvedBy: string;
    approvalNotes?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const { status, approvedBy, approvalNotes } = data;

    await db
      .update(teacherLeaves)
      .set({
        status,
        approvedBy,
        approvalNotes: approvalNotes || null,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(teacherLeaves.id, leaveId));

    return { success: true };
  } catch (error) {
    console.error("Error updating leave status:", error);
    return { success: false, error: "Failed to update leave status" };
  }
}

// ============================================
// SUBSTITUTE ASSIGNMENT MANAGEMENT (ADMIN)
// ============================================

export interface UnassignedPeriod {
  id: string;
  classroomId: string;
  classroomName: string;
  classroomGrade: number;
  classroomSection: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  dayOfWeek: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  date: string;
}

export interface AdminSubstituteAssignment {
  id: string;
  originalTeacherId: string;
  originalTeacherName: string;
  substituteTeacherId: string;
  substituteTeacherName: string;
  classroomId: string;
  classroomName: string;
  classroomGrade: number;
  classroomSection: string;
  subjectId: string;
  subjectName: string;
  date: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  reason: string | null;
  assignedBy: string;
  createdAt: Date;
}

/**
 * Get unassigned periods (periods that need substitutes)
 */
export async function getUnassignedPeriods(
  date: string,
): Promise<UnassignedPeriod[]> {
  try {
    // Get day of week for the date (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = new Date(date).getDay();

    // Step 1: Get all approved leaves that overlap with the given date
    const approvedLeaves = await db
      .select({
        teacherId: teacherLeaves.teacherId,
        startDate: teacherLeaves.startDate,
        endDate: teacherLeaves.endDate,
      })
      .from(teacherLeaves)
      .where(
        and(
          eq(teacherLeaves.status, "approved"),
          lte(teacherLeaves.startDate, date),
          gte(teacherLeaves.endDate, date),
        ),
      );

    const teachersOnLeave = approvedLeaves.map((leave) => leave.teacherId);

    if (teachersOnLeave.length === 0) {
      return [];
    }

    // Step 2: Get all timetable entries for teachers on leave for this day
    const affectedPeriods = await db
      .select({
        id: timetable.id,
        classroomId: timetable.classroomId,
        subjectId: timetable.subjectId,
        teacherId: timetable.teacherId,
        dayOfWeek: timetable.dayOfWeek,
        periodNumber: timetable.periodNumber,
        startTime: timetable.startTime,
        endTime: timetable.endTime,
        teacherName: users.name,
        classroomName: classrooms.name,
        classroomGrade: classrooms.grade,
        classroomSection: classrooms.section,
        subjectName: subjects.name,
      })
      .from(timetable)
      .leftJoin(users, eq(timetable.teacherId, users.id))
      .leftJoin(classrooms, eq(timetable.classroomId, classrooms.id))
      .leftJoin(subjects, eq(timetable.subjectId, subjects.id))
      .where(
        and(
          eq(timetable.dayOfWeek, dayOfWeek),
          inArray(timetable.teacherId, teachersOnLeave),
          eq(timetable.isActive, true),
        ),
      );

    // Step 3: Get all substitute assignments already created for this date
    const existingAssignments = await db
      .select({
        classroomId: substituteAssignments.classroomId,
        periodNumber: substituteAssignments.periodNumber,
        originalTeacherId: substituteAssignments.originalTeacherId,
      })
      .from(substituteAssignments)
      .where(eq(substituteAssignments.date, date));

    // Step 4: Filter out periods that already have substitute assignments
    const unassignedPeriods = affectedPeriods.filter((period) => {
      return !existingAssignments.some(
        (assignment) =>
          assignment.classroomId === period.classroomId &&
          assignment.periodNumber === period.periodNumber &&
          assignment.originalTeacherId === period.teacherId,
      );
    });

    // Add the date to each unassigned period and return
    return unassignedPeriods.map((period) => ({
      id: period.id,
      classroomId: period.classroomId,
      classroomName: period.classroomName || "",
      classroomGrade:
        typeof period.classroomGrade === "string"
          ? parseInt(period.classroomGrade, 10)
          : period.classroomGrade || 0,
      classroomSection: period.classroomSection || "",
      subjectId: period.subjectId,
      subjectName: period.subjectName || "",
      teacherId: period.teacherId,
      teacherName: period.teacherName || "",
      dayOfWeek: period.dayOfWeek,
      periodNumber: period.periodNumber,
      startTime: period.startTime,
      endTime: period.endTime,
      date,
    }));
  } catch (error) {
    console.error("Error fetching unassigned periods:", error);
    throw new Error("Failed to fetch unassigned periods");
  }
}

/**
 * Get substitute assignments for a specific date
 */
export async function getSubstituteAssignmentsByDate(
  date: string,
): Promise<AdminSubstituteAssignment[]> {
  try {
    const assignments = await db
      .select({
        id: substituteAssignments.id,
        originalTeacherId: substituteAssignments.originalTeacherId,
        substituteTeacherId: substituteAssignments.substituteTeacherId,
        classroomId: substituteAssignments.classroomId,
        subjectId: substituteAssignments.subjectId,
        date: substituteAssignments.date,
        periodNumber: substituteAssignments.periodNumber,
        startTime: substituteAssignments.startTime,
        endTime: substituteAssignments.endTime,
        reason: substituteAssignments.reason,
        assignedBy: substituteAssignments.assignedBy,
        createdAt: substituteAssignments.createdAt,
        originalTeacherName: users.name,
        substituteTeacherName: sql<string>`substitute.name`,
        classroomName: classrooms.name,
        classroomGrade: classrooms.grade,
        classroomSection: classrooms.section,
        subjectName: subjects.name,
      })
      .from(substituteAssignments)
      .leftJoin(users, eq(substituteAssignments.originalTeacherId, users.id))
      .leftJoin(
        sql`${users} AS substitute`,
        sql`${substituteAssignments.substituteTeacherId} = substitute.id`,
      )
      .leftJoin(
        classrooms,
        eq(substituteAssignments.classroomId, classrooms.id),
      )
      .leftJoin(subjects, eq(substituteAssignments.subjectId, subjects.id))
      .where(eq(substituteAssignments.date, date));

    return assignments.map((a) => ({
      id: a.id,
      originalTeacherId: a.originalTeacherId,
      originalTeacherName: a.originalTeacherName || "Unknown",
      substituteTeacherId: a.substituteTeacherId,
      substituteTeacherName: a.substituteTeacherName || "Unknown",
      classroomId: a.classroomId,
      classroomName: a.classroomName || "",
      classroomGrade:
        typeof a.classroomGrade === "string"
          ? parseInt(a.classroomGrade, 10)
          : a.classroomGrade || 0,
      classroomSection: a.classroomSection || "",
      subjectId: a.subjectId,
      subjectName: a.subjectName || "",
      date: a.date,
      periodNumber: a.periodNumber,
      startTime: a.startTime,
      endTime: a.endTime,
      reason: a.reason,
      assignedBy: a.assignedBy,
      createdAt: a.createdAt || new Date(),
    }));
  } catch (error) {
    console.error("Error fetching substitute assignments:", error);
    throw new Error("Failed to fetch substitute assignments");
  }
}

/**
 * Create a substitute assignment
 */
export async function createSubstituteAssignment(data: {
  originalTeacherId: string;
  substituteTeacherId: string;
  classroomId: string;
  subjectId: string;
  date: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  assignedBy: string;
  reason?: string;
}): Promise<{ success: boolean; error?: string; warning?: string }> {
  try {
    // Get day of week for the date
    const dayOfWeek = new Date(data.date).getDay();

    // Check if substitute teacher already has a class during this time
    const existingTimetable = await db
      .select({
        id: timetable.id,
        classroomName: classrooms.name,
        subjectName: subjects.name,
      })
      .from(timetable)
      .leftJoin(classrooms, eq(timetable.classroomId, classrooms.id))
      .leftJoin(subjects, eq(timetable.subjectId, subjects.id))
      .where(
        and(
          eq(timetable.teacherId, data.substituteTeacherId),
          eq(timetable.dayOfWeek, dayOfWeek),
          eq(timetable.periodNumber, data.periodNumber),
          eq(timetable.isActive, true),
        ),
      )
      .limit(1);

    // Check if substitute teacher is already assigned to another substitute duty at this time
    const existingSubstitute = await db
      .select({
        id: substituteAssignments.id,
        classroomName: classrooms.name,
        subjectName: subjects.name,
      })
      .from(substituteAssignments)
      .leftJoin(
        classrooms,
        eq(substituteAssignments.classroomId, classrooms.id),
      )
      .leftJoin(subjects, eq(substituteAssignments.subjectId, subjects.id))
      .where(
        and(
          eq(
            substituteAssignments.substituteTeacherId,
            data.substituteTeacherId,
          ),
          eq(substituteAssignments.date, data.date),
          eq(substituteAssignments.periodNumber, data.periodNumber),
        ),
      )
      .limit(1);

    let warning: string | undefined;

    if (existingTimetable.length > 0) {
      const conflict = existingTimetable[0];
      warning = `Warning: This teacher already has a regular class scheduled at this time (${conflict.subjectName || "Unknown Subject"} in ${conflict.classroomName || "Unknown Class"})`;
    } else if (existingSubstitute.length > 0) {
      const conflict = existingSubstitute[0];
      warning = `Warning: This teacher is already assigned as a substitute at this time (${conflict.subjectName || "Unknown Subject"} in ${conflict.classroomName || "Unknown Class"})`;
    }

    // Insert the substitute assignment
    await db.insert(substituteAssignments).values({
      originalTeacherId: data.originalTeacherId,
      substituteTeacherId: data.substituteTeacherId,
      classroomId: data.classroomId,
      subjectId: data.subjectId,
      date: data.date,
      periodNumber: data.periodNumber,
      startTime: data.startTime,
      endTime: data.endTime,
      assignedBy: data.assignedBy,
      reason: data.reason || null,
    });

    return { success: true, warning };
  } catch (error) {
    console.error("Error creating substitute assignment:", error);
    return { success: false, error: "Failed to create substitute assignment" };
  }
}

/**
 * Delete a substitute assignment
 */
export async function deleteSubstituteAssignment(
  assignmentId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .delete(substituteAssignments)
      .where(eq(substituteAssignments.id, assignmentId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting substitute assignment:", error);
    return { success: false, error: "Failed to delete substitute assignment" };
  }
}

/**
 * Check if a teacher has a conflict at a specific time
 */
export async function checkTeacherConflict(
  teacherId: string,
  date: string,
  periodNumber: number,
): Promise<{
  hasConflict: boolean;
  conflictType?: "regular" | "substitute";
  conflictDetails?: {
    classroomName: string;
    subjectName: string;
  };
}> {
  try {
    const dayOfWeek = new Date(date).getDay();

    // Check regular timetable
    const regularClass = await db
      .select({
        classroomName: classrooms.name,
        subjectName: subjects.name,
      })
      .from(timetable)
      .leftJoin(classrooms, eq(timetable.classroomId, classrooms.id))
      .leftJoin(subjects, eq(timetable.subjectId, subjects.id))
      .where(
        and(
          eq(timetable.teacherId, teacherId),
          eq(timetable.dayOfWeek, dayOfWeek),
          eq(timetable.periodNumber, periodNumber),
          eq(timetable.isActive, true),
        ),
      )
      .limit(1);

    if (regularClass.length > 0) {
      return {
        hasConflict: true,
        conflictType: "regular",
        conflictDetails: {
          classroomName: regularClass[0].classroomName || "Unknown",
          subjectName: regularClass[0].subjectName || "Unknown",
        },
      };
    }

    // Check substitute assignments
    const substituteClass = await db
      .select({
        classroomName: classrooms.name,
        subjectName: subjects.name,
      })
      .from(substituteAssignments)
      .leftJoin(
        classrooms,
        eq(substituteAssignments.classroomId, classrooms.id),
      )
      .leftJoin(subjects, eq(substituteAssignments.subjectId, subjects.id))
      .where(
        and(
          eq(substituteAssignments.substituteTeacherId, teacherId),
          eq(substituteAssignments.date, date),
          eq(substituteAssignments.periodNumber, periodNumber),
        ),
      )
      .limit(1);

    if (substituteClass.length > 0) {
      return {
        hasConflict: true,
        conflictType: "substitute",
        conflictDetails: {
          classroomName: substituteClass[0].classroomName || "Unknown",
          subjectName: substituteClass[0].subjectName || "Unknown",
        },
      };
    }

    return { hasConflict: false };
  } catch (error) {
    console.error("Error checking teacher conflict:", error);
    return { hasConflict: false };
  }
}

// ============================================
// ADMIN MANAGEMENT
// ============================================

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  address: string | null;
  emailVerified: boolean;
  isActive: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/**
 * Get all admin users
 */
export async function getAllAdmins(): Promise<Admin[]> {
  try {
    const admins = await db.query.users.findMany({
      where: eq(users.role, "admin"),
      orderBy: (users, { asc }) => [asc(users.name)],
    });

    return admins;
  } catch (error) {
    console.error("Error fetching admins:", error);
    throw new Error("Failed to fetch admins");
  }
}

/**
 * Create a new admin user
 */
export async function createAdmin(data: {
  email: string;
  name: string;
  phone?: string;
  address?: string;
  password: string;
}): Promise<{ success: boolean; error?: string; adminId?: string }> {
  try {
    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    if (existingUser) {
      return { success: false, error: "Email already exists" };
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create admin user
    const [newAdmin] = await db
      .insert(users)
      .values({
        email: data.email,
        name: data.name,
        role: "admin",
        phone: data.phone || null,
        address: data.address || null,
        passwordHash,
        emailVerified: false,
        isActive: true,
      })
      .returning();

    return { success: true, adminId: newAdmin.id };
  } catch (error) {
    console.error("Error creating admin:", error);
    return { success: false, error: "Failed to create admin" };
  }
}

/**
 * Update an admin user
 */
export async function updateAdmin(
  adminId: string,
  data: {
    name?: string;
    phone?: string;
    address?: string;
    isActive?: boolean;
    password?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if admin exists
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.id, adminId),
    });

    if (!existingAdmin || existingAdmin.role !== "admin") {
      return { success: false, error: "Admin not found" };
    }

    const updateData: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password) {
      updateData.passwordHash = await hashPassword(data.password);
    }

    await db.update(users).set(updateData).where(eq(users.id, adminId));

    return { success: true };
  } catch (error) {
    console.error("Error updating admin:", error);
    return { success: false, error: "Failed to update admin" };
  }
}

/**
 * Delete an admin user
 */
export async function deleteAdmin(
  adminId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if admin exists
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.id, adminId),
    });

    if (!existingAdmin || existingAdmin.role !== "admin") {
      return { success: false, error: "Admin not found" };
    }

    // Check if this is the only admin
    const adminCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "admin"));

    if (adminCount[0].count <= 1) {
      return {
        success: false,
        error: "Cannot delete the last admin user",
      };
    }

    // Delete admin user
    await db.delete(users).where(eq(users.id, adminId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting admin:", error);
    return { success: false, error: "Failed to delete admin" };
  }
}

// ============================================
// ADMISSION MANAGEMENT
// ============================================

export interface AdmissionApplication {
  id: string;
  applicationNumber: string;
  studentName: string;
  dateOfBirth: Date;
  gender: string;
  email: string;
  phone: string;
  address: string;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  guardianEmail: string;
  previousSchool: string | null;
  gradeAppliedFor: string;
  academicYear: string;
  status: string;
  entranceTestId: string | null;
  testScore: string | null;
  interviewDate: Date | null;
  admissionDate: Date | null;
  rejectionReason: string | null;
  notes: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  reviewer?: {
    id: string;
    name: string;
    email: string;
  } | null;
  entranceTest?: {
    id: string;
    testName: string;
    testDate: Date;
    totalMarks: number;
    passingMarks: number;
  } | null;
}

/**
 * Get all admission applications with filters
 */
export async function getAllAdmissions(filters?: {
  status?: string;
  grade?: string;
}): Promise<AdmissionApplication[]> {
  try {
    const conditions = [];

    if (filters?.status && filters.status !== "all") {
      conditions.push(
        eq(admissionApplications.status, filters.status as never),
      );
    }

    if (filters?.grade && filters.grade !== "all") {
      conditions.push(eq(admissionApplications.gradeAppliedFor, filters.grade));
    }

    const applications = await db.query.admissionApplications.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        reviewer: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        entranceTest: {
          columns: {
            id: true,
            testName: true,
            testDate: true,
            totalMarks: true,
            passingMarks: true,
          },
        },
      },
      orderBy: [desc(admissionApplications.createdAt)],
    });

    return applications;
  } catch (error) {
    console.error("Error fetching admissions:", error);
    throw new Error("Failed to fetch admissions");
  }
}

/**
 * Get single admission application by ID
 */
export async function getAdmissionById(
  admissionId: string,
): Promise<AdmissionApplication> {
  try {
    const application = await db.query.admissionApplications.findFirst({
      where: eq(admissionApplications.id, admissionId),
      with: {
        reviewer: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        entranceTest: {
          columns: {
            id: true,
            testName: true,
            testDate: true,
            totalMarks: true,
            passingMarks: true,
          },
        },
        documents: true,
      },
    });

    if (!application) {
      throw new Error("Admission application not found");
    }

    return application as AdmissionApplication;
  } catch (error) {
    console.error("Error fetching admission:", error);
    throw new Error("Failed to fetch admission");
  }
}

/**
 * Update admission application status
 */
export async function updateAdmissionStatus(
  admissionId: string,
  data: {
    status?: string;
    testScore?: number;
    interviewDate?: Date | null;
    admissionDate?: Date | null;
    rejectionReason?: string;
    notes?: string;
    reviewedBy: string;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const existingApplication = await db.query.admissionApplications.findFirst({
      where: eq(admissionApplications.id, admissionId),
    });

    if (!existingApplication) {
      return { success: false, error: "Application not found" };
    }

    const updateData: Partial<typeof admissionApplications.$inferInsert> = {
      updatedAt: new Date(),
      reviewedBy: data.reviewedBy,
      reviewedAt: new Date(),
    };

    if (data.status !== undefined) updateData.status = data.status as never;
    if (data.testScore !== undefined)
      updateData.testScore = data.testScore.toString();
    if (data.interviewDate !== undefined)
      updateData.interviewDate = data.interviewDate;
    if (data.admissionDate !== undefined)
      updateData.admissionDate = data.admissionDate;
    if (data.rejectionReason !== undefined)
      updateData.rejectionReason = data.rejectionReason;
    if (data.notes !== undefined) updateData.notes = data.notes;

    await db
      .update(admissionApplications)
      .set(updateData)
      .where(eq(admissionApplications.id, admissionId));

    return { success: true };
  } catch (error) {
    console.error("Error updating admission:", error);
    return { success: false, error: "Failed to update admission" };
  }
}

/**
 * Delete an admission application
 */
export async function deleteAdmission(
  admissionId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const existingApplication = await db.query.admissionApplications.findFirst({
      where: eq(admissionApplications.id, admissionId),
    });

    if (!existingApplication) {
      return { success: false, error: "Application not found" };
    }

    // Only allow deletion of pending or rejected applications
    if (
      existingApplication.status !== "pending" &&
      existingApplication.status !== "rejected"
    ) {
      return {
        success: false,
        error: "Can only delete pending or rejected applications",
      };
    }

    await db
      .delete(admissionApplications)
      .where(eq(admissionApplications.id, admissionId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting admission:", error);
    return { success: false, error: "Failed to delete admission" };
  }
}

/**
 * Get all entrance tests
 */
export async function getAllEntranceTests(): Promise<
  Array<{
    id: string;
    testName: string;
    grade: string;
    testDate: Date;
    totalMarks: number;
    passingMarks: number;
  }>
> {
  try {
    const tests = await db.query.entranceTests.findMany({
      where: eq(entranceTests.isActive, true),
      orderBy: [desc(entranceTests.testDate)],
      columns: {
        id: true,
        testName: true,
        grade: true,
        testDate: true,
        totalMarks: true,
        passingMarks: true,
      },
    });

    return tests;
  } catch (error) {
    console.error("Error fetching entrance tests:", error);
    return [];
  }
}
