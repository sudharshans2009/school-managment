import { db } from "./index";
import { timetable } from "./schema";
import { eq } from "drizzle-orm";

/**
 * Script to update the timetable with the new 9-period structure
 * This will purge existing timetable data and insert the new schedule
 * 
 * IMPORTANT: Breaks are NOT stored in the database as they are fixed in code
 * Break timings: 10:05-10:15, 12:15-12:55 (Lunch), 14:15-14:25
 */

// Period structure with exact timings (teaching periods only)
const PERIOD_TIMES = [
  { period: 1, start: "08:45", end: "09:25" },
  { period: 2, start: "09:25", end: "10:05" },
  // Break 10:05-10:15
  { period: 3, start: "10:15", end: "10:55" },
  { period: 4, start: "10:55", end: "11:35" },
  { period: 5, start: "11:35", end: "12:15" },
  // Lunch 12:15-12:55
  { period: 6, start: "12:55", end: "13:35" },
  { period: 7, start: "13:35", end: "14:15" },
  // Break 14:15-14:25
  { period: 8, start: "14:25", end: "15:05" },
  { period: 9, start: "15:05", end: "15:45" },
];

// New timetable structure
// Day: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday
const NEW_TIMETABLE = [
  // Monday
  { day: 1, period: 1, subject: "Computer" },
  { day: 1, period: 2, subject: "Yoga" },
  { day: 1, period: 3, subject: "Physics" },
  { day: 1, period: 4, subject: "KTPI" },
  { day: 1, period: 5, subject: "Physics" },
  { day: 1, period: 6, subject: "English" },
  { day: 1, period: 7, subject: "Chemistry" },
  { day: 1, period: 8, subject: "Computer" },
  { day: 1, period: 9, subject: "Maths" },
  
  // Tuesday
  { day: 2, period: 1, subject: "Computer" },
  { day: 2, period: 2, subject: "Chemistry" },
  { day: 2, period: 3, subject: "Maths" },
  { day: 2, period: 4, subject: "Computer" },
  { day: 2, period: 5, subject: "Maths" },
  { day: 2, period: 6, subject: "KTPI" },
  { day: 2, period: 7, subject: "Physics" },
  { day: 2, period: 8, subject: "Library" },
  { day: 2, period: 9, subject: "English" },
  
  // Wednesday
  { day: 3, period: 1, subject: "Maths" },
  { day: 3, period: 2, subject: "Computer" },
  { day: 3, period: 3, subject: "English" },
  { day: 3, period: 4, subject: "Chemistry" },
  { day: 3, period: 5, subject: "Maths" },
  { day: 3, period: 6, subject: "Chemistry" },
  { day: 3, period: 7, subject: "HPE" },
  { day: 3, period: 8, subject: "Physics Lab" },
  // Period 9 not scheduled on Wednesday
  
  // Thursday
  { day: 4, period: 1, subject: "KTPI" },
  { day: 4, period: 2, subject: "Computer" },
  { day: 4, period: 3, subject: "Maths" },
  { day: 4, period: 4, subject: "Chemistry" },
  { day: 4, period: 5, subject: "English" },
  { day: 4, period: 6, subject: "Physics" },
  { day: 4, period: 7, subject: "Chemistry" },
  { day: 4, period: 8, subject: "V Edu" },
  // Period 9 not scheduled on Thursday
  
  // Friday
  { day: 5, period: 1, subject: "Bajan" },
  { day: 5, period: 2, subject: "Physics" },
  { day: 5, period: 3, subject: "Chemistry Lab" },
  { day: 5, period: 4, subject: "KTPI" },
  { day: 5, period: 5, subject: "English" },
  { day: 5, period: 6, subject: "Maths" },
  { day: 5, period: 7, subject: "Physics" },
  { day: 5, period: 8, subject: "Maths" },
  // Period 9 not scheduled on Friday
];

