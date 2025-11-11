# Deletable API Routes After Server Actions Migration

This document lists all API routes that can be safely deleted after the migration to Next.js Server Actions.

## ✅ Safe to Delete Immediately

These routes have been fully replaced by Server Actions and are not used by any other parts of the application:

### Teacher Management

```
app/api/teachers/route.ts
app/api/teachers/[id]/route.ts
app/api/teachers/bulk-upload/route.ts
app/api/teachers/[id]/leave-stats/route.ts
app/api/teachers/[id]/analytics/route.ts (if exists)
app/api/teachers/classrooms/route.ts (if exists)
```

**Replaced By:**

- `getAllTeachers()` - actions/admin.ts
- `getTeacherById(id)` - actions/admin.ts
- `createTeacher(data)` - actions/admin.ts
- `updateTeacher(id, data)` - actions/admin.ts
- `deleteTeacher(id)` - actions/admin.ts
- `bulkUploadTeachers(teachers)` - actions/admin.ts
- `getTeacherLeaveStats(id)` - actions/admin.ts
- `getTeacherAssignments(id)` - actions/teacher.ts
- `getTeacherAnalytics(id)` - actions/teacher.ts

### Teacher Leaves

```
app/api/teacher-leaves/route.ts
app/api/teacher-leaves/[id]/route.ts
```

**Replaced By:**

- `getTeacherLeaves(teacherId)` - actions/teacher.ts
- `createTeacherLeave(data)` - actions/teacher.ts
- `cancelTeacherLeave(leaveId)` - actions/teacher.ts

### Substitute Assignments

```
app/api/substitute-assignments/route.ts (DELETED)
app/api/substitute-assignments/[id]/route.ts (DELETED)
app/api/substitute-assignments/unassigned/route.ts (DELETED)
```

**Replaced By:**

- `getUnassignedPeriods(date)` - actions/admin.ts
- `getSubstituteAssignmentsByDate(date)` - actions/admin.ts
- `createSubstituteAssignment(data)` - actions/admin.ts
- `deleteSubstituteAssignment(assignmentId)` - actions/admin.ts
- `getSubstituteAssignments(teacherId)` - actions/teacher.ts (teacher panel)

### Classroom Messages

```
app/api/classroom-messages/route.ts
```

**Replaced By:**

- `getClassroomMessages(classroomId)` - actions/teacher.ts
- `createClassroomMessage(data)` - actions/teacher.ts

### Homework (Teacher Panel Only)

```
app/api/homework/route.ts (GET by teacher)
app/api/homework/submissions/route.ts (GET, POST)
app/api/homework/submissions/[id]/route.ts (PUT, DELETE)
```

**Replaced By:**

- `getTeacherHomework(teacherId)` - actions/teacher.ts
- `createHomework(data)` - actions/teacher.ts
- `getHomeworkSubmissions(homeworkId)` - actions/teacher.ts
- `gradeHomeworkSubmission(data)` - actions/teacher.ts
- `createHomeworkSubmission(data)` - actions/teacher.ts
- `deleteHomeworkSubmission(id)` - actions/teacher.ts

**⚠️ Note:** Student panel uses Server Actions for homework (`getStudentHomework()` in actions/student.ts).

### Student-Specific Routes

```
app/api/students/grades/route.ts (DELETED)
app/api/students/analytics/route.ts (DELETED)
```

**Replaced By:**

- `getStudentGrades(userId, filters)` - actions/student.ts
- `getStudentAnalytics(userId)` - actions/student.ts

**✅ Status:** Migrated and deleted successfully.

## ⚠️ Review Before Deleting

These routes may be shared across multiple user roles. Review usage before deletion:

### Work Done

```
app/api/work-done/route.ts
```

**Used By:**

- Admin panel (migrated to `getWorkDoneRecords()`)
- Teacher panel (uses `getWorkDoneByTeacher()` and `createWorkDone()`)

**Action:** Safe to delete if both admin and teacher panels are migrated.

**Replaced By:**

- `getWorkDoneRecords(filters)` - actions/admin.ts (admin)
- `getWorkDoneByTeacher(teacherId)` - actions/teacher.ts (teacher)
- `getWorkDoneByClassroom(classroomId)` - actions/teacher.ts (teacher)
- `createWorkDone(data)` - actions/teacher.ts (teacher)

### Messages

```
app/api/messages/route.ts
app/api/messages/[id]/route.ts
```

**Status:** Not yet migrated. May be used by admin, teacher, student, or parent panels.

