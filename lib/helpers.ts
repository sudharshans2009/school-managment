import { customAlphabet } from "nanoid";
import bcrypt from "bcryptjs";

// Generate random codes
const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);

export function generateClassroomCode(): string {
  return nanoid();
}

export function generateClassroomKey(): string {
  return customAlphabet(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    32,
  )();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Format date helpers
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Academic year helpers
export function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Academic year starts in July (month 6)
  if (month >= 6) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

// Receipt number generator
export function generateReceiptNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `RCP${year}${month}${random}`;
}

// Attendance percentage calculator
export function calculateAttendancePercentage(
  present: number,
  total: number,
): number {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}

// Fee status helper
export function getFeeStatus(
  dueDate: Date,
  paymentDate: Date | null,
): "pending" | "paid" | "overdue" {
  if (paymentDate) return "paid";
  const now = new Date();
  return now > dueDate ? "overdue" : "pending";
}

// Day of week helper
export function getDayName(dayOfWeek: number): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[dayOfWeek] || "";
}

// Homework status helper
export function getHomeworkStatus(
  dueDate: Date,
  submittedAt: Date | null,
): "assigned" | "submitted" | "overdue" {
  if (submittedAt) return "submitted";
  const now = new Date();
  return now > dueDate ? "overdue" : "assigned";
}

// Grade calculation based on percentage
export function calculateLetterGrade(percentage: number): string {
  if (percentage >= 90) return "A*";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  if (percentage >= 40) return "E";
  return "F";
}

// Grade description helper
export function getGradeDescription(grade: string): string {
  const descriptions: Record<string, string> = {
    "A*": "Outstanding",
    A: "Excellent",
    B: "Good",
    C: "Satisfactory",
    D: "Pass",
    E: "Marginal Pass",
    F: "Fail",
  };
  return descriptions[grade] || "";
}