async function updateTimetable() {
  console.log("🔄 Starting timetable update...\n");

  try {
    // Step 1: Get the classroom (assuming Class 11B exists)
    console.log("📚 Finding classroom...");
    const classroom = await db.query.classrooms.findFirst({
      where: (classrooms, { and, eq }) => 
        and(eq(classrooms.grade, "11"), eq(classrooms.section, "B"))
    });

    if (!classroom) {
      console.error("❌ Classroom 11B not found! Please run seed script first.");
      process.exit(1);
    }
    console.log(`✅ Found classroom: ${classroom.grade}${classroom.section} (ID: ${classroom.id})\n`);

    // Step 2: Get all subjects
    console.log("📖 Loading subjects...");
    const allSubjects = await db.query.subjects.findMany();
    const subjectMap = new Map(allSubjects.map(s => [s.name, s]));
    console.log(`✅ Loaded ${allSubjects.length} subjects\n`);

    // Step 3: Get all teachers
    console.log("👨‍🏫 Loading teachers...");
    const allTeachers = await db.query.users.findMany({
      where: (users, { eq }) => eq(users.role, "teacher")
    });
    
    if (allTeachers.length === 0) {
      console.error("❌ No teachers found! Please run seed script first.");
      process.exit(1);
    }
    
    // Create a map of subject to teacher (use first available teacher for each subject)
    const subjectTeacherMap = new Map<string, string>();
    for (const subject of allSubjects) {
      // Assign a teacher (for now, just cycle through available teachers)
      const teacherIndex = allSubjects.indexOf(subject) % allTeachers.length;
      subjectTeacherMap.set(subject.name, allTeachers[teacherIndex].id);
    }
    console.log(`✅ Loaded ${allTeachers.length} teachers\n`);

    // Step 4: Purge existing timetable for this classroom
    console.log("🗑️  Purging old timetable...");
    await db.delete(timetable)
      .where(eq(timetable.classroomId, classroom.id));
    console.log("✅ Old timetable purged\n");

    // Step 5: Insert new timetable
    console.log("📅 Inserting new timetable...\n");
    let insertedCount = 0;
    const errors: string[] = [];

    for (const entry of NEW_TIMETABLE) {
      const periodInfo = PERIOD_TIMES.find(p => p.period === entry.period);
      if (!periodInfo) {
        errors.push(`Period ${entry.period} timing not found`);
        continue;
      }

      const subject = subjectMap.get(entry.subject);
      if (!subject) {
        errors.push(`Subject "${entry.subject}" not found in database`);
        continue;
      }

      const teacherId = subjectTeacherMap.get(entry.subject);
      if (!teacherId) {
        errors.push(`No teacher assigned for subject "${entry.subject}"`);
        continue;
      }

      try {
        await db.insert(timetable).values({
          classroomId: classroom.id,
          subjectId: subject.id,
          teacherId: teacherId,
          dayOfWeek: entry.day,
          periodNumber: entry.period,
          startTime: periodInfo.start,
          endTime: periodInfo.end,
          room: "TBA", // Room to be assigned
          sessionType: entry.subject.includes("Lab") ? "lab" : "regular",
          isActive: true,
        });
        
        const dayName = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][entry.day];
        console.log(`✅ ${dayName} Period ${entry.period} (${periodInfo.start}-${periodInfo.end}): ${entry.subject}`);
        insertedCount++;
      } catch (error) {
        errors.push(`Failed to insert ${entry.subject} for day ${entry.day} period ${entry.period}: ${error}`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Successfully inserted: ${insertedCount} periods`);
    console.log(`   ❌ Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`);
      errors.forEach(err => console.log(`   - ${err}`));
    }

    console.log("\n✨ Timetable update complete!");
    console.log("\n📝 Notes:");
    console.log("   - Breaks are NOT in database (they're fixed in code)");
    console.log("   - Break timings: 10:05-10:15, 12:15-12:55 (Lunch), 14:15-14:25");
    console.log("   - Wednesday & Thursday: Period 9 not scheduled");
    console.log("   - Friday: Period 9 not scheduled");
    
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

// Run the update
updateTimetable()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
