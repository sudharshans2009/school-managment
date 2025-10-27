import { pgTable, text, timestamp, uuid, integer, boolean, decimal, varchar, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'teacher', 'student', 'parent']);
export const feeStatusEnum = pgEnum('fee_status', ['pending', 'paid', 'overdue', 'partial']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent', 'late', 'excused']);
export const homeworkStatusEnum = pgEnum('homework_status', ['assigned', 'submitted', 'graded', 'overdue']);

// Users Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  passwordHash: text('password_hash'),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  profileImage: text('profile_image'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Classrooms Table
export const classrooms = pgTable('classrooms', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  grade: varchar('grade', { length: 50 }).notNull(),
  section: varchar('section', { length: 10 }).notNull(),
  classroomCode: varchar('classroom_code', { length: 20 }).notNull().unique(),
  classroomKey: varchar('classroom_key', { length: 100 }).notNull(),
  capacity: integer('capacity').default(30),
  currentStrength: integer('current_strength').default(0),
  academicYear: varchar('academic_year', { length: 20 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Subjects Table
export const subjects = pgTable('subjects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  description: text('description'),
  credits: integer('credits').default(1),
  createdAt: timestamp('created_at').defaultNow(),
});

// Teacher-Classroom-Subject Mapping (Many-to-Many)
export const teacherAssignments = pgTable('teacher_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  teacherId: uuid('teacher_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  classroomId: uuid('classroom_id').notNull().references(() => classrooms.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  isPrimary: boolean('is_primary').default(false), // Primary teacher for the class
  createdAt: timestamp('created_at').defaultNow(),
});

// Students Table
export const students = pgTable('students', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  classroomId: uuid('classroom_id').references(() => classrooms.id),
  rollNumber: varchar('roll_number', { length: 20 }).notNull(),
  admissionNumber: varchar('admission_number', { length: 50 }).notNull().unique(),
  dateOfBirth: timestamp('date_of_birth').notNull(),
  parentId: uuid('parent_id').references(() => users.id),
  emergencyContact: varchar('emergency_contact', { length: 20 }),
  bloodGroup: varchar('blood_group', { length: 5 }),
  medicalInfo: text('medical_info'),
  admissionDate: timestamp('admission_date').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Homework/Assignments Table
export const homework = pgTable('homework', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  classroomId: uuid('classroom_id').notNull().references(() => classrooms.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id),
  teacherId: uuid('teacher_id').notNull().references(() => users.id),
  assignedDate: timestamp('assigned_date').defaultNow(),
  dueDate: timestamp('due_date').notNull(),
  totalMarks: integer('total_marks').default(100),
  attachments: text('attachments'), // JSON array of file URLs
  status: homeworkStatusEnum('status').default('assigned'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Homework Submissions
export const homeworkSubmissions = pgTable('homework_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  homeworkId: uuid('homework_id').notNull().references(() => homework.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  submissionText: text('submission_text'),
  attachments: text('attachments'), // JSON array
  submittedAt: timestamp('submitted_at').defaultNow(),
  marksObtained: integer('marks_obtained'),
  feedback: text('feedback'),
  gradedAt: timestamp('graded_at'),
  gradedBy: uuid('graded_by').references(() => users.id),
  status: homeworkStatusEnum('status').default('submitted'),
});

// Attendance Table
export const attendance = pgTable('attendance', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  classroomId: uuid('classroom_id').notNull().references(() => classrooms.id),
  date: timestamp('date').notNull(),
  status: attendanceStatusEnum('status').notNull(),
  remarks: text('remarks'),
  markedBy: uuid('marked_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Fee Structure Table
export const feeStructures = pgTable('fee_structures', {
  id: uuid('id').defaultRandom().primaryKey(),
  classroomId: uuid('classroom_id').references(() => classrooms.id),
  grade: varchar('grade', { length: 50 }),
  feeType: varchar('fee_type', { length: 100 }).notNull(), // tuition, transport, library, etc.
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  frequency: varchar('frequency', { length: 20 }).default('monthly'), // monthly, quarterly, annually
  dueDay: integer('due_day').default(5), // day of month
  academicYear: varchar('academic_year', { length: 20 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Fee Payments Table
export const feePayments = pgTable('fee_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  feeStructureId: uuid('fee_structure_id').notNull().references(() => feeStructures.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp('payment_date').defaultNow(),
  dueDate: timestamp('due_date').notNull(),
  status: feeStatusEnum('status').default('pending'),
  paymentMethod: varchar('payment_method', { length: 50 }), // online, cash, cheque
  transactionId: varchar('transaction_id', { length: 100 }),
  receiptNumber: varchar('receipt_number', { length: 50 }),
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Announcements Table
export const announcements = pgTable('announcements', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  classroomId: uuid('classroom_id').references(() => classrooms.id), // null = school-wide
  createdBy: uuid('created_by').notNull().references(() => users.id),
  priority: varchar('priority', { length: 20 }).default('normal'), // low, normal, high, urgent
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Timetable Table
export const timetable = pgTable('timetable', {
  id: uuid('id').defaultRandom().primaryKey(),
  classroomId: uuid('classroom_id').notNull().references(() => classrooms.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id),
  teacherId: uuid('teacher_id').notNull().references(() => users.id),
  dayOfWeek: integer('day_of_week').notNull(), // 0-6 (Sunday-Saturday)
  startTime: varchar('start_time', { length: 10 }).notNull(), // HH:MM format
  endTime: varchar('end_time', { length: 10 }).notNull(),
  room: varchar('room', { length: 50 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  teacherAssignments: many(teacherAssignments),
  studentsAsUser: many(students, { relationName: 'studentUser' }),
  studentsAsParent: many(students, { relationName: 'parentUser' }),
  homeworkCreated: many(homework),
  attendanceMarked: many(attendance),
  announcements: many(announcements),
  timetable: many(timetable),
}));

export const classroomsRelations = relations(classrooms, ({ many }) => ({
  teacherAssignments: many(teacherAssignments),
  students: many(students),
  homework: many(homework),
  attendance: many(attendance),
  announcements: many(announcements),
  timetable: many(timetable),
  feeStructures: many(feeStructures),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  teacherAssignments: many(teacherAssignments),
  homework: many(homework),
  timetable: many(timetable),
}));

export const teacherAssignmentsRelations = relations(teacherAssignments, ({ one }) => ({
  teacher: one(users, { fields: [teacherAssignments.teacherId], references: [users.id] }),
  classroom: one(classrooms, { fields: [teacherAssignments.classroomId], references: [classrooms.id] }),
  subject: one(subjects, { fields: [teacherAssignments.subjectId], references: [subjects.id] }),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, { fields: [students.userId], references: [users.id], relationName: 'studentUser' }),
  parent: one(users, { fields: [students.parentId], references: [users.id], relationName: 'parentUser' }),
  classroom: one(classrooms, { fields: [students.classroomId], references: [classrooms.id] }),
  homeworkSubmissions: many(homeworkSubmissions),
  attendance: many(attendance),
  feePayments: many(feePayments),
}));

export const homeworkRelations = relations(homework, ({ one, many }) => ({
  classroom: one(classrooms, { fields: [homework.classroomId], references: [classrooms.id] }),
  subject: one(subjects, { fields: [homework.subjectId], references: [subjects.id] }),
  teacher: one(users, { fields: [homework.teacherId], references: [users.id] }),
  submissions: many(homeworkSubmissions),
}));

export const homeworkSubmissionsRelations = relations(homeworkSubmissions, ({ one }) => ({
  homework: one(homework, { fields: [homeworkSubmissions.homeworkId], references: [homework.id] }),
  student: one(students, { fields: [homeworkSubmissions.studentId], references: [students.id] }),
  gradedByUser: one(users, { fields: [homeworkSubmissions.gradedBy], references: [users.id] }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(students, { fields: [attendance.studentId], references: [students.id] }),
  classroom: one(classrooms, { fields: [attendance.classroomId], references: [classrooms.id] }),
  markedByUser: one(users, { fields: [attendance.markedBy], references: [users.id] }),
}));

export const feeStructuresRelations = relations(feeStructures, ({ one, many }) => ({
  classroom: one(classrooms, { fields: [feeStructures.classroomId], references: [classrooms.id] }),
  payments: many(feePayments),
}));

export const feePaymentsRelations = relations(feePayments, ({ one }) => ({
  student: one(students, { fields: [feePayments.studentId], references: [students.id] }),
  feeStructure: one(feeStructures, { fields: [feePayments.feeStructureId], references: [feeStructures.id] }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  classroom: one(classrooms, { fields: [announcements.classroomId], references: [classrooms.id] }),
  creator: one(users, { fields: [announcements.createdBy], references: [users.id] }),
}));

export const timetableRelations = relations(timetable, ({ one }) => ({
  classroom: one(classrooms, { fields: [timetable.classroomId], references: [classrooms.id] }),
  subject: one(subjects, { fields: [timetable.subjectId], references: [subjects.id] }),
  teacher: one(users, { fields: [timetable.teacherId], references: [users.id] }),
}));
