# Attendance Management System Guide

## Overview

The Attendance Management System provides comprehensive functionality for tracking student attendance across classrooms. It supports marking attendance, viewing historical records, generating statistics, and creating summaries.

## Server Actions

All attendance operations are handled through server actions located in `/actions/attendance.ts`. These actions follow the repository pattern of returning `{ success, data?, error? }` for consistent error handling.

### Available Actions

#### 1. markAttendance
Mark attendance for students in a classroom.

**Signature:**
```typescript
markAttendance(
  records: Array<{
    studentId: string;
    classroomId: string;
    status: "present" | "absent" | "late" | "excused";
    date?: string | Date;
    remarks?: string;
  }>,
  markedBy: string
): Promise<{ success: boolean; data?: any; error?: string }>
```

**Features:**
- Bulk attendance marking for multiple students
- Automatic update of existing records if attendance already exists for the date
- Supports all attendance statuses: present, absent, late, excused
- Optional remarks for each record

**Example Usage:**
```typescript
import { markAttendance } from "@/actions/attendance";

const result = await markAttendance(
  [
    {
      studentId: "student-uuid-1",
      classroomId: "classroom-uuid",
      status: "present",
      date: new Date(),
    },
    {
      studentId: "student-uuid-2",
      classroomId: "classroom-uuid",
      status: "absent",
      remarks: "Sick leave",
    },
  ],
  userId
);

if (result.success) {
  console.log("Attendance marked successfully");
} else {
  console.error(result.error);
}
```

#### 2. getAttendanceByClassroom
Get attendance records for a specific classroom.

**Signature:**
```typescript
getAttendanceByClassroom(
  classroomId: string,
  startDate?: string | Date,
  endDate?: string | Date
): Promise<{ success: boolean; data?: AttendanceRecord[]; error?: string }>
```

**Example Usage:**
```typescript
import { getAttendanceByClassroom } from "@/actions/attendance";

const result = await getAttendanceByClassroom(
  "classroom-uuid",
  "2024-01-01",
  "2024-01-31"
);

if (result.success) {
  const records = result.data;
  // Display attendance records
}
```

#### 3. getAttendanceByStudent
Get attendance records for a specific student.

**Signature:**
```typescript
getAttendanceByStudent(
  studentId: string,
  startDate?: string | Date,
  endDate?: string | Date
): Promise<{ success: boolean; data?: AttendanceRecord[]; error?: string }>
```

**Example Usage:**
```typescript
import { getAttendanceByStudent } from "@/actions/attendance";

const result = await getAttendanceByStudent(
  "student-uuid",
  "2024-01-01",
  "2024-12-31"
);

if (result.success) {
  console.log(`Total records: ${result.data?.length}`);
}
```

#### 4. getAttendanceStats
Calculate attendance statistics for a classroom.

**Signature:**
```typescript
getAttendanceStats(
  classroomId: string,
  startDate?: string | Date,
  endDate?: string | Date
): Promise<{ success: boolean; data?: AttendanceStats; error?: string }>
```

**Returns:**
```typescript
interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}
```

**Example Usage:**
```typescript
import { getAttendanceStats } from "@/actions/attendance";

const result = await getAttendanceStats("classroom-uuid");

if (result.success && result.data) {
  const { present, total, percentage } = result.data;
  console.log(`Attendance: ${present}/${total} (${percentage.toFixed(2)}%)`);
}
```

#### 5. getClassroomAttendanceSummary
Get attendance summary for all students in a classroom.

**Signature:**
```typescript
getClassroomAttendanceSummary(
  classroomId: string,
  startDate?: string | Date,
  endDate?: string | Date
): Promise<{ success: boolean; data?: StudentAttendanceSummary[]; error?: string }>
```

**Returns:**
```typescript
interface StudentAttendanceSummary {
  studentId: string;
  studentName: string;
  rollNumber: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}
```

**Example Usage:**
```typescript
import { getClassroomAttendanceSummary } from "@/actions/attendance";

const result = await getClassroomAttendanceSummary(
  "classroom-uuid",
  "2024-01-01",
  "2024-03-31"
);

if (result.success && result.data) {
  result.data.forEach(student => {
    console.log(`${student.studentName}: ${student.percentage.toFixed(2)}%`);
  });
}
```

#### 6. getAttendanceForDate
Get attendance records for a specific date.

**Signature:**
```typescript
getAttendanceForDate(
  classroomId: string,
  date: string | Date
): Promise<{ success: boolean; data?: AttendanceRecord[]; error?: string }>
```

**Example Usage:**
```typescript
import { getAttendanceForDate } from "@/actions/attendance";

const result = await getAttendanceForDate(
  "classroom-uuid",
  new Date()
);

if (result.success && result.data) {
  console.log(`Today's attendance: ${result.data.length} records`);
}
```

#### 7. deleteAttendance
Delete an attendance record.

**Signature:**
```typescript
deleteAttendance(
  attendanceId: string
): Promise<{ success: boolean; error?: string }>
```

**Example Usage:**
```typescript
import { deleteAttendance } from "@/actions/attendance";

const result = await deleteAttendance("attendance-uuid");

