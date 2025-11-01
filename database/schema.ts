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
export const dayTypeEnum = pgEnum('day_type', ['working', 'holiday']);
export const dayDurationEnum = pgEnum('day_duration', ['full', 'half']);
export const holidayForEnum = pgEnum('holiday_for', ['all', 'students', 'teachers', 'office']);
export const leaveTypeEnum = pgEnum('leave_type', ['sick', 'casual', 'earned', 'duty', 'emergency']);
export const leaveStatusEnum = pgEnum('leave_status', ['pending', 'approved', 'rejected', 'cancelled']);
export const examTypeEnum = pgEnum('exam_type', ['class_test', 'unit_test', 'quarterly', 'midterm', 'final_exam']);
export const eventTypeEnum = pgEnum('event_type', ['academic', 'sports', 'cultural', 'meeting', 'holiday', 'other']);
export const eventStatusEnum = pgEnum('event_status', ['upcoming', 'ongoing', 'completed', 'cancelled']);
export const registrationStatusEnum = pgEnum('registration_status', ['registered', 'attended', 'absent', 'cancelled']);
export const meetingStatusEnum = pgEnum('meeting_status', ['scheduled', 'completed', 'cancelled', 'rescheduled']);
export const circularTypeEnum = pgEnum('circular_type', ['general', 'urgent', 'academic', 'administrative', 'event']);
export const admissionStatusEnum = pgEnum('admission_status', ['pending', 'under_review', 'test_scheduled', 'test_completed', 'accepted', 'rejected', 'waitlisted']);
export const documentStatusEnum = pgEnum('document_status', ['pending', 'submitted', 'verified', 'rejected']);
export const incidentSeverityEnum = pgEnum('incident_severity', ['minor', 'moderate', 'major', 'critical']);
export const actionTypeEnum = pgEnum('action_type', ['warning', 'detention', 'suspension', 'counseling', 'parent_meeting', 'other']);

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

