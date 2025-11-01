import { db } from "./index";
import {
  users,
  classrooms,
  subjects,
  teacherAssignments,
  students,
  timetable,
  attendance,
  homework,
  homeworkSubmissions,
  announcements,
  messages,
  classroomMessages,
  feePayments,
  feeStructures,
  sessions,
  accounts,
  verifications,
} from "./schema";

async function purge() {
  console.log("🗑️  PURGING ALL DATABASE CONTENT...");

  try {
    // Delete in reverse order of dependencies
    await db.delete(homeworkSubmissions);
    console.log("✅ Cleared homework submissions");

    await db.delete(attendance);
    console.log("✅ Cleared attendance");

    await db.delete(homework);
    console.log("✅ Cleared homework");

    await db.delete(announcements);
    console.log("✅ Cleared announcements");

    await db.delete(messages);
    console.log("✅ Cleared messages");

    await db.delete(classroomMessages);
    console.log("✅ Cleared classroom messages");

    await db.delete(timetable);
    console.log("✅ Cleared timetable");

    await db.delete(teacherAssignments);
    console.log("✅ Cleared teacher assignments");

    await db.delete(students);
    console.log("✅ Cleared students");

    await db.delete(feePayments);
    console.log("✅ Cleared fee payments");

    await db.delete(feeStructures);
    console.log("✅ Cleared fee structures");

    await db.delete(classrooms);
    console.log("✅ Cleared classrooms");

    await db.delete(subjects);
    console.log("✅ Cleared subjects");

    // Clear auth tables
    await db.delete(sessions);
    console.log("✅ Cleared sessions");

    await db.delete(accounts);
    console.log("✅ Cleared accounts");

    await db.delete(verifications);
    console.log("✅ Cleared verifications");

    await db.delete(users);
    console.log("✅ Cleared users");

    console.log("\n🎉 DATABASE PURGED SUCCESSFULLY!");
    console.log("You can now push the new schema with: bunx drizzle-kit push");
  } catch (error) {
    console.error("❌ Error purging database:", error);
    throw error;
  }
}

purge()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
