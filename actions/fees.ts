"use server";

import { db } from "@/database";
import {
  feeStructures,
  feePayments,
  students,
  users,
  classrooms,
} from "@/database/schema";
import { eq, and, gte, lte, desc, inArray } from "drizzle-orm";

// ============================================
// FEE MANAGEMENT
// ============================================

export interface FeeStructure {
  id: string;
  classroomId: string | null;
  grade: string | null;
  feeType: string;
  amount: string;
  frequency: string | null;
  dueDay: number | null;
  academicYear: string;
  isActive: boolean | null;
  createdAt: Date | null;
  classroomName?: string | null;
}

export interface FeePayment {
  id: string;
  studentId: string;
  feeStructureId: string;
  amount: string;
  paymentDate: Date | null;
  dueDate: Date;
  status: "pending" | "paid" | "overdue" | "partial";
  paymentMethod: string | null;
  transactionId: string | null;
  receiptNumber: string | null;
  remarks: string | null;
  createdAt: Date | null;
  studentName?: string | null;
  studentRollNumber?: string | null;
  feeType?: string | null;
}

export interface StudentFeeStatus {
  studentId: string;
  studentName: string;
  rollNumber: string;
  totalDue: number;
  totalPaid: number;
  totalPending: number;
  overdueFees: number;
  feeDetails: FeePayment[];
}

/**
 * Create a new fee structure
 * @param feeData - Fee structure data
 */
export async function createFeeStructure(feeData: {
  classroomId?: string;
  grade?: string;
  feeType: string;
  amount: number;
  frequency?: string;
  dueDay?: number;
  academicYear: string;
  isActive?: boolean;
}): Promise<{ success: boolean; data?: FeeStructure; error?: string }> {
  try {
    if (!feeData.feeType || !feeData.amount || !feeData.academicYear) {
      return {
        success: false,
        error: "Fee type, amount, and academic year are required",
      };
    }

    const newFeeStructure = await db
      .insert(feeStructures)
      .values({
        classroomId: feeData.classroomId || null,
        grade: feeData.grade || null,
        feeType: feeData.feeType,
        amount: feeData.amount.toString(),
        frequency: feeData.frequency || "monthly",
        dueDay: feeData.dueDay || 5,
        academicYear: feeData.academicYear,
        isActive: feeData.isActive !== undefined ? feeData.isActive : true,
      })
      .returning();

    return { success: true, data: newFeeStructure[0] as FeeStructure };
  } catch (error) {
    console.error("Error creating fee structure:", error);
    return { success: false, error: "Failed to create fee structure" };
  }
}

/**
 * Update a fee structure
 * @param feeStructureId - Fee structure ID
 * @param feeData - Updated fee structure data
 */
export async function updateFeeStructure(
  feeStructureId: string,
  feeData: Partial<{
    classroomId: string;
    grade: string;
    feeType: string;
    amount: number;
    frequency: string;
    dueDay: number;
    academicYear: string;
    isActive: boolean;
  }>,
): Promise<{ success: boolean; data?: FeeStructure; error?: string }> {
  try {
    if (!feeStructureId) {
      return { success: false, error: "Fee structure ID is required" };
    }

    const updateData: Partial<{
      classroomId: string | null;
      grade: string | null;
      feeType: string;
      amount: string;
      frequency: string;
      dueDay: number;
      academicYear: string;
      isActive: boolean;
    }> = {};

    if (feeData.classroomId !== undefined)
      updateData.classroomId = feeData.classroomId;
    if (feeData.grade !== undefined) updateData.grade = feeData.grade;
    if (feeData.feeType) updateData.feeType = feeData.feeType;
    if (feeData.amount) updateData.amount = feeData.amount.toString();
    if (feeData.frequency) updateData.frequency = feeData.frequency;
    if (feeData.dueDay !== undefined) updateData.dueDay = feeData.dueDay;
    if (feeData.academicYear) updateData.academicYear = feeData.academicYear;
    if (feeData.isActive !== undefined) updateData.isActive = feeData.isActive;

    const updatedFeeStructure = await db
      .update(feeStructures)
      .set(updateData)
      .where(eq(feeStructures.id, feeStructureId))
      .returning();

    if (updatedFeeStructure.length === 0) {
      return { success: false, error: "Fee structure not found" };
    }

    return { success: true, data: updatedFeeStructure[0] as FeeStructure };
  } catch (error) {
    console.error("Error updating fee structure:", error);
    return { success: false, error: "Failed to update fee structure" };
  }
}

