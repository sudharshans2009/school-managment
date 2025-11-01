# 📚 Database Schema Quick Reference

## Table Relationships

```
users (Admin/Teacher/Student/Parent)
  ├─→ teacherAssignments (many)
  ├─→ students (as user, many)
  ├─→ students (as parent, many)
  ├─→ homework (as creator, many)
  ├─→ attendance (as marker, many)
  └─→ announcements (as creator, many)

classrooms
  ├─→ teacherAssignments (many)
  ├─→ students (many)
  ├─→ homework (many)
  ├─→ attendance (many)
  ├─→ announcements (many)
  ├─→ timetable (many)
  └─→ feeStructures (many)

subjects
  ├─→ teacherAssignments (many)
  ├─→ homework (many)
  └─→ timetable (many)

students
  ├─→ homeworkSubmissions (many)
  ├─→ attendance (many)
  └─→ feePayments (many)

homework
  └─→ homeworkSubmissions (many)

feeStructures
  └─→ feePayments (many)
```

---

## Enums

### user_role

- `admin` - Full system access
- `teacher` - Manage assigned classrooms
- `student` - View own data
- `parent` - View child's data

### fee_status

- `pending` - Not yet paid
- `paid` - Payment complete
- `overdue` - Past due date
- `partial` - Partially paid

### attendance_status

- `present` - Student attended
- `absent` - Student absent
- `late` - Student came late
- `excused` - Excused absence

### homework_status

- `assigned` - Given to students
- `submitted` - Student submitted
- `graded` - Teacher graded
- `overdue` - Past deadline

---

## Key Fields by Table

### 🔑 users

- `id` (UUID, PK)
- `email` (Unique)
- `name`
- `role` (Enum)
- `passwordHash`
- `phone`, `address`, `profileImage`
- `isActive`

### 🏫 classrooms

- `id` (UUID, PK)
- `name`, `grade`, `section`
- `classroomCode` (6 chars, Unique) ⭐
- `classroomKey` (Secure access) ⭐
- `capacity`, `currentStrength`
- `academicYear`
- `isActive`

### 📚 subjects

- `id` (UUID, PK)
- `name`, `code` (Unique)
- `description`, `credits`

### 👥 teacherAssignments

- `id` (UUID, PK)
- `teacherId` (FK → users)
- `classroomId` (FK → classrooms)
- `subjectId` (FK → subjects)
- `isPrimary` (Boolean)

### 🧑‍🎓 students

- `id` (UUID, PK)
- `userId` (FK → users)
- `classroomId` (FK → classrooms)
- `rollNumber`, `admissionNumber` (Unique)
- `dateOfBirth`
- `parentId` (FK → users)
- `emergencyContact`, `bloodGroup`, `medicalInfo`

### 📝 homework

- `id` (UUID, PK)
- `title`, `description`
- `classroomId` (FK)
- `subjectId` (FK)
- `teacherId` (FK)
- `assignedDate`, `dueDate`
- `totalMarks`
- `attachments` (JSON array)
- `status` (Enum)

### 📄 homeworkSubmissions

- `id` (UUID, PK)
- `homeworkId` (FK)
- `studentId` (FK)
- `submissionText`
- `attachments` (JSON)
- `submittedAt`
- `marksObtained`, `feedback`
- `gradedBy` (FK → users)
- `gradedAt`

### ✅ attendance

- `id` (UUID, PK)
- `studentId` (FK)
- `classroomId` (FK)
- `date`
- `status` (Enum)
- `remarks`
- `markedBy` (FK → users)

### 💰 feeStructures

- `id` (UUID, PK)
- `classroomId` (Optional FK)
- `grade` (Optional)
- `feeType` (tuition, transport, etc.)
- `amount` (Decimal)
- `frequency` (monthly/quarterly/annually)
- `dueDay` (1-31)
- `academicYear`
- `isActive`

### 💳 feePayments

- `id` (UUID, PK)
- `studentId` (FK)
- `feeStructureId` (FK)
- `amount` (Decimal)
- `paymentDate`, `dueDate`
- `status` (Enum)
- `paymentMethod` (online/cash/cheque)
- `transactionId`, `receiptNumber`

### 📢 announcements

