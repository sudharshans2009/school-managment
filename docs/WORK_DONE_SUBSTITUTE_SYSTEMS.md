# Work Done and Substitute Management Systems

This document describes the implementation of two interconnected systems for the Amrita Vidyalayam, Ettimadai platform.

## Overview

### 1. Work Done System

Tracks what was taught in each period, homework assigned, and provides visibility to teachers, students, and administrators.

### 2. Substitute Management System

Manages teacher leave requests, automatically detects periods needing substitutes, and facilitates substitute teacher assignments.

## Database Schema

### New Tables

#### `teacherLeaves`

Stores teacher leave requests with approval workflow.

| Field         | Type        | Description                                           |
| ------------- | ----------- | ----------------------------------------------------- |
| id            | UUID        | Primary key                                           |
| teacherId     | UUID        | Foreign key to users table                            |
| leaveType     | ENUM        | Type of leave (sick, casual, earned, duty, emergency) |
| startDate     | VARCHAR(10) | Start date in YYYY-MM-DD format                       |
| endDate       | VARCHAR(10) | End date in YYYY-MM-DD format                         |
| reason        | TEXT        | Reason for leave                                      |
| status        | ENUM        | Status (pending, approved, rejected, cancelled)       |
| approvedBy    | UUID        | Admin who approved/rejected                           |
| approvalNotes | TEXT        | Notes from admin                                      |
| approvedAt    | TIMESTAMP   | When approved/rejected                                |
| createdAt     | TIMESTAMP   | When created                                          |
| updatedAt     | TIMESTAMP   | Last updated                                          |

#### `substituteAssignments`

Links substitute teachers to periods affected by leaves.

| Field               | Type        | Description                      |
| ------------------- | ----------- | -------------------------------- |
| id                  | UUID        | Primary key                      |
| leaveId             | UUID        | Related leave request (optional) |
| originalTeacherId   | UUID        | Teacher who is absent            |
| substituteTeacherId | UUID        | Substitute teacher assigned      |
| classroomId         | UUID        | Affected classroom               |
| subjectId           | UUID        | Subject to teach                 |
| date                | VARCHAR(10) | Date in YYYY-MM-DD format        |
| periodNumber        | INTEGER     | Period number (1-9)              |
| startTime           | VARCHAR(10) | Start time HH:MM                 |
| endTime             | VARCHAR(10) | End time HH:MM                   |
| reason              | TEXT        | Reason for substitution          |
| assignedBy          | UUID        | Admin who assigned               |
| createdAt           | TIMESTAMP   | When created                     |
| updatedAt           | TIMESTAMP   | Last updated                     |

#### `workDone`

Records what was taught in each period.

| Field                  | Type        | Description                     |
| ---------------------- | ----------- | ------------------------------- |
| id                     | UUID        | Primary key                     |
| classroomId            | UUID        | Classroom                       |
| subjectId              | UUID        | Subject                         |
| teacherId              | UUID        | Teacher (regular or substitute) |
| date                   | VARCHAR(10) | Date in YYYY-MM-DD format       |
| periodNumber           | INTEGER     | Period number (1-9)             |
| topicsCovered          | TEXT        | Topics covered (required)       |
| homeworkAssigned       | TEXT        | Homework assigned (optional)    |
| remarks                | TEXT        | Additional remarks (optional)   |
| isSubstitute           | BOOLEAN     | Whether taught by substitute    |
| substituteAssignmentId | UUID        | Link to substitute assignment   |
| createdAt              | TIMESTAMP   | When created                    |
| updatedAt              | TIMESTAMP   | Last updated                    |

## API Endpoints

### Teacher Leaves API

#### `GET /api/teacher-leaves`

Fetch leave requests with optional filters.

**Query Parameters:**

- `teacherId` - Filter by teacher
- `status` - Filter by status (pending, approved, rejected, cancelled)
- `startDate` - Filter by start date
- `endDate` - Filter by end date

**Response:** Array of leave requests with teacher information

#### `POST /api/teacher-leaves`

Create a new leave request.

**Request Body:**

```json
{
  "teacherId": "uuid",
  "leaveType": "casual|sick|earned|duty|emergency",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "reason": "text"
}
```

