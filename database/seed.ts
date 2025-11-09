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
  announcements,
  messages,
  classroomMessages,
} from "./schema";
import { auth } from "@/lib/auth/main";
import { eq } from "drizzle-orm";

async function clearData() {
  console.log("🗑️  Clearing existing data...");

  // Delete in reverse order of dependencies
  await db.delete(attendance);
  await db.delete(homework);
  await db.delete(announcements);
  await db.delete(messages);
  await db.delete(classroomMessages);
  await db.delete(timetable);
  await db.delete(teacherAssignments);
  await db.delete(students);
  await db.delete(classrooms);
  await db.delete(subjects);

  console.log("✅ Data cleared (users managed by Better Auth)");
}

async function seed() {
  console.log("🌱 Starting database seed for Class 11B...");

  try {
    const forceReseed = process.argv.includes("--force");

    if (forceReseed) {
      await clearData();
    }

    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, "admin@school.com"),
    });

    if (existingAdmin && !forceReseed) {
      console.log("⚠️  Database already seeded. Use --force to reseed");
      return;
    }

    console.log("👤 Creating users via Better Auth...");

    // Create Admin
    await auth.api.signUpEmail({
      body: {
        email: "admin@school.com",
        password: "admin123",
        name: "Admin User",
      },
    });
    const admin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, "admin@school.com"),
    });
    if (admin) {
      await db
        .update(users)
        .set({ role: "admin" })
        .where(eq(users.id, admin.id));
    }
    console.log("✅ Created admin");

    // Create 7 Teachers
    const teacherEmails = [
      { email: "kumar@school.com", name: "Dr. Kumar (Maths - Class Teacher)" },
      { email: "sharma@school.com", name: "Ms. Sharma (English)" },
      { email: "patel@school.com", name: "Mr. Patel (Physics)" },
      { email: "singh@school.com", name: "Mrs. Singh (Chemistry)" },
      { email: "verma@school.com", name: "Mr. Verma (Computer Science)" },
      { email: "gupta@school.com", name: "Ms. Gupta (KTPI)" },
      { email: "reddy@school.com", name: "Coach Reddy (Sports)" },
    ];

    for (const teacher of teacherEmails) {
      await auth.api.signUpEmail({
        body: {
          email: teacher.email,
          password: "teacher123",
          name: teacher.name,
        },
      });
      const teacherUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, teacher.email),
      });
      if (teacherUser) {
        await db
          .update(users)
          .set({ role: "teacher" })
          .where(eq(users.id, teacherUser.id));
      }
    }
    console.log("✅ Created 7 teachers");

    // Fetch teacher users
    const teacher1 = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, "kumar@school.com"),
    });
    const teacher2 = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, "sharma@school.com"),
    });
    const teacher3 = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, "patel@school.com"),
    });
    const teacher4 = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, "singh@school.com"),
    });
    const teacher5 = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, "verma@school.com"),
    });
    const teacher6 = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, "gupta@school.com"),
    });
    const teacher7 = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, "reddy@school.com"),
    });

    if (
      !teacher1 ||
      !teacher2 ||
      !teacher3 ||
      !teacher4 ||
      !teacher5 ||
      !teacher6 ||
      !teacher7 ||
      !admin
    ) {
      throw new Error("Failed to create users");
    }

    // Create 30 Students
    console.log("👨‍🎓 Creating 30 students...");
    const studentUsers = [];
    for (let i = 1; i <= 30; i++) {
      await auth.api.signUpEmail({
        body: {
          email: `student${i}@school.com`,
          password: "student123",
          name: `Student ${i}`,
        },
      });
      const student = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, `student${i}@school.com`),
      });
      if (student) {
        await db
          .update(users)
          .set({ role: "student" })
          .where(eq(users.id, student.id));
        studentUsers.push(student);
      }
    }
    console.log(`✅ Created ${studentUsers.length} students`);

    // Create Class 11B
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

    // Create Subjects
    const [english] = await db
      .insert(subjects)
      .values({
        name: "English",
        code: "ENG11",
        description: "English - Class 11",
        applicableGrades: JSON.stringify(["11"]),
        applicableSections: JSON.stringify(["B"]),
      })
      .returning();

    const [maths] = await db
      .insert(subjects)
      .values({
        name: "Mathematics",
        code: "MATH11",
        description: "Mathematics - Class 11",
        applicableGrades: JSON.stringify(["11"]),
        applicableSections: JSON.stringify(["B"]),
      })
      .returning();

    const [computer] = await db
      .insert(subjects)
      .values({
        name: "Computer Science",
        code: "CS11",
        description: "Computer Science - Class 11",
        applicableGrades: JSON.stringify(["11"]),
        applicableSections: JSON.stringify(["B"]),
      })
      .returning();

    const [physics] = await db
      .insert(subjects)
      .values({
        name: "Physics",
        code: "PHY11",
        description: "Physics - Class 11",
        applicableGrades: JSON.stringify(["11"]),
        applicableSections: JSON.stringify(["B"]),
      })
      .returning();

    const [chemistry] = await db
      .insert(subjects)
      .values({
        name: "Chemistry",
        code: "CHEM11",
        description: "Chemistry - Class 11",
        applicableGrades: JSON.stringify(["11"]),
        applicableSections: JSON.stringify(["B"]),
      })
      .returning();

    const [ktpi] = await db
      .insert(subjects)
      .values({
        name: "Knowledge Traditions & Practices of India",
        code: "KTPI11",
        description: "KTPI - Elective",
        applicableGrades: JSON.stringify(["11"]),
        applicableSections: JSON.stringify(["B"]),
      })
      .returning();

    const [sports] = await db
      .insert(subjects)
      .values({
        name: "Sports Education",
        code: "SPORT11",
        description: "Sports - Elective",
        applicableGrades: JSON.stringify(["11"]),
        applicableSections: JSON.stringify(["B"]),
      })
      .returning();

    // Extra periods
    const [valueEd] = await db
      .insert(subjects)
      .values({
        name: "Value Education",
        code: "VE",
        description: "Value Education",
        applicableGrades: null,
        applicableSections: null,
      })
      .returning();

    const [library] = await db
      .insert(subjects)
      .values({
        name: "Library",
        code: "LIB",
        description: "Library Period",
        applicableGrades: null,
        applicableSections: null,
      })
      .returning();

    const [hpe] = await db
      .insert(subjects)
      .values({
        name: "Health & Physical Education",
        code: "HPE",
        description: "Sports/HPE",
        applicableGrades: null,
        applicableSections: null,
      })
      .returning();

    const [bhajan] = await db
      .insert(subjects)
      .values({
        name: "Bhajan",
        code: "BHAJAN",
        description: "Bhajan/Prayer",
        applicableGrades: null,
        applicableSections: null,
      })
      .returning();

    const [breakSubject] = await db
      .insert(subjects)
      .values({
        name: "Break",
        code: "BREAK",
        description: "Break Time",
        applicableGrades: null,
        applicableSections: null,
      })
      .returning();
    console.log("✅ Created subjects");

    // Assign Teachers
    await db.insert(teacherAssignments).values([
      {
        teacherId: teacher1.id,
        classroomId: classroom.id,
        subjectId: maths.id,
        isPrimary: true,
      },
      {
        teacherId: teacher2.id,
        classroomId: classroom.id,
        subjectId: english.id,
        isPrimary: false,
      },
      {
        teacherId: teacher3.id,
        classroomId: classroom.id,
        subjectId: physics.id,
        isPrimary: false,
      },
      {
        teacherId: teacher4.id,
        classroomId: classroom.id,
        subjectId: chemistry.id,
        isPrimary: false,
      },
      {
        teacherId: teacher5.id,
        classroomId: classroom.id,
        subjectId: computer.id,
        isPrimary: false,
      },
      {
        teacherId: teacher6.id,
        classroomId: classroom.id,
        subjectId: ktpi.id,
        isPrimary: false,
      },
      {
        teacherId: teacher7.id,
        classroomId: classroom.id,
        subjectId: sports.id,
        isPrimary: false,
      },
    ]);
    console.log("✅ Assigned teachers");

    // Create Student Records with electives
    const studentRecords = [];
    for (let i = 0; i < studentUsers.length; i++) {
      const elective = i < 15 ? "KTPI" : "Sports";
      const [student] = await db
        .insert(students)
        .values({
          userId: studentUsers[i].id,
          classroomId: classroom.id,
          rollNumber: `11B${String(i + 1).padStart(3, "0")}`,
          admissionNumber: `ADM2025${String(i + 1).padStart(4, "0")}`,
          dateOfBirth: new Date(2008, 3, 15 + i),
          bloodGroup: ["A+", "B+", "O+", "AB+", "A-"][i % 5],
          elective: elective,
          admissionDate: new Date(2025, 3, 1),
        })
        .returning();
      studentRecords.push(student);
    }
    console.log("✅ Created student records (15 KTPI, 15 Sports)");

    // Create 9-Period Timetable
    // Monday
    await db.insert(timetable).values([
      {
        classroomId: classroom.id,
        subjectId: english.id,
        teacherId: teacher2.id,
        dayOfWeek: 1,
        periodNumber: 1,
        startTime: "08:00",
        endTime: "08:50",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: maths.id,
        teacherId: teacher1.id,
        dayOfWeek: 1,
        periodNumber: 2,
        startTime: "08:50",
        endTime: "09:40",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: physics.id,
        teacherId: teacher3.id,
        dayOfWeek: 1,
        periodNumber: 3,
        startTime: "09:40",
        endTime: "10:30",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: breakSubject.id,
        teacherId: teacher1.id,
        dayOfWeek: 1,
        periodNumber: 4,
        startTime: "10:30",
        endTime: "11:00",
        room: "Playground",
        sessionType: "extra",
      },
      {
        classroomId: classroom.id,
        subjectId: chemistry.id,
        teacherId: teacher4.id,
        dayOfWeek: 1,
        periodNumber: 5,
        startTime: "11:00",
        endTime: "11:50",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: computer.id,
        teacherId: teacher5.id,
        dayOfWeek: 1,
        periodNumber: 6,
        startTime: "11:50",
        endTime: "12:40",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: ktpi.id,
        teacherId: teacher6.id,
        dayOfWeek: 1,
        periodNumber: 7,
        startTime: "12:40",
        endTime: "13:30",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: breakSubject.id,
        teacherId: teacher1.id,
        dayOfWeek: 1,
        periodNumber: 8,
        startTime: "13:30",
        endTime: "14:15",
        room: "Cafeteria",
        sessionType: "extra",
      },
      {
        classroomId: classroom.id,
        subjectId: valueEd.id,
        teacherId: teacher1.id,
        dayOfWeek: 1,
        periodNumber: 9,
        startTime: "14:15",
        endTime: "15:05",
        room: "Room 201",
        sessionType: "extra",
      },
      {
        classroomId: classroom.id,
        subjectId: hpe.id,
        teacherId: teacher7.id,
        dayOfWeek: 1,
        periodNumber: 10,
        startTime: "15:05",
        endTime: "15:55",
        room: "Sports Ground",
        sessionType: "extra",
      },
      {
        classroomId: classroom.id,
        subjectId: library.id,
        teacherId: teacher1.id,
        dayOfWeek: 1,
        periodNumber: 11,
        startTime: "15:55",
        endTime: "16:45",
        room: "Library",
        sessionType: "extra",
      },
    ]);

    // Tuesday - Computer Lab day
    await db.insert(timetable).values([
      {
        classroomId: classroom.id,
        subjectId: maths.id,
        teacherId: teacher1.id,
        dayOfWeek: 2,
        periodNumber: 1,
        startTime: "08:00",
        endTime: "08:50",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: english.id,
        teacherId: teacher2.id,
        dayOfWeek: 2,
        periodNumber: 2,
        startTime: "08:50",
        endTime: "09:40",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: computer.id,
        teacherId: teacher5.id,
        dayOfWeek: 2,
        periodNumber: 3,
        startTime: "09:40",
        endTime: "10:30",
        room: "Computer Lab",
        sessionType: "lab",
      },
      {
        classroomId: classroom.id,
        subjectId: breakSubject.id,
        teacherId: teacher1.id,
        dayOfWeek: 2,
        periodNumber: 4,
        startTime: "10:30",
        endTime: "11:00",
        room: "Playground",
        sessionType: "extra",
      },
      {
        classroomId: classroom.id,
        subjectId: computer.id,
        teacherId: teacher5.id,
        dayOfWeek: 2,
        periodNumber: 5,
        startTime: "11:00",
        endTime: "11:50",
        room: "Computer Lab",
        sessionType: "lab",
      },
      {
        classroomId: classroom.id,
        subjectId: physics.id,
        teacherId: teacher3.id,
        dayOfWeek: 2,
        periodNumber: 6,
        startTime: "11:50",
        endTime: "12:40",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: chemistry.id,
        teacherId: teacher4.id,
        dayOfWeek: 2,
        periodNumber: 7,
        startTime: "12:40",
        endTime: "13:30",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: breakSubject.id,
        teacherId: teacher1.id,
        dayOfWeek: 2,
        periodNumber: 8,
        startTime: "13:30",
        endTime: "14:15",
        room: "Cafeteria",
        sessionType: "extra",
      },
      {
        classroomId: classroom.id,
        subjectId: sports.id,
        teacherId: teacher7.id,
        dayOfWeek: 2,
        periodNumber: 9,
        startTime: "14:15",
        endTime: "15:05",
        room: "Sports Ground",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: maths.id,
        teacherId: teacher1.id,
        dayOfWeek: 2,
        periodNumber: 10,
        startTime: "15:05",
        endTime: "15:55",
        room: "Room 201",
        sessionType: "test",
      },
      {
        classroomId: classroom.id,
        subjectId: bhajan.id,
        teacherId: teacher1.id,
        dayOfWeek: 2,
        periodNumber: 11,
        startTime: "15:55",
        endTime: "16:45",
        room: "Assembly Hall",
        sessionType: "extra",
      },
    ]);

    // Wednesday - Physics Lab day
    await db.insert(timetable).values([
      {
        classroomId: classroom.id,
        subjectId: physics.id,
        teacherId: teacher3.id,
        dayOfWeek: 3,
        periodNumber: 1,
        startTime: "08:00",
        endTime: "08:50",
        room: "Physics Lab",
        sessionType: "lab",
      },
      {
        classroomId: classroom.id,
        subjectId: physics.id,
        teacherId: teacher3.id,
        dayOfWeek: 3,
        periodNumber: 2,
        startTime: "08:50",
        endTime: "09:40",
        room: "Physics Lab",
        sessionType: "lab",
      },
      {
        classroomId: classroom.id,
        subjectId: maths.id,
        teacherId: teacher1.id,
        dayOfWeek: 3,
        periodNumber: 3,
        startTime: "09:40",
        endTime: "10:30",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: breakSubject.id,
        teacherId: teacher1.id,
        dayOfWeek: 3,
        periodNumber: 4,
        startTime: "10:30",
        endTime: "11:00",
        room: "Playground",
        sessionType: "extra",
      },
      {
        classroomId: classroom.id,
        subjectId: english.id,
        teacherId: teacher2.id,
        dayOfWeek: 3,
        periodNumber: 5,
        startTime: "11:00",
        endTime: "11:50",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: chemistry.id,
        teacherId: teacher4.id,
        dayOfWeek: 3,
        periodNumber: 6,
        startTime: "11:50",
        endTime: "12:40",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: computer.id,
        teacherId: teacher5.id,
        dayOfWeek: 3,
        periodNumber: 7,
        startTime: "12:40",
        endTime: "13:30",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: breakSubject.id,
        teacherId: teacher1.id,
        dayOfWeek: 3,
        periodNumber: 8,
        startTime: "13:30",
        endTime: "14:15",
        room: "Cafeteria",
        sessionType: "extra",
      },
      {
        classroomId: classroom.id,
        subjectId: ktpi.id,
        teacherId: teacher6.id,
        dayOfWeek: 3,
        periodNumber: 9,
        startTime: "14:15",
        endTime: "15:05",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: english.id,
        teacherId: teacher2.id,
        dayOfWeek: 3,
        periodNumber: 10,
        startTime: "15:05",
        endTime: "15:55",
        room: "Room 201",
        sessionType: "test",
      },
      {
        classroomId: classroom.id,
        subjectId: hpe.id,
        teacherId: teacher7.id,
        dayOfWeek: 3,
        periodNumber: 11,
        startTime: "15:55",
        endTime: "16:45",
        room: "Sports Ground",
        sessionType: "extra",
      },
    ]);

    // Thursday - Chemistry Lab day
    await db.insert(timetable).values([
      {
        classroomId: classroom.id,
        subjectId: chemistry.id,
        teacherId: teacher4.id,
        dayOfWeek: 4,
        periodNumber: 1,
        startTime: "08:00",
        endTime: "08:50",
        room: "Chemistry Lab",
        sessionType: "lab",
      },
      {
        classroomId: classroom.id,
        subjectId: chemistry.id,
        teacherId: teacher4.id,
        dayOfWeek: 4,
        periodNumber: 2,
        startTime: "08:50",
        endTime: "09:40",
        room: "Chemistry Lab",
        sessionType: "lab",
      },
      {
        classroomId: classroom.id,
        subjectId: english.id,
        teacherId: teacher2.id,
        dayOfWeek: 4,
        periodNumber: 3,
        startTime: "09:40",
        endTime: "10:30",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: breakSubject.id,
        teacherId: teacher1.id,
        dayOfWeek: 4,
        periodNumber: 4,
        startTime: "10:30",
        endTime: "11:00",
        room: "Playground",
        sessionType: "extra",
      },
      {
        classroomId: classroom.id,
        subjectId: maths.id,
        teacherId: teacher1.id,
        dayOfWeek: 4,
        periodNumber: 5,
        startTime: "11:00",
        endTime: "11:50",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: physics.id,
        teacherId: teacher3.id,
        dayOfWeek: 4,
        periodNumber: 6,
        startTime: "11:50",
        endTime: "12:40",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: sports.id,
        teacherId: teacher7.id,
        dayOfWeek: 4,
        periodNumber: 7,
        startTime: "12:40",
        endTime: "13:30",
        room: "Sports Ground",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: breakSubject.id,
        teacherId: teacher1.id,
        dayOfWeek: 4,
        periodNumber: 8,
        startTime: "13:30",
        endTime: "14:15",
        room: "Cafeteria",
        sessionType: "extra",
      },
      {
        classroomId: classroom.id,
        subjectId: computer.id,
        teacherId: teacher5.id,
        dayOfWeek: 4,
        periodNumber: 9,
        startTime: "14:15",
        endTime: "15:05",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: physics.id,
        teacherId: teacher3.id,
        dayOfWeek: 4,
        periodNumber: 10,
        startTime: "15:05",
        endTime: "15:55",
        room: "Room 201",
        sessionType: "test",
      },
      {
        classroomId: classroom.id,
        subjectId: library.id,
        teacherId: teacher1.id,
        dayOfWeek: 4,
        periodNumber: 11,
        startTime: "15:55",
        endTime: "16:45",
        room: "Library",
        sessionType: "extra",
      },
    ]);

    // Friday - Test day
    await db.insert(timetable).values([
      {
        classroomId: classroom.id,
        subjectId: computer.id,
        teacherId: teacher5.id,
        dayOfWeek: 5,
        periodNumber: 1,
        startTime: "08:00",
        endTime: "08:50",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: maths.id,
        teacherId: teacher1.id,
        dayOfWeek: 5,
        periodNumber: 2,
        startTime: "08:50",
        endTime: "09:40",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: chemistry.id,
        teacherId: teacher4.id,
        dayOfWeek: 5,
        periodNumber: 3,
        startTime: "09:40",
        endTime: "10:30",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: breakSubject.id,
        teacherId: teacher1.id,
        dayOfWeek: 5,
        periodNumber: 4,
        startTime: "10:30",
        endTime: "11:00",
        room: "Playground",
        sessionType: "extra",
      },
      {
        classroomId: classroom.id,
        subjectId: english.id,
        teacherId: teacher2.id,
        dayOfWeek: 5,
        periodNumber: 5,
        startTime: "11:00",
        endTime: "11:50",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: physics.id,
        teacherId: teacher3.id,
        dayOfWeek: 5,
        periodNumber: 6,
        startTime: "11:50",
        endTime: "12:40",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: ktpi.id,
        teacherId: teacher6.id,
        dayOfWeek: 5,
        periodNumber: 7,
        startTime: "12:40",
        endTime: "13:30",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: breakSubject.id,
        teacherId: teacher1.id,
        dayOfWeek: 5,
        periodNumber: 8,
        startTime: "13:30",
        endTime: "14:15",
        room: "Cafeteria",
        sessionType: "extra",
      },
      {
        classroomId: classroom.id,
        subjectId: chemistry.id,
        teacherId: teacher4.id,
        dayOfWeek: 5,
        periodNumber: 9,
        startTime: "14:15",
        endTime: "15:05",
        room: "Room 201",
        sessionType: "test",
      },
      {
        classroomId: classroom.id,
        subjectId: computer.id,
        teacherId: teacher5.id,
        dayOfWeek: 5,
        periodNumber: 10,
        startTime: "15:05",
        endTime: "15:55",
        room: "Room 201",
        sessionType: "test",
      },
      {
        classroomId: classroom.id,
        subjectId: ktpi.id,
        teacherId: teacher6.id,
        dayOfWeek: 5,
        periodNumber: 11,
        startTime: "15:55",
        endTime: "16:45",
        room: "Room 201",
        sessionType: "test",
      },
    ]);

    // Saturday - Half day (Monday's schedule)
    await db.insert(timetable).values([
      {
        classroomId: classroom.id,
        subjectId: english.id,
        teacherId: teacher2.id,
        dayOfWeek: 6,
        periodNumber: 1,
        startTime: "08:00",
        endTime: "08:50",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: maths.id,
        teacherId: teacher1.id,
        dayOfWeek: 6,
        periodNumber: 2,
        startTime: "08:50",
        endTime: "09:40",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: physics.id,
        teacherId: teacher3.id,
        dayOfWeek: 6,
        periodNumber: 3,
        startTime: "09:40",
        endTime: "10:30",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: breakSubject.id,
        teacherId: teacher1.id,
        dayOfWeek: 6,
        periodNumber: 4,
        startTime: "10:30",
        endTime: "11:00",
        room: "Playground",
        sessionType: "extra",
      },
      {
        classroomId: classroom.id,
        subjectId: chemistry.id,
        teacherId: teacher4.id,
        dayOfWeek: 6,
        periodNumber: 5,
        startTime: "11:00",
        endTime: "11:50",
        room: "Room 201",
        sessionType: "regular",
      },
      {
        classroomId: classroom.id,
        subjectId: sports.id,
        teacherId: teacher7.id,
        dayOfWeek: 6,
        periodNumber: 6,
        startTime: "11:50",
        endTime: "12:40",
        room: "Sports Ground",
        sessionType: "test",
      },
    ]);
    console.log("✅ Created 9-period timetable with labs and tests");

    // Create homework
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    await db.insert(homework).values([
      {
        teacherId: teacher1.id,
        classroomId: classroom.id,
        subjectId: maths.id,
        title: "Calculus Practice Set 1",
        description:
          "Complete all problems from Exercise 3.2 - Limits and Derivatives",
        dueDate: tomorrow,
        totalMarks: 25,
      },
      {
        teacherId: teacher3.id,
        classroomId: classroom.id,
        subjectId: physics.id,
        title: "Lab Report: Newton's Laws of Motion",
        description:
          "Write a detailed lab report on the experiment conducted today",
        dueDate: nextWeek,
        totalMarks: 30,
      },
      {
        teacherId: teacher2.id,
        classroomId: classroom.id,
        subjectId: english.id,
        title: "Essay: Impact of Literature on Society",
        description:
          "Write a 750-word essay analyzing the role of literature in shaping society",
        dueDate: nextWeek,
        totalMarks: 40,
      },
    ]);
    console.log("✅ Created homework");

    // Create announcements
    await db.insert(announcements).values([
      {
        title: "📚 Mid-term Examinations Schedule",
        content:
          "Mid-term exams will begin from November 15th. Exam schedule will be shared by November 5th.",
        classroomId: classroom.id,
        createdBy: teacher1.id,
        priority: "high",
      },
      {
        title: "🔬 Science Exhibition Reminder",
        content:
          "Start preparing your science projects. Submission deadline: November 10th.",
        classroomId: classroom.id,
        createdBy: teacher3.id,
        priority: "normal",
      },
    ]);
    console.log("✅ Created announcements");

    // Create classroom message
    await db.insert(classroomMessages).values({
      classroomId: classroom.id,
      teacherId: teacher1.id,
      messageType: "quote",
      content:
        "The only way to do great work is to love what you do. - Steve Jobs",
      date: new Date(),
    });
    console.log("✅ Created classroom message");

    console.log("\n🎉 Class 11B System Ready!");
    console.log("\n📝 Login Credentials:");
    console.log("Admin: admin@school.com / admin123");
    console.log("Class Teacher: kumar@school.com / teacher123");
    console.log("English Teacher: sharma@school.com / teacher123");
    console.log("Student (KTPI): student1@school.com / student123");
    console.log("Student (Sports): student16@school.com / student123");
    console.log(`\n🔗 Classroom ID: ${classroom.id}`);
    console.log("\n📊 System Features:");
    console.log("✅ 9-period day (08:00-16:45)");
    console.log(
      "✅ Labs: Computer (Tue P3-5), Physics (Wed P1-2), Chemistry (Thu P1-2)",
    );
    console.log("✅ Tests: Weekly for all subjects");
    console.log("✅ Extras: Value Ed, Library, HPE, Bhajan");
    console.log("✅ Electives: 15 KTPI, 15 Sports");
    console.log("✅ Saturday: Half day (6 periods)");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
