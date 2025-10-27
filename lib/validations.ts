import { z } from "zod";

// User Schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["admin", "teacher", "student", "parent"]),
  phone: z.string().optional(),
});

// Classroom Schemas
export const createClassroomSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  grade: z.string().min(1, "Grade is required"),
  section: z.string().min(1, "Section is required"),
  capacity: z.number().min(1).default(30),
  academicYear: z.string().min(4, "Academic year is required"),
});

export const classroomCodeSchema = z.object({
  code: z.string().length(6, "Classroom code must be 6 characters"),
  key: z.string().min(8, "Classroom key must be at least 8 characters"),
});

// Subject Schemas
export const createSubjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code is required"),
  description: z.string().optional(),
  credits: z.number().min(1).default(1),
});

// Teacher Assignment Schema
export const assignTeacherSchema = z.object({
  teacherId: z.string().uuid(),
  classroomId: z.string().uuid(),
  subjectId: z.string().uuid(),
  isPrimary: z.boolean().default(false),
});

// Student Schemas
export const createStudentSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  classroomId: z.string().uuid().optional(),
  rollNumber: z.string().min(1, "Roll number is required"),
  admissionNumber: z.string().min(1, "Admission number is required"),
  dateOfBirth: z.string().or(z.date()),
  parentId: z.string().uuid().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  bloodGroup: z.string().optional(),
  medicalInfo: z.string().optional(),
});

// Homework Schemas
export const createHomeworkSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  classroomId: z.string().uuid(),
  subjectId: z.string().uuid(),
  dueDate: z.string().or(z.date()),
  totalMarks: z.number().min(1).default(100),
  attachments: z.array(z.string()).optional(),
});

export const submitHomeworkSchema = z.object({
  homeworkId: z.string().uuid(),
  submissionText: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

export const gradeHomeworkSchema = z.object({
  submissionId: z.string().uuid(),
  marksObtained: z.number().min(0),
  feedback: z.string().optional(),
});

// Attendance Schemas
export const markAttendanceSchema = z.object({
  studentId: z.string().uuid(),
  classroomId: z.string().uuid(),
  date: z.string().or(z.date()),
  status: z.enum(["present", "absent", "late", "excused"]),
  remarks: z.string().optional(),
});

export const bulkAttendanceSchema = z.object({
  classroomId: z.string().uuid(),
  date: z.string().or(z.date()),
  attendance: z.array(
    z.object({
      studentId: z.string().uuid(),
      status: z.enum(["present", "absent", "late", "excused"]),
      remarks: z.string().optional(),
    })
  ),
});

// Fee Schemas
export const createFeeStructureSchema = z.object({
  classroomId: z.string().uuid().optional(),
  grade: z.string().optional(),
  feeType: z.string().min(2, "Fee type is required"),
  amount: z.string().or(z.number()),
  frequency: z.enum(["monthly", "quarterly", "annually"]).default("monthly"),
  dueDay: z.number().min(1).max(31).default(5),
  academicYear: z.string().min(4, "Academic year is required"),
});

export const recordPaymentSchema = z.object({
  studentId: z.string().uuid(),
  feeStructureId: z.string().uuid(),
  amount: z.string().or(z.number()),
  dueDate: z.string().or(z.date()),
  paymentMethod: z.enum(["online", "cash", "cheque"]),
  transactionId: z.string().optional(),
  remarks: z.string().optional(),
});

// Announcement Schemas
export const createAnnouncementSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  classroomId: z.string().uuid().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  expiresAt: z.string().or(z.date()).optional(),
});

// Timetable Schemas
export const createTimetableSchema = z.object({
  classroomId: z.string().uuid(),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  room: z.string().optional(),
});

// Export types
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type AssignTeacherInput = z.infer<typeof assignTeacherSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type CreateHomeworkInput = z.infer<typeof createHomeworkSchema>;
export type SubmitHomeworkInput = z.infer<typeof submitHomeworkSchema>;
export type GradeHomeworkInput = z.infer<typeof gradeHomeworkSchema>;
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>;
export type CreateFeeStructureInput = z.infer<typeof createFeeStructureSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type CreateTimetableInput = z.infer<typeof createTimetableSchema>;
