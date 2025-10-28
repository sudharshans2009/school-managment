import { pgTable, text, timestamp, uuid, integer, boolean, decimal, varchar, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'teacher', 'student', 'parent']);
export const feeStatusEnum = pgEnum('fee_status', ['pending', 'paid', 'overdue', 'partial']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent', 'late', 'excused']);
export const homeworkStatusEnum = pgEnum('homework_status', ['assigned', 'submitted', 'graded', 'overdue']);
export const messageStatusEnum = pgEnum('message_status', ['sent', 'read']);
export const messageTypeEnum = pgEnum('message_type', ['absence', 'query', 'request', 'general']);
export const sessionTypeEnum = pgEnum('session_type', ['regular', 'lab', 'test', 'extra']);

// Users Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
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

// Better Auth - Session Table
export const sessions = pgTable('session', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Better Auth - Account Table (for OAuth providers)
export const accounts = pgTable('account', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  expiresAt: timestamp('expires_at'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Better Auth - Verification Table
export const verifications = pgTable('verification', {
  id: uuid('id').defaultRandom().primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
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
  // Class and section filters - JSON arrays stored as text
  // If null or empty, applies to all classes/sections
  applicableGrades: text('applicable_grades'), // JSON array like ["6", "7", "8", "9", "10"]
  applicableSections: text('applicable_sections'), // JSON array like ["A", "B"] or null for all
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
  elective: varchar('elective', { length: 100 }), // For students to choose electives like KTPI or Sports
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
  periodNumber: integer('period_number').notNull(), // 1-9 for the 9-period system
  startTime: varchar('start_time', { length: 10 }).notNull(), // HH:MM format
  endTime: varchar('end_time', { length: 10 }).notNull(),
  room: varchar('room', { length: 50 }),
  sessionType: sessionTypeEnum('session_type').default('regular'), // regular, lab, test, extra
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Messages Table (Student-Teacher Communication)
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  receiverId: uuid('receiver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subject: varchar('subject', { length: 255 }).notNull(),
  message: text('message').notNull(),
  messageType: messageTypeEnum('message_type').default('general'),
  status: messageStatusEnum('status').default('sent'),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Classroom Messages (Daily Quotes, Class Announcements by Class Teacher)
export const classroomMessages = pgTable('classroom_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  classroomId: uuid('classroom_id').notNull().references(() => classrooms.id, { onDelete: 'cascade' }),
  teacherId: uuid('teacher_id').notNull().references(() => users.id),
  messageType: varchar('message_type', { length: 50 }).notNull(), // 'quote', 'announcement', 'reminder'
  content: text('content').notNull(),
  date: timestamp('date').defaultNow(),
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
  sentMessages: many(messages, { relationName: 'sentMessages' }),
  receivedMessages: many(messages, { relationName: 'receivedMessages' }),
  classroomMessages: many(classroomMessages),
}));

export const classroomsRelations = relations(classrooms, ({ many }) => ({
  teacherAssignments: many(teacherAssignments),
  students: many(students),
  homework: many(homework),
  attendance: many(attendance),
  announcements: many(announcements),
  timetable: many(timetable),
  feeStructures: many(feeStructures),
  classroomMessages: many(classroomMessages),
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

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id], relationName: 'sentMessages' }),
  receiver: one(users, { fields: [messages.receiverId], references: [users.id], relationName: 'receivedMessages' }),
}));

export const classroomMessagesRelations = relations(classroomMessages, ({ one }) => ({
  classroom: one(classrooms, { fields: [classroomMessages.classroomId], references: [classrooms.id] }),
  teacher: one(users, { fields: [classroomMessages.teacherId], references: [users.id] }),
}));