**Action:** Audit usage across all panels before migration.

### Students

```
app/api/students/route.ts
```

**Used By:**

- Admin panel (CRUD operations)
- Teacher panel (GET by classroom - migrated to `getClassroomStudents()`)

**Action:** Review admin student management before deletion. Teacher panel usage is migrated.

**Partial Replacement:**

- `getClassroomStudents(classroomId)` - actions/teacher.ts (teacher panel only)

## Migration Verification Commands

Run these commands to verify no references remain:

```powershell
# Search for teacher API references
grep -r "fetch.*\/api\/teachers" app/

# Search for work-done API references
grep -r "fetch.*\/api\/work-done" app/

# Search for teacher-leaves API references
grep -r "fetch.*\/api\/teacher-leaves" app/

# Search for substitute-assignments API references
grep -r "fetch.*\/api\/substitute-assignments" app/

# Search for classroom-messages API references
grep -r "fetch.*\/api\/classroom-messages" app/

# Search for homework API references
grep -r "fetch.*\/api\/homework" app/
```

## Deletion Steps

1. **Backup**: Commit all changes and create a backup branch

   ```bash
   git checkout -b backup/pre-api-deletion
   git push origin backup/pre-api-deletion
   git checkout master
   ```

2. **Verify**: Run grep searches to confirm no usage

   ```powershell
   # Run verification commands above
   ```

3. **Delete**: Remove the API route files

   ```powershell
   # Already deleted
   # - app/api/teachers (deleted)
   # - app/api/teacher-leaves (deleted)
   # - app/api/substitute-assignments (deleted)

   # Additional safe deletions if needed
   Remove-Item -Recurse -Force app/api/classroom-messages
   ```

4. **Test**: Run the application and test all functionality

   ```bash
   npm run dev
   ```

5. **Verify Build**: Ensure production build succeeds

   ```bash
   npm run build
   ```

6. **Deploy**: After verification, commit and deploy
   ```bash
   git add .
   git commit -m "Remove deprecated API routes after Server Actions migration"
   git push origin master
   ```

## Estimated Impact

- **Files Deleted**: ~15-20 route files
- **Lines of Code Removed**: ~1,500-2,000 LOC
- **Bundle Size Reduction**: Minimal (routes are server-side only)
- **Maintenance Burden**: Significantly reduced (centralized in Server Actions)

## Rollback Plan

If issues arise after deletion:

1. **Immediate Rollback**:

   ```bash
   git revert HEAD
   git push origin master
   ```

2. **Restore from Backup**:
   ```bash
   git checkout backup/pre-api-deletion -- app/api/teachers
   git checkout backup/pre-api-deletion -- app/api/teacher-leaves
   git checkout backup/pre-api-deletion -- app/api/substitute-assignments
   git checkout backup/pre-api-deletion -- app/api/classroom-messages
   git commit -m "Restore API routes"
   ```

## Related Documentation

- [Admin API Migration](./ADMIN_API_MIGRATION.md)
- [Teacher Panel Migration](./TEACHER_PANEL_MIGRATION.md)
- [Smartboard Server Actions](./SMARTBOARD_SERVER_ACTIONS.md)

## Status Tracking

- [x] Teacher management routes - Migrated & Deleted
- [x] Teacher leaves routes - Migrated & Deleted
- [x] Substitute assignments routes - Migrated & Deleted
- [x] Classroom messages routes - Migrated
- [x] Homework routes (teacher panel) - Migrated
- [x] Work done routes (admin panel) - Migrated
- [x] Work done routes (teacher panel) - Already migrated in previous work
- [x] Student grades route - Migrated & Deleted
- [x] Student analytics route - Migrated & Deleted
- [ ] Messages routes - Pending review
- [ ] Students routes (admin CRUD) - Used by admin panel, not migrated yet

## Recent Updates

**December 2024 - Student API Migration**

- ✅ Migrated `app/student/page.tsx` to use Server Actions
- ✅ Migrated `app/student/grades/page.tsx` to use `getStudentGrades()`
- ✅ Migrated `app/student/analytics/page.tsx` to use `getStudentAnalytics()`
- ✅ Deleted `app/api/students/grades/route.ts`
- ✅ Deleted `app/api/students/analytics/route.ts`
- ✅ Created `actions/student.ts` with 9 Server Actions
- ℹ️ Other `/api/students/*` routes preserved for admin panel usage

See [STUDENT_API_MIGRATION.md](./STUDENT_API_MIGRATION.md) for complete details.