if (result.success) {
  console.log("Attendance record deleted");
}
```

## Data Types

### AttendanceRecord
```typescript
interface AttendanceRecord {
  id: string;
  studentId: string;
  classroomId: string;
  date: Date;
  status: "present" | "absent" | "late" | "excused";
  remarks: string | null;
  markedBy: string;
  createdAt: Date | null;
  studentName: string | null;
  studentRollNumber: string | null;
}
```

### Attendance Statuses
- **present**: Student is present in class
- **absent**: Student is absent without excuse
- **late**: Student arrived late
- **excused**: Student is absent with valid excuse

## Usage in Pages

### Admin Attendance Page
The admin attendance page should use these server actions with React Query for optimal performance:

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  markAttendance,
  getAttendanceForDate,
  getAttendanceStats,
} from "@/actions/attendance";

export default function AttendancePage() {
  const queryClient = useQueryClient();
  
  // Fetch attendance records
  const { data: attendanceResult } = useQuery({
    queryKey: ["attendance", classroomId, date],
    queryFn: () => getAttendanceForDate(classroomId, date),
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: ({ records, markedBy }) => 
      markAttendance(records, markedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });

  // Handle form submission
  const handleSubmit = (records) => {
    markAttendanceMutation.mutate({
      records,
      markedBy: session.user.id,
    });
  };

  // Render UI...
}
```

### Teacher Portal
Teachers can mark attendance for their assigned classrooms:

```typescript
import { markAttendance } from "@/actions/attendance";

// In teacher portal, get assigned classrooms first
const handleMarkAttendance = async (students, classroomId) => {
  const records = students.map(student => ({
    studentId: student.id,
    classroomId,
    status: student.selectedStatus,
    date: selectedDate,
  }));

  const result = await markAttendance(records, teacherId);
  
  if (result.success) {
    toast.success("Attendance marked successfully");
  } else {
    toast.error(result.error);
  }
};
```

### Student Portal
Students can view their own attendance:

```typescript
import { getAttendanceByStudent } from "@/actions/attendance";

const { data: attendanceResult } = useQuery({
  queryKey: ["student-attendance", studentId],
  queryFn: () => getAttendanceByStudent(studentId),
});

if (attendanceResult?.success) {
  const records = attendanceResult.data;
  const presentCount = records.filter(r => r.status === "present").length;
  const percentage = (presentCount / records.length) * 100;
}
```

## Best Practices

1. **Batch Operations**: When marking attendance for multiple students, always use a single call to `markAttendance` with all records rather than multiple individual calls.

2. **Date Handling**: Always pass dates in ISO format or as Date objects. The server actions handle conversion automatically.

3. **Error Handling**: Always check the `success` field in the response before accessing `data`:
```typescript
const result = await markAttendance(records, userId);
if (result.success && result.data) {
  // Use result.data
} else {
  // Handle error: result.error
}
```

4. **Caching**: Use React Query's caching mechanisms to avoid unnecessary API calls:
```typescript
const { data } = useQuery({
  queryKey: ["attendance", classroomId, date],
  queryFn: () => getAttendanceForDate(classroomId, date),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

5. **Optimistic Updates**: For better UX, use optimistic updates when marking attendance:
```typescript
const mutation = useMutation({
  mutationFn: markAttendance,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ["attendance"] });
    const previousData = queryClient.getQueryData(["attendance"]);
    queryClient.setQueryData(["attendance"], newData);
    return { previousData };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(["attendance"], context.previousData);
  },
});
```

## Database Schema

The attendance system uses the following database table:

```sql
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES classrooms(id),
  date TIMESTAMP NOT NULL,
  status attendance_status NOT NULL, -- 'present', 'absent', 'late', 'excused'
  remarks TEXT,
  marked_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Role-Based Access

- **Admin**: Full access to all attendance functions across all classrooms
- **Teacher**: Can mark and view attendance for assigned classrooms only
- **Student**: Can view own attendance records only
- **Parent**: Can view their children's attendance records only

## Performance Considerations

1. **Date Range Queries**: When querying large date ranges, consider pagination:
```typescript
const { data } = useQuery({
  queryKey: ["attendance", classroomId, page],
  queryFn: () => getAttendanceByClassroom(classroomId, startDate, endDate),
});
```

2. **Bulk Operations**: The `markAttendance` function is optimized for bulk inserts and updates. Use it for marking entire classroom attendance at once.

3. **Indexing**: The database has indexes on:
   - `student_id`
   - `classroom_id`
   - `date`
   - Composite index on `(classroom_id, date)` for faster date-based queries

## Future Enhancements

Planned improvements for the attendance system:

1. **Automated Notifications**: Send notifications to parents when students are marked absent
2. **Attendance Reports**: Generate PDF reports with attendance statistics
3. **Integration with Calendar**: Link attendance to calendar events and holidays
4. **Biometric Integration**: Support for biometric attendance devices
5. **QR Code Attendance**: Allow students to mark attendance via QR code scanning
6. **Attendance Trends**: AI-powered insights on attendance patterns
7. **Export Functionality**: Export attendance data to CSV/Excel

## Troubleshooting

### Common Issues

**Issue**: Attendance not saving
- **Solution**: Check that the user has proper permissions and the `markedBy` field is valid

**Issue**: Duplicate attendance records
- **Solution**: The system automatically updates existing records for the same date. Ensure proper date comparison.

**Issue**: Incorrect statistics
- **Solution**: Verify the date range is correct and includes the expected records

## Related Documentation

- [Calendar System Guide](./CALENDAR_SYSTEM.md)
- [Notification System Guide](./NOTIFICATION_SYSTEM.md)
- [Teacher Portal Guide](./STUDENT_FEATURES_GUIDE.md)
- [Admin Dashboard Guide](./SETUP_COMPLETE.md)

## Support

For issues or questions about the Attendance Management System, please:
1. Check this documentation
2. Review the server action code in `/actions/attendance.ts`
3. Check the database schema in `/database/schema.ts`
4. Contact the development team

---

Last updated: 2024-11-09
