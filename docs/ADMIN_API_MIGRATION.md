# Admin API Routes Migration to Server Actions

## Overview

This document outlines the migration of admin-related REST API routes to Next.js Server Actions with React Query integration.

## Migration Summary

### New Server Actions File

Created `actions/admin.ts` with the following Server Actions:

#### Teacher Management

1. **`getAllTeachers()`** - Get all teachers with their assignments
2. **`getTeacherById(teacherId)`** - Get single teacher details
3. **`createTeacher(data)`** - Create a new teacher
4. **`updateTeacher(teacherId, data)`** - Update teacher information
5. **`deleteTeacher(teacherId)`** - Delete a teacher
6. **`bulkUploadTeachers(teachers[])`** - Bulk upload teachers from CSV
7. **`getTeacherLeaveStats(teacherId)`** - Get teacher leave statistics

#### Work Done Management

1. **`getWorkDoneRecords(filters)`** - Get work done records with optional filtering

#### Teacher Leave Management

1. **`getAllTeacherLeaves()`** - Get all teacher leave requests (admin view)
2. **`updateTeacherLeaveStatus(leaveId, data)`** - Approve or reject teacher leave requests

### Migrated Pages

#### 1. `/admin/work-done/page.tsx`

- **Before**: `fetch("/api/work-done?${queryString}")`
- **After**: `getWorkDoneRecords(filterParams)`
- **Changes**:
  - Replaced fetch calls with Server Action
  - Updated filter building logic to use typed parameters
  - Maintained all UI functionality

#### 2. `/admin/teachers/page.tsx`

- **Queries Migrated**:
  - GET `/api/teachers` → `getAllTeachers()`
- **Mutations Migrated**:
  - POST `/api/teachers` → `createTeacher(data)`
  - PUT `/api/teachers/[id]` → `updateTeacher(teacherId, data)`
  - DELETE `/api/teachers/[id]` → `deleteTeacher(teacherId)`
  - POST `/api/teachers/bulk-upload` → `bulkUploadTeachers(teachers)`
- **Changes**:
  - Added toast notifications for all mutations
  - Transformed data to match local Teacher interface
  - Improved error handling

#### 3. `/admin/teachers/[id]/page.tsx`

- **Queries Migrated**:
  - GET `/api/teachers/[id]` → `getTeacherById(teacherId)`
  - GET `/api/teachers/[id]/leave-stats` → `getTeacherLeaveStats(teacherId)`
- **Changes**:
  - Removed local interfaces, using types from admin actions
  - Added null safety checks for teacherAssignments

#### 4. `/admin/substitutes/page.tsx`

- **Queries Migrated**:
  - GET `/api/teachers` → `getAllTeachers()`
- **Changes**:
  - Transformed teacher data to simple { id, name, email } format

#### 5. `/admin/timetable/page.tsx`

- **Queries Migrated**:
  - GET `/api/teachers` → `getAllTeachers()`
- **Changes**:
  - Transformed teacher data to simple { id, name } format

#### 6. `/admin/classrooms/[id]/edit/page.tsx`

- **Queries Migrated**:
  - GET `/api/teachers` → `getAllTeachers()`
- **Changes**:
  - Transformed teacher data to simple { id, name } format

#### 7. `/admin/leaves/page.tsx`

- **Queries Migrated**:
  - GET `/api/teacher-leaves` → `getAllTeacherLeaves()`
- **Mutations Migrated**:
  - PUT `/api/teacher-leaves/[id]` → `updateTeacherLeaveStatus(leaveId, data)`
- **Changes**:
  - Added proper error handling with toast notifications
  - Updated types to use AdminTeacherLeave interface
  - Improved type safety for status updates

## API Routes That Can Be Deprecated

The following API routes are now fully replaced by Server Actions and can be safely removed:

### Teacher Management Routes

- ✅ `app/api/teachers/route.ts` (GET, POST)
- ✅ `app/api/teachers/[id]/route.ts` (GET, PUT, DELETE)
- ✅ `app/api/teachers/bulk-upload/route.ts` (POST)
- ✅ `app/api/teachers/[id]/leave-stats/route.ts` (GET)