/**
 * Delete a fee structure
 * @param feeStructureId - Fee structure ID
 */
export async function deleteFeeStructure(
  feeStructureId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!feeStructureId) {
      return { success: false, error: "Fee structure ID is required" };
    }

    await db.delete(feeStructures).where(eq(feeStructures.id, feeStructureId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting fee structure:", error);
    return { success: false, error: "Failed to delete fee structure" };
  }
}

/**
 * Get all fee structures with optional filters
 * @param filters - Optional filters
 */
export async function getFeeStructures(filters?: {
  classroomId?: string;
  grade?: string;
  academicYear?: string;
  isActive?: boolean;
}): Promise<{ success: boolean; data?: FeeStructure[]; error?: string }> {
  try {
    const conditions = [];

    if (filters?.classroomId) {
      conditions.push(eq(feeStructures.classroomId, filters.classroomId));
    }

    if (filters?.grade) {
      conditions.push(eq(feeStructures.grade, filters.grade));
    }

    if (filters?.academicYear) {
      conditions.push(eq(feeStructures.academicYear, filters.academicYear));
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(feeStructures.isActive, filters.isActive));
    }

    const structures = await db
      .select({
        id: feeStructures.id,
        classroomId: feeStructures.classroomId,
        grade: feeStructures.grade,
        feeType: feeStructures.feeType,
        amount: feeStructures.amount,
        frequency: feeStructures.frequency,
        dueDay: feeStructures.dueDay,
        academicYear: feeStructures.academicYear,
        isActive: feeStructures.isActive,
        createdAt: feeStructures.createdAt,
        classroomName: classrooms.name,
      })
      .from(feeStructures)
      .leftJoin(classrooms, eq(feeStructures.classroomId, classrooms.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(feeStructures.createdAt));

    return { success: true, data: structures as FeeStructure[] };
  } catch (error) {
    console.error("Error fetching fee structures:", error);
    return { success: false, error: "Failed to fetch fee structures" };
  }
}

/**
 * Record a fee payment
 * @param paymentData - Payment data
 */
export async function recordPayment(paymentData: {
  studentId: string;
  feeStructureId: string;
  amount: number;
  paymentDate?: string | Date;
  dueDate: string | Date;
  status?: "pending" | "paid" | "overdue" | "partial";
  paymentMethod?: string;
  transactionId?: string;
  receiptNumber?: string;
  remarks?: string;
}): Promise<{ success: boolean; data?: FeePayment; error?: string }> {
  try {
    if (
      !paymentData.studentId ||
      !paymentData.feeStructureId ||
      !paymentData.amount ||
      !paymentData.dueDate
    ) {
      return {
        success: false,
        error:
          "Student ID, fee structure ID, amount, and due date are required",
      };
    }

    const newPayment = await db
      .insert(feePayments)
      .values({
        studentId: paymentData.studentId,
        feeStructureId: paymentData.feeStructureId,
        amount: paymentData.amount.toString(),
        paymentDate: paymentData.paymentDate
          ? new Date(paymentData.paymentDate)
          : new Date(),
        dueDate: new Date(paymentData.dueDate),
        status: paymentData.status || "paid",
        paymentMethod: paymentData.paymentMethod || null,
        transactionId: paymentData.transactionId || null,
        receiptNumber: paymentData.receiptNumber || null,
        remarks: paymentData.remarks || null,
      })
      .returning();

    return { success: true, data: newPayment[0] as FeePayment };
  } catch (error) {
    console.error("Error recording payment:", error);
    return { success: false, error: "Failed to record payment" };
  }
}

/**
 * Update a fee payment
 * @param paymentId - Payment ID
 * @param paymentData - Updated payment data
 */