- `id` (UUID, PK)
- `title`, `content`
- `classroomId` (Optional - null = school-wide)
- `createdBy` (FK → users)
- `priority` (low/normal/high/urgent)
- `expiresAt` (Optional)
- `isActive`

### 🕐 timetable

- `id` (UUID, PK)
- `classroomId` (FK)
- `subjectId` (FK)
- `teacherId` (FK)
- `dayOfWeek` (0-6, Sunday-Saturday)
- `startTime`, `endTime` (HH:MM format)
- `room` (Optional)
- `isActive`

---

## Common Queries

### Get classroom with all details

```typescript
const classroom = await db.query.classrooms.findFirst({
  where: eq(classrooms.id, classroomId),
  with: {
    students: {
      with: { user: true },
    },
    teacherAssignments: {
      with: {
        teacher: true,
        subject: true,
      },
    },
    timetable: {
      with: {
        subject: true,
        teacher: true,
      },
    },
  },
});
```

### Get student with submissions

```typescript
const student = await db.query.students.findFirst({
  where: eq(students.id, studentId),
  with: {
    user: true,
    parent: true,
    classroom: true,
    homeworkSubmissions: {
      with: { homework: true },
    },
    attendance: true,
    feePayments: true,
  },
});
```

### Get teacher's classrooms

```typescript
const assignments = await db.query.teacherAssignments.findMany({
  where: eq(teacherAssignments.teacherId, teacherId),
  with: {
    classroom: true,
    subject: true,
  },
});
```

### Get today's timetable

```typescript
const today = new Date().getDay();
const schedule = await db.query.timetable.findMany({
  where: and(
    eq(timetable.classroomId, classroomId),
    eq(timetable.dayOfWeek, today),
    eq(timetable.isActive, true),
  ),
  with: {
    subject: true,
    teacher: true,
  },
  orderBy: timetable.startTime,
});
```

### Mark attendance (bulk)

```typescript
const attendanceRecords = students.map((student) => ({
  studentId: student.id,
  classroomId: classroomId,
  date: new Date(),
  status: "present",
  markedBy: teacherId,
}));

await db.insert(attendance).values(attendanceRecords);
```

---

## Validation Schemas (Zod)

All input validation schemas are in `lib/validations.ts`:

- `loginSchema` - User login
- `registerSchema` - User registration
- `createClassroomSchema` - Create classroom
- `createSubjectSchema` - Create subject
- `assignTeacherSchema` - Assign teacher
- `createStudentSchema` - Add student
- `createHomeworkSchema` - Create homework
- `submitHomeworkSchema` - Submit homework
- `gradeHomeworkSchema` - Grade submission
- `markAttendanceSchema` - Mark attendance
- `bulkAttendanceSchema` - Bulk attendance
- `createFeeStructureSchema` - Fee setup
- `recordPaymentSchema` - Record payment
- `createAnnouncementSchema` - Post announcement
- `createTimetableSchema` - Add schedule

---

## Helper Functions

Available in `lib/helpers.ts`:

- `generateClassroomCode()` - 6-char code
- `generateClassroomKey()` - 32-char key
- `hashPassword(password)` - Hash password
- `verifyPassword(password, hash)` - Verify password
- `formatDate(date)` - Format date string
- `formatTime(time)` - Format time (12h)
- `getCurrentAcademicYear()` - Get current year
- `generateReceiptNumber()` - Generate receipt #
- `calculateAttendancePercentage(present, total)` - %
- `getFeeStatus(dueDate, paymentDate)` - Status
- `getDayName(dayOfWeek)` - Day name
- `getHomeworkStatus(dueDate, submittedAt)` - Status

---

## Access Patterns by Role

### 👨‍💼 Admin

- Full access to all tables
- Create/edit classrooms, subjects, users
- Assign teachers to classrooms
- View all analytics and reports

### 👩‍🏫 Teacher

- View assigned classrooms via `teacherAssignments`
- Create/grade homework for assigned subjects
- Mark attendance for assigned classrooms
- Post announcements to assigned classrooms

### 🧑‍🎓 Student

- View own homework submissions
- View own attendance records
- View own fee payments
- View classroom announcements

### 👨‍👩‍👧 Parent

- View child's data (via `students.parentId`)
- View child's attendance, homework, fees
- Receive notifications

---

This quick reference should help you navigate the database schema efficiently!
