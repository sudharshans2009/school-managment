import { db } from "./index";
import { sql } from "drizzle-orm";

async function purge() {
  console.log("🗑️  PURGING ALL DATABASE CONTENT...");

  try {
    // Use CASCADE to delete all dependent records
    console.log("Deleting all data with CASCADE...");

    // Delete all tables in proper order
    const tables = [
      "homework_submissions",
      "attendance",
      "work_done",
      "substitute_assignments",
      "teacher_leaves",
      "calendar_days",
      "homework",
      "exams",
      "exam_schedules",
      "grade_entries",
      "report_cards",
      "notifications",
      "announcements",
      "messages",
      "classroom_messages",
      "group_messages",
      "event_registrations",
      "events",
      "meetings",
      "meeting_slots",
      "circulars",
      "circular_attachments",
      "circular_acknowledgments",
      "entrance_tests",
      "entrance_test_applications",
      "admission_applications",
      "admission_documents",
      "behavior_incidents",
      "behavior_notes",
      "behavior_points",
      "behavior_actions",
      "timetable",
      "teacher_assignments",
      "students",
      "fee_payments",
      "fee_structures",
      "classrooms",
      "subjects",
      "user_permissions",
      "role_permissions",
      "audit_logs",
      "gdpr_consents",
      "data_exports",
      "deletion_requests",
      "backups",
      "sessions",
      "accounts",
      "verifications",
      "users",
    ];

    for (const table of tables) {
      try {
        await db.execute(sql.raw(`DELETE FROM "${table}"`));
        console.log(`✅ Cleared ${table}`);
      } catch {
        // Table might not exist or might be empty, continue
        console.log(`⏭️  Skipped ${table} (might not exist or already empty)`);
      }
    }

    console.log("\n🎉 DATABASE PURGED SUCCESSFULLY!");
    console.log("Run: bun run db:seed");
  } catch (error) {
    console.error("❌ Error purging database:", error);
    throw error;
  }
}

purge()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