#### `GET /api/teacher-leaves/[id]`

Get a single leave request by ID.

#### `PUT /api/teacher-leaves/[id]`

Update leave request (approve/reject/cancel).

**Request Body:**

```json
{
  "status": "approved|rejected|cancelled",
  "approvedBy": "uuid",
  "approvalNotes": "text"
}
```

#### `DELETE /api/teacher-leaves/[id]`

Delete a pending leave request.

### Substitute Assignments API

#### `GET /api/substitute-assignments`

Fetch substitute assignments with optional filters.

**Query Parameters:**

- `date` - Filter by date
- `teacherId` - Filter by original or substitute teacher
- `classroomId` - Filter by classroom
- `substituteTeacherId` - Filter by substitute teacher

#### `POST /api/substitute-assignments`

Create a substitute assignment.

**Request Body:**

```json
{
  "leaveId": "uuid (optional)",
  "originalTeacherId": "uuid",
  "substituteTeacherId": "uuid",
  "classroomId": "uuid",
  "subjectId": "uuid",
  "date": "YYYY-MM-DD",
  "periodNumber": 1-9,
  "startTime": "HH:MM",
  "endTime": "HH:MM",
  "reason": "text (optional)",
  "assignedBy": "uuid"
}
```

#### `GET /api/substitute-assignments/[id]`

Get a single assignment by ID.

#### `PUT /api/substitute-assignments/[id]`

Update a substitute assignment.

#### `DELETE /api/substitute-assignments/[id]`

Delete a substitute assignment.

#### `GET /api/substitute-assignments/unassigned`

Get periods needing substitutes based on approved leaves.

**Query Parameters:**

- `date` - Date to check (defaults to today)

**Response:** Array of periods without teachers that need substitutes

### Work Done API

#### `GET /api/work-done`

Fetch work done records with optional filters.

**Query Parameters:**

- `classroomId` - Filter by classroom
- `subjectId` - Filter by subject
- `teacherId` - Filter by teacher
- `date` - Filter by specific date
- `startDate` - Filter by start date range
- `endDate` - Filter by end date range
- `isSubstitute` - Filter substitute-only (true/false)

#### `POST /api/work-done`

Create a work done record.

**Request Body:**

```json
{
  "classroomId": "uuid",
  "subjectId": "uuid",
  "teacherId": "uuid",
  "date": "YYYY-MM-DD",
  "periodNumber": 1-9,
  "topicsCovered": "text",
  "homeworkAssigned": "text (optional)",
  "remarks": "text (optional)",
  "isSubstitute": false,
  "substituteAssignmentId": "uuid (optional)"
}
```

#### `GET /api/work-done/[id]`

Get a single work done record by ID.

#### `PUT /api/work-done/[id]`

Update a work done record.

**Request Body:**

```json
{
  "topicsCovered": "text (optional)",
  "homeworkAssigned": "text (optional)",
  "remarks": "text (optional)"
}
```

#### `DELETE /api/work-done/[id]`

Delete a work done record.

## User Interfaces

### Teacher Portal

#### My Leaves Tab

- View all leave requests with status badges
- "Request Leave" button opens dialog form
- Leave form fields:
  - Leave Type dropdown
  - Start Date & End Date pickers
  - Reason textarea
- Cancel pending leave requests
- View leave history with approval notes

#### Substitute Duties Tab

- View upcoming substitute assignments
- Shows date, period, classroom, subject
- Displays original teacher name and reason
- Indicates completed periods

#### Work Done Tab

- "Record Work Done" button opens dialog
- Work done form fields:
  - Class dropdown
  - Subject dropdown
  - Date picker
  - Period number selector
  - Topics Covered textarea (required)
  - Homework Assigned textarea (optional)
  - Remarks textarea (optional)
- View past work done records
- Filter and search capabilities

### Admin Portal

#### Leaves Management (`/admin/leaves`)

- Stats cards showing pending, approved, and rejected counts
- Tabs: Pending, Approved, Rejected, All
- Each leave request card shows:
  - Teacher name, leave type, dates
  - Reason for leave
  - Approve/Reject buttons (for pending)
  - Approval notes input
- Approval dialog with notes field

#### Substitutes Management (`/admin/substitutes`)

