import { db } from "./index";
import {
  users,
  classrooms,
  subjects,
  teacherAssignments,
  students,
  timetable,
  homework,
  announcements,
  classroomMessages,
} from "./schema";
import { auth } from "@/lib/auth/main";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Starting improved database seed...");

  try {
    console.log("\n👤 Creating users via Better Auth...");

    // Create Admin
    try {
      await auth.api.signUpEmail({
        body: {
          email: "admin@school.com",
          password: "admin123",
          name: "Admin User",
        },
      });
    } catch {
      console.log("Admin already exists");
    }

    const admin = await db.query.users.findFirst({
      where: eq(users.email, "admin@school.com"),
    });

    if (admin) {
      await db
        .update(users)
        .set({ role: "admin", emailVerified: true })
        .where(eq(users.id, admin.id));
      console.log("✅ Admin user ready");
    }

    // Create 7 Teachers (one for each main subject)
    const teacherData = [
      { email: "kumar@school.com", name: "Dr. Kumar", subject: "Mathematics" },
      { email: "sharma@school.com", name: "Ms. Sharma", subject: "English" },
      { email: "patel@school.com", name: "Mr. Patel", subject: "Physics" },
      { email: "singh@school.com", name: "Mrs. Singh", subject: "Chemistry" },
      {
        email: "verma@school.com",
        name: "Mr. Verma",
        subject: "Computer Science",
      },
      { email: "gupta@school.com", name: "Ms. Gupta", subject: "KTPI" },
      { email: "reddy@school.com", name: "Coach Reddy", subject: "Sports" },
    ];

    const teacherUsers = [];
    for (const teacher of teacherData) {
      try {
        await auth.api.signUpEmail({
          body: {
            email: teacher.email,
            password: "teacher123",
            name: teacher.name,
          },
        });
      } catch {
        console.log(`${teacher.name} already exists`);
      }

      const teacherUser = await db.query.users.findFirst({
        where: eq(users.email, teacher.email),
      });

      if (teacherUser) {
        await db
          .update(users)
          .set({ role: "teacher", emailVerified: true })
          .where(eq(users.id, teacherUser.id));
        teacherUsers.push(teacherUser);
      }
    }
    console.log(`✅ Created ${teacherUsers.length} teachers`);

    // Create 30 Students
    console.log("\n👨‍🎓 Creating 30 students...");
    const studentUsers = [];
    for (let i = 1; i <= 30; i++) {
      try {
        await auth.api.signUpEmail({
          body: {
            email: `student${i}@school.com`,
            password: "student123",
            name: `Student ${i}`,
          },
        });
      } catch {
        console.log(`Student ${i} already exists`);
      }

      const student = await db.query.users.findFirst({
        where: eq(users.email, `student${i}@school.com`),
      });

      if (student) {
        await db
          .update(users)
          .set({ role: "student", emailVerified: true })
          .where(eq(users.id, student.id));
        studentUsers.push(student);
      }
    }
    console.log(`✅ Created ${studentUsers.length} students`);

    // Create Classroom
    console.log("\n🏫 Creating classroom...");
    const [classroom] = await db
      .insert(classrooms)
      .values({
        name: "Class 11B",
        grade: "11",
        section: "B",
        classroomCode: "11B-2025",
        classroomKey: "key-11b-2025",
        capacity: 35,
        currentStrength: 30,
        academicYear: "2025-2026",
      })
      .returning();
    console.log("✅ Created Class 11B");

    // Create Subjects (NO DUPLICATES - unique codes)
    console.log("\n📚 Creating subjects...");
    const subjectsList = [
      { name: "Mathematics", code: "MATH11", desc: "Mathematics - Class 11" },
      { name: "English", code: "ENG11", desc: "English - Class 11" },
      { name: "Physics", code: "PHY11", desc: "Physics - Class 11" },
      { name: "Chemistry", code: "CHEM11", desc: "Chemistry - Class 11" },
      {
        name: "Computer Science",
        code: "CS11",
        desc: "Computer Science - Class 11",
      },
      {
        name: "KTPI",
        code: "KTPI11",
        desc: "Knowledge Traditions & Practices of India",
      },
      {
        name: "Sports Education",
        code: "SPORT11",
        desc: "Sports Education - Elective",
      },
      { name: "Value Education", code: "VE11", desc: "Value Education" },
      { name: "Library", code: "LIB11", desc: "Library Period" },
      {
        name: "Health & Physical Education",
        code: "HPE11",
        desc: "Health & Physical Education",
      },
      { name: "Bhajan", code: "BHAJAN11", desc: "Bhajan/Prayer" },
      { name: "Break", code: "BREAK", desc: "Break Time" },
    ];

    const createdSubjects: Record<string, typeof subjects.$inferSelect> = {};
    for (const sub of subjectsList) {
      const [subject] = await db
        .insert(subjects)
        .values({
          name: sub.name,
          code: sub.code,
          description: sub.desc,
          applicableGrades:
            sub.code === "BREAK" ? null : JSON.stringify(["11"]),
          applicableSections:
            sub.code === "BREAK" ? null : JSON.stringify(["B"]),
        })
        .returning();
      createdSubjects[sub.code] = subject;
    }
    console.log(
      `✅ Created ${Object.keys(createdSubjects).length} unique subjects`,
    );

    // Assign Teachers to Subjects
    console.log("\n👨‍🏫 Assigning teachers to subjects...");
    const assignments = [
      { teacher: teacherUsers[0], subject: "MATH11", isPrimary: true }, // Dr. Kumar - Class Teacher
      { teacher: teacherUsers[1], subject: "ENG11", isPrimary: false }, // Ms. Sharma
      { teacher: teacherUsers[2], subject: "PHY11", isPrimary: false }, // Mr. Patel
      { teacher: teacherUsers[3], subject: "CHEM11", isPrimary: false }, // Mrs. Singh
      { teacher: teacherUsers[4], subject: "CS11", isPrimary: false }, // Mr. Verma
      { teacher: teacherUsers[5], subject: "KTPI11", isPrimary: false }, // Ms. Gupta
      { teacher: teacherUsers[6], subject: "SPORT11", isPrimary: false }, // Coach Reddy
    ];

    for (const assignment of assignments) {
      await db.insert(teacherAssignments).values({
        teacherId: assignment.teacher.id,
        classroomId: classroom.id,
        subjectId: createdSubjects[assignment.subject].id,
        isPrimary: assignment.isPrimary,
      });
    }
    console.log("✅ Teachers assigned to subjects");

    // Create Student Records
    console.log("\n📝 Creating student records...");
    for (let i = 0; i < studentUsers.length; i++) {
      const elective = i < 15 ? "KTPI" : "Sports";

      await db.insert(students).values({
        userId: studentUsers[i].id,
        classroomId: classroom.id,
        rollNumber: `11B${String(i + 1).padStart(3, "0")}`,
        admissionNumber: `ADM2025${String(i + 1).padStart(4, "0")}`,
        dateOfBirth: new Date(2008, 3, 15 + i),
        bloodGroup: ["A+", "B+", "O+", "AB+", "A-"][i % 5],
        elective: elective,
        admissionDate: new Date(2025, 3, 1),
      });
    }
    console.log(`✅ Created ${studentUsers.length} student records`);

    // Create Timetable (Monday to Saturday)
    console.log("\n📅 Creating timetable...");

    const periodTimes = [
      { period: 1, start: "08:45", end: "09:25" },
      { period: 2, start: "09:25", end: "10:05" },
      { period: 3, start: "10:15", end: "10:55" }, // After 10min break
      { period: 4, start: "10:55", end: "11:35" },
      { period: 5, start: "11:35", end: "12:15" },
      { period: 6, start: "12:55", end: "13:35" }, // After lunch 40min
      { period: 7, start: "13:35", end: "14:15" },
      { period: 8, start: "14:25", end: "15:05" }, // After 10min break
      { period: 9, start: "15:05", end: "15:45" },
    ];

    // Monday - 9 periods
    const mondaySchedule = [
      {
        subject: "ENG11",
        teacher: teacherUsers[1],
        type: "regular",
        room: "201",
      },
      {
        subject: "MATH11",
        teacher: teacherUsers[0],
        type: "regular",
        room: "201",
      },
      {
        subject: "PHY11",
        teacher: teacherUsers[2],
        type: "regular",
        room: "201",
      },
      {
        subject: "CHEM11",
        teacher: teacherUsers[3],
        type: "regular",
        room: "201",
      },
      {
        subject: "CS11",
        teacher: teacherUsers[4],
        type: "regular",
        room: "201",
      },
      {
        subject: "KTPI11",
        teacher: teacherUsers[5],
        type: "regular",
        room: "201",
      },
      {
        subject: "SPORT11",
        teacher: teacherUsers[6],
        type: "regular",
        room: "Sports Ground",
      },
      {
        subject: "HPE11",
        teacher: teacherUsers[6],
        type: "extra",
        room: "Sports Ground",
      },
      {
        subject: "LIB11",
        teacher: teacherUsers[0],
        type: "extra",
        room: "Library",
      },
    ];

    for (let i = 0; i < mondaySchedule.length; i++) {
      const schedule = mondaySchedule[i];
      const time = periodTimes[i];
      await db.insert(timetable).values({
        classroomId: classroom.id,
        subjectId: createdSubjects[schedule.subject].id,
        teacherId: schedule.teacher.id,
        dayOfWeek: 1,
        periodNumber: time.period,
        startTime: time.start,
        endTime: time.end,
        room: schedule.room,
        sessionType: schedule.type as "regular" | "lab" | "test" | "extra",
      });
    }

    // Tuesday (with Computer Lab) - 9 periods
    const tuesdaySchedule = [
      {
        subject: "MATH11",
        teacher: teacherUsers[0],
        type: "regular",
        room: "201",
      },
      {
        subject: "ENG11",
        teacher: teacherUsers[1],
        type: "regular",
        room: "201",
      },
      {
        subject: "CS11",
        teacher: teacherUsers[4],
        type: "lab",
        room: "Computer Lab",
      },
      {
        subject: "CS11",
        teacher: teacherUsers[4],
        type: "lab",
        room: "Computer Lab",
      },
      {
        subject: "PHY11",
        teacher: teacherUsers[2],
        type: "regular",
        room: "201",
      },
      {
        subject: "CHEM11",
        teacher: teacherUsers[3],
        type: "regular",
        room: "201",
      },
      {
        subject: "SPORT11",
        teacher: teacherUsers[6],
        type: "regular",
        room: "Sports Ground",
      },
      {
        subject: "MATH11",
        teacher: teacherUsers[0],
        type: "test",
        room: "201",
      },
      {
        subject: "BHAJAN11",
        teacher: teacherUsers[0],
        type: "extra",
        room: "Assembly Hall",
      },
    ];

    for (let i = 0; i < tuesdaySchedule.length; i++) {
      const schedule = tuesdaySchedule[i];
      const time = periodTimes[i];
      await db.insert(timetable).values({
        classroomId: classroom.id,
        subjectId: createdSubjects[schedule.subject].id,
        teacherId: schedule.teacher.id,
        dayOfWeek: 2,
        periodNumber: time.period,
        startTime: time.start,
        endTime: time.end,
        room: schedule.room,
        sessionType: schedule.type as "regular" | "lab" | "test" | "extra",
      });
    }

    // Wednesday through Saturday (simplified 9-period days)
    const remainingDays = [
      { day: 3, name: "Wednesday" },
      { day: 4, name: "Thursday" },
      { day: 5, name: "Friday" },
      { day: 6, name: "Saturday" }, // Full day now
    ];

    for (const dayInfo of remainingDays) {
      const periodsForDay = 9; // All days have 9 periods now

      for (let i = 0; i < periodsForDay; i++) {
        const time = periodTimes[i];

        // Rotate subjects for variety
        const subjectCodes = [
          "MATH11",
          "ENG11",
          "PHY11",
          "CHEM11",
          "CS11",
          "KTPI11",
          "SPORT11",
          "VE11",
          "HPE11",
        ];
        const subjectCode = subjectCodes[i % subjectCodes.length];
        const subject = createdSubjects[subjectCode];
        const teacherIndex = Math.min(
          subjectCodes.indexOf(subjectCode),
          teacherUsers.length - 1,
        );
        const teacher = teacherUsers[teacherIndex];
        const room =
          subjectCode.includes("SPORT") || subjectCode.includes("HPE")
            ? "Sports Ground"
            : "201";
        const type =
          subjectCode.includes("VE") || subjectCode.includes("HPE")
            ? "extra"
            : "regular";

        await db.insert(timetable).values({
          classroomId: classroom.id,
          subjectId: subject.id,
          teacherId: teacher.id,
          dayOfWeek: dayInfo.day,
          periodNumber: time.period,
          startTime: time.start,
          endTime: time.end,
          room: room,
          sessionType: type as "regular" | "lab" | "test" | "extra",
        });
      }
    }
    console.log("✅ Created complete weekly timetable (9 periods/day)");

    // Create sample homework
    console.log("\n📖 Creating homework...");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);

    await db.insert(homework).values([
      {
        teacherId: teacherUsers[0].id,
        classroomId: classroom.id,
        subjectId: createdSubjects["MATH11"].id,
        title: "Calculus Practice Problems",
        description:
          "Complete Exercise 3.2 - Limits and Derivatives from textbook",
        dueDate: tomorrow,
        totalMarks: 25,
      },
      {
        teacherId: teacherUsers[2].id,
        classroomId: classroom.id,
        subjectId: createdSubjects["PHY11"].id,
        title: "Newton's Laws Lab Report",
        description:
          "Write detailed lab report with observations and conclusions",
        dueDate: tomorrow,
        totalMarks: 30,
      },
    ]);
    console.log("✅ Created sample homework");

    // Create announcements
    console.log("\n📢 Creating announcements...");
    await db.insert(announcements).values([
      {
        title: "📚 Mid-term Examinations",
        content: "Mid-term exams will begin from November 15th. Prepare well!",
        classroomId: classroom.id,
        createdBy: teacherUsers[0].id,
        priority: "high",
      },
      {
        title: "🔬 Science Exhibition",
        content:
          "Start working on your science projects. Submission deadline: November 10th",
        classroomId: classroom.id,
        createdBy: teacherUsers[2].id,
        priority: "normal",
      },
    ]);
    console.log("✅ Created announcements");

    // Create classroom message
    await db.insert(classroomMessages).values({
      classroomId: classroom.id,
      teacherId: teacherUsers[0].id,
      messageType: "quote",
      content:
        "Education is the most powerful weapon you can use to change the world. - Nelson Mandela",
      date: new Date(),
    });
    console.log("✅ Created classroom message");

    console.log("\n🎉 DATABASE SEEDED SUCCESSFULLY!");
    console.log("\n📝 Login Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Admin:          admin@school.com / admin123");
    console.log("Class Teacher:  kumar@school.com / teacher123");
    console.log("English:        sharma@school.com / teacher123");
    console.log("Physics:        patel@school.com / teacher123");
    console.log("Chemistry:      singh@school.com / teacher123");
    console.log("Computer:       verma@school.com / teacher123");
    console.log("KTPI:           gupta@school.com / teacher123");
    console.log("Sports:         reddy@school.com / teacher123");
    console.log("Student (KTPI): student1@school.com / student123");
    console.log("Student (Sport):student16@school.com / student123");
    console.log("\n📊 System Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`✅ Classroom: ${classroom.name} (${classroom.classroomCode})`);
    console.log(`✅ Students: 30 (15 KTPI, 15 Sports)`);
    console.log(`✅ Teachers: 7 (all assigned to subjects)`);
    console.log(`✅ Subjects: 12 (no duplicates)`);
    console.log(`✅ Timetable: 9 periods/day (Mon-Sat)`);
    console.log(`✅ Timings: 08:45-15:45 with breaks at 10:05, 12:15, 14:15`);
  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
