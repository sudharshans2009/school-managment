import { db } from "./index";
import { timetable, students, users } from "./schema";

async function verify() {
  console.log("🔍 Verifying Class 11B System...\n");

  // Check timetable
  const allPeriods = await db.select().from(timetable);
  console.log(`📅 Total timetable entries: ${allPeriods.length}`);
  
  const labs = allPeriods.filter((p) => p.sessionType === "lab");
  console.log(`🧪 Lab sessions: ${labs.length}`);
  
  const tests = allPeriods.filter((p) => p.sessionType === "test");
  console.log(`📝 Test sessions: ${tests.length}`);
  
  const extras = allPeriods.filter((p) => p.sessionType === "extra");
  console.log(`🎨 Extra periods: ${extras.length}`);
  
  // Check students
  const allStudents = await db.select().from(students);
  console.log(`\n👨‍🎓 Total students: ${allStudents.length}`);
  
  const ktpiStudents = allStudents.filter((s) => s.elective === "KTPI");
  console.log(`📚 Students with KTPI: ${ktpiStudents.length}`);
  
  const sportsStudents = allStudents.filter((s) => s.elective === "Sports");
  console.log(`⚽ Students with Sports: ${sportsStudents.length}`);
  
  // Check users by role
  const allUsers = await db.select().from(users);
  const admins = allUsers.filter((u) => u.role === "admin");
  const teachers = allUsers.filter((u) => u.role === "teacher");
  const studentUsers = allUsers.filter((u) => u.role === "student");
  
  console.log(`\n👥 Users:`);
  console.log(`   Admins: ${admins.length}`);
  console.log(`   Teachers: ${teachers.length}`);
  console.log(`   Students: ${studentUsers.length}`);
  
  console.log("\n✅ Verification Complete!");
}

verify()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