- Date selector for viewing/managing substitutes
- Stats cards showing unassigned and assigned counts
- Two sections:
  1. **Periods Needing Substitutes**
     - Auto-detects from approved leaves
     - Shows period details
     - "Assign Substitute" button per period
  2. **Assigned Substitutes**
     - Lists all assignments for selected date
     - Edit/Delete options
- Assignment dialog with teacher selection

#### Work Done Records (`/admin/work-done`)

- Comprehensive filters:
  - Date range picker
  - Classroom dropdown
  - Subject dropdown
  - Show substitute records only toggle
- View all work done records across school
- Records displayed in card format
- Export placeholder (future enhancement)

#### Admin Dashboard Updates

- New quick action cards:
  - "Manage Leaves"
  - "Manage Substitutes"
  - "View Work Done"

### Student Portal

#### Work Done Tab

- View work done records for student's classroom
- Grouped by date and subject
- Shows:
  - Subject, teacher name
  - Topics covered
  - Homework assigned
  - Substitute indicator badge
- Filter by date range and subject

## Features

### Auto-Detection of Missing Teachers

The system automatically identifies periods needing substitutes:

1. Checks approved leaves for the selected date
2. Finds timetable periods taught by absent teachers
3. Excludes periods that already have substitutes assigned
4. Displays in admin "Periods Needing Substitutes" view

### Role-Based Access Control

- **Teachers**: Request leave, view own leaves, mark work done, view own substitute assignments
- **Admins**: Approve/reject leaves, assign substitutes, view all work done records
- **Students**: View work done records for their classroom (read-only)

### Validation & Error Handling

- All forms include client-side validation
- API routes validate required fields
- Proper error messages via toast notifications
- Date validation (start date cannot be after end date)
- Permission checks at API level

### UI/UX Design

- Minimalist design following ShadCN patterns
- Responsive layouts for all screen sizes
- Status badges with color coding
- Loading states with spinners
- Empty states with helpful messages
- Dialog modals for forms
- Toast notifications for feedback

## Migration Steps

1. **Update Database Schema**

   ```bash
   bun run db:push
   ```

   This applies the new tables and enums to the database.

2. **Seed Sample Data (Optional)**

   ```bash
   bun run db:seed
   ```

   Add sample leave requests, substitutes, and work done records.

3. **Verify Permissions**
   Ensure user roles are correctly set in the database for testing.

## Testing Checklist

- [ ] Teacher can request leave and view status
- [ ] Admin can approve/reject leave with notes
- [ ] System identifies periods needing substitutes based on approved leaves
- [ ] Admin can assign substitute teachers to periods
- [ ] Substitute teachers see assignments in their dashboard
- [ ] Teachers (including substitutes) can record work done after periods
- [ ] Work done records display correctly in teacher portal
- [ ] Work done records display correctly in admin portal
- [ ] Students can view work done history for their classroom
- [ ] Proper error handling and validation on all forms
- [ ] Role-based access control enforced at API level

## Future Enhancements

### Notifications

- Notify teachers when leave is approved/rejected
- Notify substitute teachers when assigned
- Notify admins of new leave requests
- Email/SMS integration

### Duty Roster

- Extend to handle non-leave duty assignments
- Rotating duty schedules
- Duty swap requests

### Reports & Analytics

- Leave pattern analysis
- Substitute utilization reports
- Work done coverage statistics
- Export to CSV/PDF

### Mobile App

- React Native or Progressive Web App
- Push notifications
- Offline support

## Technical Notes

- All dates stored in YYYY-MM-DD format for consistency
- Period numbers range from 1-9 for the school's 9-period system
- Leave overlap handling implemented
- Audit trail maintained via createdAt/updatedAt fields
- Foreign key constraints ensure data integrity
- Cascading deletes configured appropriately

## Security Considerations

- ✅ No security vulnerabilities detected by CodeQL
- ✅ Input validation on all API routes
- ✅ Role-based authorization checks
- ✅ No sensitive data exposed in responses
- ✅ SQL injection prevented via parameterized queries (Drizzle ORM)
- ✅ XSS prevention via React's automatic escaping

## Support

For questions or issues, please contact the development team or refer to the main project documentation.