export async function updatePayment(
  paymentId: string,
  paymentData: Partial<{
    amount: number;
    paymentDate: string | Date;
    dueDate: string | Date;
    status: "pending" | "paid" | "overdue" | "partial";
    paymentMethod: string;
    transactionId: string;
    receiptNumber: string;
    remarks: string;
  }>,
): Promise<{ success: boolean; data?: FeePayment; error?: string }> {
  try {
    if (!paymentId) {
      return { success: false, error: "Payment ID is required" };
    }

    const updateData: Partial<{
      amount: string;
      paymentDate: Date;
      dueDate: Date;
      status: "pending" | "paid" | "overdue" | "partial";
      paymentMethod: string | null;
      transactionId: string | null;
      receiptNumber: string | null;
      remarks: string | null;
    }> = {};

    if (paymentData.amount) updateData.amount = paymentData.amount.toString();
    if (paymentData.paymentDate)
      updateData.paymentDate = new Date(paymentData.paymentDate);
    if (paymentData.dueDate) updateData.dueDate = new Date(paymentData.dueDate);
    if (paymentData.status) updateData.status = paymentData.status;
    if (paymentData.paymentMethod !== undefined)
      updateData.paymentMethod = paymentData.paymentMethod;
    if (paymentData.transactionId !== undefined)
      updateData.transactionId = paymentData.transactionId;
    if (paymentData.receiptNumber !== undefined)
      updateData.receiptNumber = paymentData.receiptNumber;
    if (paymentData.remarks !== undefined)
      updateData.remarks = paymentData.remarks;

    const updatedPayment = await db
      .update(feePayments)
      .set(updateData)
      .where(eq(feePayments.id, paymentId))
      .returning();

    if (updatedPayment.length === 0) {
      return { success: false, error: "Payment not found" };
    }

    return { success: true, data: updatedPayment[0] as FeePayment };
  } catch (error) {
    console.error("Error updating payment:", error);
    return { success: false, error: "Failed to update payment" };
  }
}

/**
 * Get fee payments by student
 * @param studentId - Student ID
 * @param filters - Optional filters
 */
export async function getFeesByStudent(
  studentId: string,
  filters?: {
    status?: "pending" | "paid" | "overdue" | "partial";
    startDate?: string | Date;
    endDate?: string | Date;
  },
): Promise<{ success: boolean; data?: FeePayment[]; error?: string }> {
  try {
    if (!studentId) {
      return { success: false, error: "Student ID is required" };
    }

    const conditions = [eq(feePayments.studentId, studentId)];

    if (filters?.status) {
      conditions.push(eq(feePayments.status, filters.status));
    }

    if (filters?.startDate) {
      conditions.push(gte(feePayments.dueDate, new Date(filters.startDate)));
    }

    if (filters?.endDate) {
      conditions.push(lte(feePayments.dueDate, new Date(filters.endDate)));
    }

    const payments = await db
      .select({
        id: feePayments.id,
        studentId: feePayments.studentId,
        feeStructureId: feePayments.feeStructureId,
        amount: feePayments.amount,
        paymentDate: feePayments.paymentDate,
        dueDate: feePayments.dueDate,
        status: feePayments.status,
        paymentMethod: feePayments.paymentMethod,
        transactionId: feePayments.transactionId,
        receiptNumber: feePayments.receiptNumber,
        remarks: feePayments.remarks,
        createdAt: feePayments.createdAt,
        feeType: feeStructures.feeType,
      })
      .from(feePayments)
      .leftJoin(feeStructures, eq(feePayments.feeStructureId, feeStructures.id))
      .where(and(...conditions))
      .orderBy(desc(feePayments.dueDate));

    return { success: true, data: payments as FeePayment[] };
  } catch (error) {
    console.error("Error fetching fees by student:", error);
    return { success: false, error: "Failed to fetch fee payments" };
  }
}

/**
 * Get fee payments by classroom
 * @param classroomId - Classroom ID
 * @param filters - Optional filters
 */
export async function getFeesByClassroom(
  classroomId: string,
  filters?: {
    status?: "pending" | "paid" | "overdue" | "partial";
  },
): Promise<{ success: boolean; data?: FeePayment[]; error?: string }> {
  try {
    if (!classroomId) {
      return { success: false, error: "Classroom ID is required" };
    }

    // Get all students in the classroom
    const classroomStudents = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.classroomId, classroomId));

    const studentIds = classroomStudents.map((s) => s.id);

    if (studentIds.length === 0) {
      return { success: true, data: [] };
    }

    const conditions = [inArray(feePayments.studentId, studentIds)];

    if (filters?.status) {
      conditions.push(eq(feePayments.status, filters.status));
    }

    const payments = await db
      .select({
        id: feePayments.id,
        studentId: feePayments.studentId,
        feeStructureId: feePayments.feeStructureId,
        amount: feePayments.amount,
        paymentDate: feePayments.paymentDate,
        dueDate: feePayments.dueDate,
        status: feePayments.status,
        paymentMethod: feePayments.paymentMethod,
        transactionId: feePayments.transactionId,
        receiptNumber: feePayments.receiptNumber,
        remarks: feePayments.remarks,
        createdAt: feePayments.createdAt,
        studentName: users.name,
        studentRollNumber: students.rollNumber,
        feeType: feeStructures.feeType,
      })
      .from(feePayments)
      .leftJoin(students, eq(feePayments.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .leftJoin(feeStructures, eq(feePayments.feeStructureId, feeStructures.id))
      .where(and(...conditions))
      .orderBy(desc(feePayments.dueDate));

    return { success: true, data: payments as FeePayment[] };
  } catch (error) {
    console.error("Error fetching fees by classroom:", error);
    return { success: false, error: "Failed to fetch fee payments" };
  }
}