// Calendar Days (Working Days, Holidays, Custom Timetables)
export const calendarDays = pgTable('calendar_days', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: varchar('date', { length: 10 }).notNull().unique(), // YYYY-MM-DD format
  dayType: dayTypeEnum('day_type').notNull().default('working'), // working, holiday
  dayDuration: dayDurationEnum('day_duration').notNull().default('full'), // full, half
  holidayFor: holidayForEnum('holiday_for'), // all, students, teachers, office (null if working day)
  holidayName: varchar('holiday_name', { length: 255 }), // Name of holiday
  customTimetable: integer('custom_timetable'), // 1-6 for Mon-Sat timetable, null for default based on actual day
  notes: text('notes'), // Additional notes
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Teacher Leaves Table
export const teacherLeaves = pgTable('teacher_leaves', {
  id: uuid('id').defaultRandom().primaryKey(),
  teacherId: uuid('teacher_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  leaveType: leaveTypeEnum('leave_type').notNull(),
  startDate: varchar('start_date', { length: 10 }).notNull(), // YYYY-MM-DD format
  endDate: varchar('end_date', { length: 10 }).notNull(), // YYYY-MM-DD format
  reason: text('reason').notNull(),
  status: leaveStatusEnum('status').notNull().default('pending'),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvalNotes: text('approval_notes'),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Substitute Assignments Table
export const substituteAssignments = pgTable('substitute_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  leaveId: uuid('leave_id').references(() => teacherLeaves.id, { onDelete: 'cascade' }),
  originalTeacherId: uuid('original_teacher_id').notNull().references(() => users.id),
  substituteTeacherId: uuid('substitute_teacher_id').notNull().references(() => users.id),
  classroomId: uuid('classroom_id').notNull().references(() => classrooms.id),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD format
  periodNumber: integer('period_number').notNull(),
  startTime: varchar('start_time', { length: 10 }).notNull(), // HH:MM format
  endTime: varchar('end_time', { length: 10 }).notNull(), // HH:MM format
  reason: text('reason'), // Reason for substitution
  assignedBy: uuid('assigned_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Work Done Table
export const workDone = pgTable('work_done', {
  id: uuid('id').defaultRandom().primaryKey(),
  classroomId: uuid('classroom_id').notNull().references(() => classrooms.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id),
  teacherId: uuid('teacher_id').notNull().references(() => users.id),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD format
  periodNumber: integer('period_number').notNull(),
  topicsCovered: text('topics_covered').notNull(),
  homeworkAssigned: text('homework_assigned'),
  remarks: text('remarks'),
  isSubstitute: boolean('is_substitute').default(false),
  substituteAssignmentId: uuid('substitute_assignment_id').references(() => substituteAssignments.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Exams Table
export const exams = pgTable('exams', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  examType: examTypeEnum('exam_type').notNull(),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id),
  classroomId: uuid('classroom_id').notNull().references(() => classrooms.id, { onDelete: 'cascade' }),
  examDate: timestamp('exam_date').notNull(),
  totalMarks: integer('total_marks').notNull(),
  passingMarks: integer('passing_marks'),
  duration: integer('duration'), // in minutes
  syllabus: text('syllabus'), // Topics covered in the exam
  instructions: text('instructions'), // Exam instructions
  isFinalized: boolean('is_finalized').default(false),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  finalizedBy: uuid('finalized_by').references(() => users.id),
  finalizedAt: timestamp('finalized_at'),
  academicYear: varchar('academic_year', { length: 20 }).notNull(),
  term: varchar('term', { length: 50 }), // 'Term 1', 'Term 2', etc.
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Student Grades Table
export const studentGrades = pgTable('student_grades', {
  id: uuid('id').defaultRandom().primaryKey(),
  examId: uuid('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  marksObtained: decimal('marks_obtained', { precision: 5, scale: 2 }).notNull(),
  grade: varchar('grade', { length: 5 }), // A+, A, B+, etc.
  percentage: decimal('percentage', { precision: 5, scale: 2 }),
  remarks: text('remarks'),
  isAbsent: boolean('is_absent').default(false),
  uploadedBy: uuid('uploaded_by').notNull().references(() => users.id), // Teacher who uploaded
  uploadedAt: timestamp('uploaded_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
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
  teacherLeaves: many(teacherLeaves, { relationName: 'teacherLeaves' }),
  approvedLeaves: many(teacherLeaves, { relationName: 'approvedLeaves' }),
  substituteAssignmentsAsOriginal: many(substituteAssignments, { relationName: 'originalTeacher' }),
  substituteAssignmentsAsSubstitute: many(substituteAssignments, { relationName: 'substituteTeacher' }),
  substituteAssignmentsAssigned: many(substituteAssignments, { relationName: 'assignedBy' }),
  workDone: many(workDone),
  examsCreated: many(exams, { relationName: 'examsCreated' }),
  examsFinalized: many(exams, { relationName: 'examsFinalized' }),
  gradesUploaded: many(studentGrades),
  eventsCreated: many(events),
  eventRegistrations: many(eventRegistrations),
  meetingSlots: many(meetingSlots),
  meetingBookingsAsParent: many(meetingBookings),
  circularsCreated: many(circulars),
  circularAcknowledgments: many(circularAcknowledgments),
  groupMessagesSent: many(groupMessages),
  groupMessageRecipients: many(groupMessageRecipients),
  reportCardsGenerated: many(reportCards, { relationName: 'reportCardsGenerated' }),
  reportCardsFinalized: many(reportCards, { relationName: 'reportCardsFinalized' }),
  behaviorIncidentsReported: many(behaviorIncidents),
  disciplinaryActionsAssigned: many(disciplinaryActions),
  behaviorPointsAwarded: many(behaviorPoints),
  behaviorNotesCreated: many(behaviorNotes),
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
  substituteAssignments: many(substituteAssignments),
  workDone: many(workDone),
  exams: many(exams),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  teacherAssignments: many(teacherAssignments),
  homework: many(homework),
  timetable: many(timetable),
  substituteAssignments: many(substituteAssignments),
  workDone: many(workDone),
  exams: many(exams),
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
  grades: many(studentGrades),
  eventRegistrations: many(eventRegistrations),
  meetingBookings: many(meetingBookings),
  reportCards: many(reportCards),
  behaviorIncidents: many(behaviorIncidents),
  disciplinaryActions: many(disciplinaryActions),
  behaviorPoints: many(behaviorPoints),
  behaviorNotes: many(behaviorNotes),
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

export const calendarDaysRelations = relations(calendarDays, ({ one }) => ({
  creator: one(users, { fields: [calendarDays.createdBy], references: [users.id] }),
}));

export const teacherLeavesRelations = relations(teacherLeaves, ({ one, many }) => ({
  teacher: one(users, { fields: [teacherLeaves.teacherId], references: [users.id], relationName: 'teacherLeaves' }),
  approvedByUser: one(users, { fields: [teacherLeaves.approvedBy], references: [users.id], relationName: 'approvedLeaves' }),
  substituteAssignments: many(substituteAssignments),
}));

export const substituteAssignmentsRelations = relations(substituteAssignments, ({ one, many }) => ({
  leave: one(teacherLeaves, { fields: [substituteAssignments.leaveId], references: [teacherLeaves.id] }),
  originalTeacher: one(users, { fields: [substituteAssignments.originalTeacherId], references: [users.id], relationName: 'originalTeacher' }),
  substituteTeacher: one(users, { fields: [substituteAssignments.substituteTeacherId], references: [users.id], relationName: 'substituteTeacher' }),
  classroom: one(classrooms, { fields: [substituteAssignments.classroomId], references: [classrooms.id] }),
  subject: one(subjects, { fields: [substituteAssignments.subjectId], references: [subjects.id] }),
  assignedByUser: one(users, { fields: [substituteAssignments.assignedBy], references: [users.id], relationName: 'assignedBy' }),
  workDone: many(workDone),
}));

export const workDoneRelations = relations(workDone, ({ one }) => ({
  classroom: one(classrooms, { fields: [workDone.classroomId], references: [classrooms.id] }),
  subject: one(subjects, { fields: [workDone.subjectId], references: [subjects.id] }),
  teacher: one(users, { fields: [workDone.teacherId], references: [users.id] }),
  substituteAssignment: one(substituteAssignments, { fields: [workDone.substituteAssignmentId], references: [substituteAssignments.id] }),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  subject: one(subjects, { fields: [exams.subjectId], references: [subjects.id] }),
  classroom: one(classrooms, { fields: [exams.classroomId], references: [classrooms.id] }),
  createdBy: one(users, { fields: [exams.createdBy], references: [users.id], relationName: 'examsCreated' }),
  finalizedBy: one(users, { fields: [exams.finalizedBy], references: [users.id], relationName: 'examsFinalized' }),
  grades: many(studentGrades),
}));

export const studentGradesRelations = relations(studentGrades, ({ one }) => ({
  exam: one(exams, { fields: [studentGrades.examId], references: [exams.id] }),
  student: one(students, { fields: [studentGrades.studentId], references: [students.id] }),
  uploadedBy: one(users, { fields: [studentGrades.uploadedBy], references: [users.id] }),
}));

// Events Table
export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  eventType: eventTypeEnum('event_type').notNull(),
  status: eventStatusEnum('status').notNull().default('upcoming'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  location: varchar('location', { length: 255 }),
  organizer: varchar('organizer', { length: 255 }),
  targetAudience: text('target_audience'), // JSON array: ['all', 'grade-6', 'grade-7', etc.]
  maxParticipants: integer('max_participants'),
  registrationDeadline: timestamp('registration_deadline'),
  allowRegistration: boolean('allow_registration').default(false),
  attachments: text('attachments'), // JSON array of file URLs
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Event Registrations Table
export const eventRegistrations = pgTable('event_registrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }), // If student is registering
  status: registrationStatusEnum('status').notNull().default('registered'),
  registeredAt: timestamp('registered_at').defaultNow(),
  notes: text('notes'),
});

// Parent-Teacher Meeting Slots Table
export const meetingSlots = pgTable('meeting_slots', {
  id: uuid('id').defaultRandom().primaryKey(),
  teacherId: uuid('teacher_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD format
  startTime: varchar('start_time', { length: 10 }).notNull(), // HH:MM format
  endTime: varchar('end_time', { length: 10 }).notNull(),
  duration: integer('duration').notNull().default(15), // minutes per meeting
  location: varchar('location', { length: 255 }),
  maxBookings: integer('max_bookings').default(1),
  currentBookings: integer('current_bookings').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Meeting Bookings Table
export const meetingBookings = pgTable('meeting_bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  slotId: uuid('slot_id').notNull().references(() => meetingSlots.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  status: meetingStatusEnum('status').notNull().default('scheduled'),
  purpose: text('purpose'),
  notes: text('notes'),
  feedback: text('feedback'),
  bookedAt: timestamp('booked_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  cancelledAt: timestamp('cancelled_at'),
  cancellationReason: text('cancellation_reason'),
});

// Circulars Table
export const circulars = pgTable('circulars', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  circularType: circularTypeEnum('circular_type').notNull().default('general'),
  circularNumber: varchar('circular_number', { length: 50 }), // e.g., CIR/2024/001
  targetAudience: text('target_audience').notNull(), // JSON array: ['all', 'parents', 'teachers', 'grade-6-A', etc.]
  attachments: text('attachments'), // JSON array of file URLs
  requiresAcknowledgment: boolean('requires_acknowledgment').default(false),
  expiresAt: timestamp('expires_at'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  publishedAt: timestamp('published_at'),
  isPublished: boolean('is_published').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Circular Acknowledgments Table
export const circularAcknowledgments = pgTable('circular_acknowledgments', {
  id: uuid('id').defaultRandom().primaryKey(),
  circularId: uuid('circular_id').notNull().references(() => circulars.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  acknowledgedAt: timestamp('acknowledged_at').defaultNow(),
  notes: text('notes'),
});

// Group Messages Table
export const groupMessages = pgTable('group_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  subject: varchar('subject', { length: 255 }).notNull(),
  content: text('content').notNull(),
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  targetGroups: text('target_groups').notNull(), // JSON array: ['grade-6', 'grade-7-A', 'all-teachers', etc.]
  attachments: text('attachments'), // JSON array
  priority: varchar('priority', { length: 20 }).default('normal'),
  sentAt: timestamp('sent_at').defaultNow(),
});

// Group Message Recipients Table
export const groupMessageRecipients = pgTable('group_message_recipients', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: uuid('message_id').notNull().references(() => groupMessages.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
});

// Admission Applications Table
export const admissionApplications = pgTable('admission_applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationNumber: varchar('application_number', { length: 50 }).notNull().unique(),
  studentName: varchar('student_name', { length: 255 }).notNull(),
  dateOfBirth: timestamp('date_of_birth').notNull(),
  gender: varchar('gender', { length: 10 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  address: text('address').notNull(),
  guardianName: varchar('guardian_name', { length: 255 }).notNull(),
  guardianRelation: varchar('guardian_relation', { length: 50 }).notNull(),
  guardianPhone: varchar('guardian_phone', { length: 20 }).notNull(),
  guardianEmail: varchar('guardian_email', { length: 255 }).notNull(),
  previousSchool: varchar('previous_school', { length: 255 }),
  gradeAppliedFor: varchar('grade_applied_for', { length: 50 }).notNull(),
  academicYear: varchar('academic_year', { length: 20 }).notNull(),
  status: admissionStatusEnum('status').notNull().default('pending'),
  entranceTestId: uuid('entrance_test_id').references(() => entranceTests.id),
  testScore: decimal('test_score', { precision: 5, scale: 2 }),
  interviewDate: timestamp('interview_date'),
  admissionDate: timestamp('admission_date'),
  rejectionReason: text('rejection_reason'),
  notes: text('notes'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Admission Documents Table
export const admissionDocuments = pgTable('admission_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  applicationId: uuid('application_id').notNull().references(() => admissionApplications.id, { onDelete: 'cascade' }),
  documentType: varchar('document_type', { length: 100 }).notNull(), // birth_certificate, transfer_certificate, etc.
  documentName: varchar('document_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  status: documentStatusEnum('status').notNull().default('pending'),
  verifiedBy: uuid('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at'),
  rejectionReason: text('rejection_reason'),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
});

// Entrance Tests Table
export const entranceTests = pgTable('entrance_tests', {
  id: uuid('id').defaultRandom().primaryKey(),
  testName: varchar('test_name', { length: 255 }).notNull(),
  grade: varchar('grade', { length: 50 }).notNull(),
  testDate: timestamp('test_date').notNull(),
  duration: integer('duration').notNull(), // in minutes
  totalMarks: integer('total_marks').notNull(),
  passingMarks: integer('passing_marks').notNull(),
  venue: varchar('venue', { length: 255 }),
  instructions: text('instructions'),
  syllabus: text('syllabus'),
  isActive: boolean('is_active').default(true),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Report Cards Table
export const reportCards = pgTable('report_cards', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  classroomId: uuid('classroom_id').notNull().references(() => classrooms.id),
  academicYear: varchar('academic_year', { length: 20 }).notNull(),
  term: varchar('term', { length: 50 }).notNull(), // Term 1, Term 2, Annual, etc.
  totalMarks: decimal('total_marks', { precision: 10, scale: 2 }).notNull(),
  marksObtained: decimal('marks_obtained', { precision: 10, scale: 2 }).notNull(),
  percentage: decimal('percentage', { precision: 5, scale: 2 }).notNull(),
  gpa: decimal('gpa', { precision: 3, scale: 2 }),
  grade: varchar('grade', { length: 5 }),
  rank: integer('rank'),
  attendance: decimal('attendance', { precision: 5, scale: 2 }), // percentage
  teacherRemarks: text('teacher_remarks'),
  principalRemarks: text('principal_remarks'),
  promotionStatus: varchar('promotion_status', { length: 50 }), // promoted, detained, etc.
  generatedBy: uuid('generated_by').notNull().references(() => users.id),
  generatedAt: timestamp('generated_at').defaultNow(),
  isFinalized: boolean('is_finalized').default(false),
  finalizedBy: uuid('finalized_by').references(() => users.id),
  finalizedAt: timestamp('finalized_at'),
  pdfUrl: text('pdf_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Behavior Incidents Table
export const behaviorIncidents = pgTable('behavior_incidents', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  reportedBy: uuid('reported_by').notNull().references(() => users.id),
  incidentDate: timestamp('incident_date').notNull(),
  incidentType: varchar('incident_type', { length: 100 }).notNull(), // bullying, fighting, misconduct, etc.
  severity: incidentSeverityEnum('severity').notNull(),
  location: varchar('location', { length: 255 }),
  description: text('description').notNull(),
  witnessNames: text('witness_names'),
  actionTaken: text('action_taken'),
  parentNotified: boolean('parent_notified').default(false),
  parentNotifiedAt: timestamp('parent_notified_at'),
  followUpRequired: boolean('follow_up_required').default(false),
  followUpNotes: text('follow_up_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Disciplinary Actions Table
export const disciplinaryActions = pgTable('disciplinary_actions', {
  id: uuid('id').defaultRandom().primaryKey(),
  incidentId: uuid('incident_id').references(() => behaviorIncidents.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  actionType: actionTypeEnum('action_type').notNull(),
  description: text('description').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  assignedBy: uuid('assigned_by').notNull().references(() => users.id),
  status: varchar('status', { length: 50 }).default('active'), // active, completed, revoked
  completedAt: timestamp('completed_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Merit/Demerit Points Table
export const behaviorPoints = pgTable('behavior_points', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  pointType: varchar('point_type', { length: 10 }).notNull(), // merit, demerit
  points: integer('points').notNull(),
  reason: text('reason').notNull(),
  category: varchar('category', { length: 100 }), // academics, sports, discipline, behavior, etc.
  awardedBy: uuid('awarded_by').notNull().references(() => users.id),
  awardedDate: timestamp('awarded_date').defaultNow(),
  incidentId: uuid('incident_id').references(() => behaviorIncidents.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Behavior Notes Table
export const behaviorNotes = pgTable('behavior_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  noteType: varchar('note_type', { length: 50 }).notNull(), // observation, concern, praise, progress
  content: text('content').notNull(),
  isPrivate: boolean('is_private').default(false), // visible to parents or not
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations for new tables
export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, { fields: [events.createdBy], references: [users.id] }),
  registrations: many(eventRegistrations),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one }) => ({
  event: one(events, { fields: [eventRegistrations.eventId], references: [events.id] }),
  user: one(users, { fields: [eventRegistrations.userId], references: [users.id] }),
  student: one(students, { fields: [eventRegistrations.studentId], references: [students.id] }),
}));

export const meetingSlotsRelations = relations(meetingSlots, ({ one, many }) => ({
  teacher: one(users, { fields: [meetingSlots.teacherId], references: [users.id] }),
  bookings: many(meetingBookings),
}));

export const meetingBookingsRelations = relations(meetingBookings, ({ one }) => ({
  slot: one(meetingSlots, { fields: [meetingBookings.slotId], references: [meetingSlots.id] }),
  parent: one(users, { fields: [meetingBookings.parentId], references: [users.id] }),
  student: one(students, { fields: [meetingBookings.studentId], references: [students.id] }),
}));

export const circularsRelations = relations(circulars, ({ one, many }) => ({
  creator: one(users, { fields: [circulars.createdBy], references: [users.id] }),
  acknowledgments: many(circularAcknowledgments),
}));

export const circularAcknowledgmentsRelations = relations(circularAcknowledgments, ({ one }) => ({
  circular: one(circulars, { fields: [circularAcknowledgments.circularId], references: [circulars.id] }),
  user: one(users, { fields: [circularAcknowledgments.userId], references: [users.id] }),
}));

export const groupMessagesRelations = relations(groupMessages, ({ one, many }) => ({
  sender: one(users, { fields: [groupMessages.senderId], references: [users.id] }),
  recipients: many(groupMessageRecipients),
}));

export const groupMessageRecipientsRelations = relations(groupMessageRecipients, ({ one }) => ({
  message: one(groupMessages, { fields: [groupMessageRecipients.messageId], references: [groupMessages.id] }),
  user: one(users, { fields: [groupMessageRecipients.userId], references: [users.id] }),
}));

export const admissionApplicationsRelations = relations(admissionApplications, ({ one, many }) => ({
  entranceTest: one(entranceTests, { fields: [admissionApplications.entranceTestId], references: [entranceTests.id] }),
  reviewer: one(users, { fields: [admissionApplications.reviewedBy], references: [users.id] }),
  documents: many(admissionDocuments),
}));

export const admissionDocumentsRelations = relations(admissionDocuments, ({ one }) => ({
  application: one(admissionApplications, { fields: [admissionDocuments.applicationId], references: [admissionApplications.id] }),
  verifier: one(users, { fields: [admissionDocuments.verifiedBy], references: [users.id] }),
}));

export const entranceTestsRelations = relations(entranceTests, ({ one, many }) => ({
  creator: one(users, { fields: [entranceTests.createdBy], references: [users.id] }),
  applications: many(admissionApplications),
}));

export const reportCardsRelations = relations(reportCards, ({ one }) => ({
  student: one(students, { fields: [reportCards.studentId], references: [students.id] }),
  classroom: one(classrooms, { fields: [reportCards.classroomId], references: [classrooms.id] }),
  generatedByUser: one(users, { fields: [reportCards.generatedBy], references: [users.id], relationName: 'reportCardsGenerated' }),
  finalizedByUser: one(users, { fields: [reportCards.finalizedBy], references: [users.id], relationName: 'reportCardsFinalized' }),
}));

export const behaviorIncidentsRelations = relations(behaviorIncidents, ({ one, many }) => ({
  student: one(students, { fields: [behaviorIncidents.studentId], references: [students.id] }),
  reporter: one(users, { fields: [behaviorIncidents.reportedBy], references: [users.id] }),
  actions: many(disciplinaryActions),
  points: many(behaviorPoints),
}));

export const disciplinaryActionsRelations = relations(disciplinaryActions, ({ one }) => ({
  incident: one(behaviorIncidents, { fields: [disciplinaryActions.incidentId], references: [behaviorIncidents.id] }),
  student: one(students, { fields: [disciplinaryActions.studentId], references: [students.id] }),
  assigner: one(users, { fields: [disciplinaryActions.assignedBy], references: [users.id] }),
}));

export const behaviorPointsRelations = relations(behaviorPoints, ({ one }) => ({
  student: one(students, { fields: [behaviorPoints.studentId], references: [students.id] }),
  awarder: one(users, { fields: [behaviorPoints.awardedBy], references: [users.id] }),
  incident: one(behaviorIncidents, { fields: [behaviorPoints.incidentId], references: [behaviorIncidents.id] }),
}));

export const behaviorNotesRelations = relations(behaviorNotes, ({ one }) => ({
  student: one(students, { fields: [behaviorNotes.studentId], references: [students.id] }),
  creator: one(users, { fields: [behaviorNotes.createdBy], references: [users.id] }),
}));