### Work Done Routes

- ✅ `app/api/work-done/route.ts` (GET, POST) - Admin panel only
  - ⚠️ **Note**: Verify if teacher panel uses POST endpoint before deleting

### Teacher Leave Routes

- ✅ `app/api/teacher-leaves/route.ts` (GET)
- ✅ `app/api/teacher-leaves/[id]/route.ts` (PUT)

## Type System Improvements

### Teacher Interface

```typescript
export interface Teacher {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  address: string | null;
  emailVerified: boolean;
  isActive: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  teacherAssignments?: {
    id: string;
    teacherId: string;
    classroomId: string;
    subjectId: string;
    isPrimary: boolean | null;
    classroom: {
      id: string;
      name: string;
      grade: string; // Stored as number in DB, converted to string
      section: string;
    };
    subject: {
      id: string;
      name: string;
      code: string;
    };
  }[];
}
```

### WorkDoneRecord Interface

```typescript
export interface WorkDoneRecord {
  id: string;
  classroomId: string;
  subjectId: string;
  teacherId: string;
  date: string;
  periodNumber: number;
  topicsCovered: string;
  homeworkAssigned: string | null;
  remarks: string | null;
  isSubstitute: boolean | null;
  substituteAssignmentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  teacherName: string | null;
  teacherEmail: string | null;
  classroomName: string | null;
  classroomGrade: number | null;
  classroomSection: string | null;
  subjectName: string | null;
  subjectCode: string | null;
}
```

### AdminTeacherLeave Interface

```typescript
export interface AdminTeacherLeave {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  approvedBy: string | null;
  approvalNotes: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

## Benefits of Migration

1. **Type Safety**: Full end-to-end TypeScript type checking
2. **Performance**: Reduced network overhead with direct database access
3. **Code Reusability**: Server Actions can be used across multiple pages
4. **Error Handling**: Centralized error handling in Server Actions
5. **Maintainability**: Single source of truth for business logic
6. **Developer Experience**: Better autocomplete and refactoring support

## Migration Pattern Used

```typescript
// Before (REST API)
const { data } = useQuery({
  queryKey: ["teachers"],
  queryFn: async () => {
    const response = await fetch("/api/teachers");
    if (!response.ok) throw new Error("Failed to fetch teachers");
    return response.json();
  },
});

// After (Server Actions)
const { data } = useQuery({
  queryKey: ["teachers"],
  queryFn: async () => {
    return await getAllTeachers();
  },
});

// Mutations with toast notifications
const mutation = useMutation({
  mutationFn: async (data) => {
    const result = await createTeacher(data);
    if (!result.success) {
      throw new Error(result.error || "Failed to create teacher");
    }
    return result;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["teachers"] });
    toast.success("Teacher created successfully");
  },
  onError: (error: Error) => {
    toast.error(error.message);
  },
});
```

## Testing Checklist

- [ ] Verify all teacher CRUD operations work
- [ ] Test bulk teacher upload functionality
- [ ] Verify work done filtering works correctly
- [ ] Test leave statistics display
- [ ] Verify substitute assignment teacher selection
- [ ] Test timetable teacher dropdown
- [ ] Verify classroom edit teacher assignments
- [ ] Test teacher leave approval/rejection workflow
- [ ] Verify leave filtering by status (pending, approved, rejected)
- [ ] Check error handling and toast notifications
- [ ] Verify data transformation is correct
- [ ] Test with empty states (no teachers, no assignments, no leaves, etc.)

## Next Steps

1. Test all migrated functionality thoroughly
2. Delete deprecated API routes after confirming no dependencies
3. Consider migrating remaining admin routes:
   - Student management
   - Classroom management
   - Attendance management
   - Exam management
   - Notification management

## Related Documentation

- [Teacher Panel Migration](./TEACHER_PANEL_MIGRATION.md)
- [Smartboard Server Actions](./SMARTBOARD_SERVER_ACTIONS.md)
- [Schema Reference](./SCHEMA_REFERENCE.md)