/**
 * Get student fee status with summary
 * @param studentId - Student ID
 */
export async function getStudentFeeStatus(
  studentId: string,
): Promise<{ success: boolean; data?: StudentFeeStatus; error?: string }> {
  try {
    if (!studentId) {
      return { success: false, error: "Student ID is required" };
    }

    // Get student details
    const student = await db
      .select({
        id: students.id,
        name: users.name,
        rollNumber: students.rollNumber,
      })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .where(eq(students.id, studentId))
      .limit(1);

    if (student.length === 0) {
      return { success: false, error: "Student not found" };
    }

    // Get all fee payments
    const payments = await db
      .select({
        id: feePayments.id,
        studentId: feePayments.studentId,
        feeStructureId: feePayments.feeStructureId,
        amount: feePayments.amount,
        paymentDate: feePayments.paymentDate,
        dueDate: feePayments.dueDate,
        status: feePayments.status,
        paymentMethod: feePayments.paymentMethod,
        transactionId: feePayments.transactionId,
        receiptNumber: feePayments.receiptNumber,
        remarks: feePayments.remarks,
        createdAt: feePayments.createdAt,
        feeType: feeStructures.feeType,
      })
      .from(feePayments)
      .leftJoin(feeStructures, eq(feePayments.feeStructureId, feeStructures.id))
      .where(eq(feePayments.studentId, studentId))
      .orderBy(desc(feePayments.dueDate));

    // Calculate totals
    let totalDue = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let overdueFees = 0;

    const today = new Date();

    payments.forEach((payment) => {
      const amount = parseFloat(payment.amount);
      totalDue += amount;

      if (payment.status === "paid") {
        totalPaid += amount;
      } else {
        totalPending += amount;
        if (payment.dueDate < today) {
          overdueFees += amount;
        }
      }
    });

    return {
      success: true,
      data: {
        studentId: student[0].id,
        studentName: student[0].name || "Unknown",
        rollNumber: student[0].rollNumber || "N/A",
        totalDue,
        totalPaid,
        totalPending,
        overdueFees,
        feeDetails: payments as FeePayment[],
      },
    };
  } catch (error) {
    console.error("Error fetching student fee status:", error);
    return { success: false, error: "Failed to fetch fee status" };
  }
}

/**
 * Generate fee receipts for students
 * @param classroomId - Classroom ID
 * @param feeStructureId - Fee structure ID
 * @param dueDate - Due date
 */
export async function generateFeeReceipts(
  classroomId: string,
  feeStructureId: string,
  dueDate: string | Date,
): Promise<{ success: boolean; data?: { count: number }; error?: string }> {
  try {
    if (!classroomId || !feeStructureId || !dueDate) {
      return {
        success: false,
        error: "Classroom ID, fee structure ID, and due date are required",
      };
    }

    // Get fee structure
    const feeStructure = await db.query.feeStructures.findFirst({
      where: eq(feeStructures.id, feeStructureId),
    });

    if (!feeStructure) {
      return { success: false, error: "Fee structure not found" };
    }

    // Get all students in the classroom
    const classroomStudents = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.classroomId, classroomId));

    if (classroomStudents.length === 0) {
      return { success: false, error: "No students found in classroom" };
    }

    // Generate fee receipts for each student
    const receipts = classroomStudents.map((student) => ({
      studentId: student.id,
      feeStructureId,
      amount: feeStructure.amount,
      dueDate: new Date(dueDate),
      status: "pending" as const,
    }));

    await db.insert(feePayments).values(receipts);

    return { success: true, data: { count: receipts.length } };
  } catch (error) {
    console.error("Error generating fee receipts:", error);
    return { success: false, error: "Failed to generate fee receipts" };
  }
}
