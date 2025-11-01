# New Features Documentation

This document describes the new features added to the School Management System.

## Table of Contents

- [Events & Calendar](#events--calendar)
- [Parent-Teacher Meetings](#parent-teacher-meetings)
- [Communication Hub](#communication-hub)
- [Admission Management](#admission-management)
- [Report Cards](#report-cards)
- [Behavior & Disciplinary Tracking](#behavior--disciplinary-tracking)

## Events & Calendar

### Overview

The Events & Calendar system allows schools to manage and track various school events like sports days, cultural programs, academic events, and more.

### Features

- Create and manage school events
- Event registration system
- Target audience filtering (grade-wise, section-wise, or school-wide)
- Maximum participant limits
- Registration deadlines
- Event status tracking (upcoming, ongoing, completed, cancelled)

### API Endpoints

#### List Events

```
GET /api/events?eventType=sports&status=upcoming&startDate=2024-01-01&endDate=2024-12-31&targetAudience=grade-6
```

#### Create Event (Admin/Teacher)

```
POST /api/events
{
  "title": "Annual Sports Day",
  "description": "School's annual sports competition",
  "eventType": "sports",
  "startDate": "2024-06-15T09:00:00Z",
  "endDate": "2024-06-15T17:00:00Z",
  "location": "School Ground",
  "organizer": "Sports Department",
  "targetAudience": ["all"],
  "maxParticipants": 500,
  "registrationDeadline": "2024-06-10T23:59:59Z",
  "allowRegistration": true
}
```

#### Get Event Details

```
GET /api/events/{eventId}
```

#### Register for Event

```
POST /api/events/{eventId}/register
{
  "studentId": "student-uuid",
  "notes": "Interested in 100m race"
}
```

#### Cancel Registration

```
DELETE /api/events/{eventId}/register
```

### Event Types

- `academic` - Academic events (exams, workshops)
- `sports` - Sports events
- `cultural` - Cultural programs
- `meeting` - Meetings and assemblies
- `holiday` - Holidays
- `other` - Other events

### Access Control

- **Admin**: Full CRUD access
- **Teacher**: Create and view events
- **Student**: View and register for events
- **Parent**: View events and register on behalf of students

---

## Parent-Teacher Meetings

### Overview

A scheduling system for parent-teacher meetings with time slot management.

### Features

- Teachers create available meeting slots
- Parents book slots for their children
- Automatic slot booking tracking
- Meeting status management
- Location and duration management

### API Endpoints

#### List Meeting Slots

```
GET /api/meetings?teacherId={teacherId}&date=2024-06-15&startDate=2024-06-01
```

#### Create Meeting Slot (Teacher)

```
POST /api/meetings
{
  "date": "2024-06-15",
  "startTime": "09:00",
  "endTime": "10:00",
  "duration": 15,
  "location": "Room 101",
  "maxBookings": 4
}
```

#### Book Meeting (Parent)

```
POST /api/meetings/{slotId}/book
{
  "studentId": "student-uuid",
  "purpose": "Discuss academic progress"
}
```

### Meeting Status

- `scheduled` - Meeting is scheduled
- `completed` - Meeting completed
- `cancelled` - Meeting cancelled
- `rescheduled` - Meeting rescheduled

### Access Control

- **Teacher**: Create and manage meeting slots
- **Parent**: View and book meeting slots
- **Admin**: Full access

---

## Communication Hub

### Overview

Centralized communication system for school-wide and group-specific messaging.

### Features

#### 1. Circulars

- Official school circulars with tracking
- Acknowledgment requirement option
- Target audience specification
- Expiry dates
- Attachment support

#### 2. Group Messages

- Class-wise or grade-wise messaging
- Priority levels
- Attachment support
- Read receipts

### API Endpoints

#### Circulars

##### List Circulars

```
GET /api/circulars?circularType=urgent&isPublished=true
```

##### Create Circular (Admin)

```
POST /api/circulars
{
  "title": "Mid-term Examination Schedule",
  "content": "The mid-term examinations will be held from...",
  "circularType": "academic",
  "circularNumber": "CIR/2024/001",
  "targetAudience": ["all"],
  "requiresAcknowledgment": true,
  "expiresAt": "2024-06-30T23:59:59Z",
  "isPublished": true
}
```

##### Acknowledge Circular

```
POST /api/circulars/{circularId}
{
  "notes": "Acknowledged and understood"
}
```

#### Group Messages

##### Send Group Message (Admin/Teacher)

```
POST /api/group-messages
{
  "subject": "Homework Assignment",
  "content": "Please complete the math homework...",
  "targetGroups": ["grade-6-A", "grade-6-B"],
  "priority": "normal"
}
```

##### List Group Messages

```
GET /api/group-messages?targetGroup=grade-6-A
```

### Circular Types

- `general` - General information
- `urgent` - Urgent notifications
- `academic` - Academic related
- `administrative` - Administrative matters
- `event` - Event related

### Access Control

- **Admin**: Full access to all features
- **Teacher**: Send group messages, view circulars
- **Parent**: View circulars, acknowledge when required
- **Student**: View circulars relevant to them

---

## Admission Management

### Overview

Complete admission workflow from application to enrollment.

### Features

- Online admission applications
- Document upload and verification
- Entrance test management
- Application status tracking
- Interview scheduling

### API Endpoints

#### Submit Application

```
POST /api/admissions
{
  "studentName": "John Doe",
  "dateOfBirth": "2010-05-15",
  "gender": "male",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "guardianName": "Jane Doe",
  "guardianRelation": "mother",
  "guardianPhone": "+1234567891",
  "guardianEmail": "jane@example.com",
  "previousSchool": "ABC School",
  "gradeAppliedFor": "6",
  "academicYear": "2024-2025"
}
```

#### List Applications (Admin)

```
GET /api/admissions?status=pending&grade=6
```

#### Update Application Status (Admin)

```
PUT /api/admissions/{applicationId}
{
  "status": "test_scheduled",
  "entranceTestId": "test-uuid",
  "interviewDate": "2024-06-20T10:00:00Z"
}
```

#### Upload Document

```
POST /api/admissions/{applicationId}/documents
{
  "documentType": "birth_certificate",
  "documentName": "Birth Certificate.pdf",
  "fileUrl": "https://..."
}
```

#### Verify Document (Admin)

```
PUT /api/admissions/{applicationId}/documents
{
  "documentId": "doc-uuid",
  "status": "verified"
}
```

#### Create Entrance Test (Admin)

```
POST /api/entrance-tests
{
  "testName": "Grade 6 Entrance Test",
  "grade": "6",
  "testDate": "2024-06-25T09:00:00Z",
  "duration": 120,
  "totalMarks": 100,
  "passingMarks": 40,
  "venue": "Exam Hall 1",
  "instructions": "Bring your hall ticket...",
  "syllabus": "Mathematics, English, Science"
}
```

### Admission Status Workflow

1. `pending` - Application submitted
2. `under_review` - Application being reviewed
3. `test_scheduled` - Entrance test scheduled
4. `test_completed` - Test completed
5. `accepted` - Application accepted
6. `rejected` - Application rejected
7. `waitlisted` - On waiting list

### Document Types

- `birth_certificate`
- `transfer_certificate`
- `mark_sheets`
- `photo`
- `address_proof`
- `other`

### Access Control

- **Admin**: Full access to all applications
- **Public**: Submit applications and upload documents

---

## Report Cards

### Overview

Automated report card generation with GPA calculation and performance tracking.

### Features

- Automated report card generation
- GPA and percentage calculation
- Rank assignment
- Attendance tracking
- Teacher and principal remarks
- Promotion status
- PDF generation support

### API Endpoints

#### Generate Report Card (Admin/Teacher)

```
POST /api/report-cards
{
  "studentId": "student-uuid",
  "classroomId": "classroom-uuid",
  "academicYear": "2024-2025",
  "term": "Term 1",
  "totalMarks": 500,
  "marksObtained": 425,
  "percentage": 85.0,
  "gpa": 3.8,
  "grade": "A",
  "rank": 3,
  "attendance": 95.5,
  "teacherRemarks": "Excellent performance",
  "principalRemarks": "Keep up the good work",
  "promotionStatus": "promoted"
}
```

#### List Report Cards

```
GET /api/report-cards?studentId={studentId}&academicYear=2024-2025&term=Term%201
```

### Grade Scale

- A+ : 90-100
- A : 80-89
- B+ : 70-79
- B : 60-69
- C : 50-59
- D : 40-49
- F : Below 40

### Access Control

- **Admin**: Full access
- **Teacher**: Create and view report cards for their students
- **Student**: View own report cards
- **Parent**: View child's report cards

---

## Behavior & Disciplinary Tracking

### Overview

Comprehensive system for tracking student behavior, incidents, and disciplinary actions.

### Features

#### 1. Behavior Incidents

- Incident reporting with severity levels
- Witness documentation
- Parent notification tracking
- Follow-up management

#### 2. Disciplinary Actions

- Multiple action types
- Duration tracking
- Status monitoring
- Notes and documentation

#### 3. Merit/Demerit Points

- Point-based reward/penalty system
- Category-wise tracking
- Historical records
- Incident linkage

#### 4. Behavior Notes

- Positive and negative observations
- Progress tracking
- Privacy controls
- Teacher annotations

### API Endpoints

#### Report Incident (Teacher/Admin)

```
POST /api/behavior/incidents
{
  "studentId": "student-uuid",
  "incidentDate": "2024-06-15T14:30:00Z",
  "incidentType": "fighting",
  "severity": "moderate",
  "location": "Playground",
  "description": "Altercation during recess",
  "witnessNames": "Teacher A, Student B",
  "actionTaken": "Counseling session scheduled",
  "parentNotified": true,
  "followUpRequired": true
}
```

#### List Incidents

```
GET /api/behavior/incidents?studentId={studentId}&severity=moderate
```

#### Create Disciplinary Action (Teacher/Admin)

```
POST /api/behavior/actions
{
  "incidentId": "incident-uuid",
  "studentId": "student-uuid",
  "actionType": "detention",
  "description": "After school detention for 1 week",
  "startDate": "2024-06-16T15:30:00Z",
  "endDate": "2024-06-20T16:30:00Z"
}
```

#### Award Points (Teacher/Admin)

```
POST /api/behavior/points
{
  "studentId": "student-uuid",
  "pointType": "merit",
  "points": 10,
  "reason": "Excellent class participation",
  "category": "academics"
}
```

#### Add Behavior Note (Teacher/Admin)

```
POST /api/behavior/notes
{
  "studentId": "student-uuid",
  "noteType": "praise",
  "content": "Showed leadership qualities during group project",
  "isPrivate": false
}
```

### Incident Severity Levels

- `minor` - Small infractions
- `moderate` - Medium severity
- `major` - Serious violations
- `critical` - Very serious incidents

### Action Types

- `warning` - Verbal/written warning
- `detention` - After-school detention
- `suspension` - Temporary suspension
- `counseling` - Counseling session
- `parent_meeting` - Meeting with parents
- `other` - Other actions

### Point Categories

- `academics` - Academic performance
- `sports` - Sports and physical activities
- `discipline` - Discipline and conduct
- `behavior` - General behavior
- `leadership` - Leadership qualities
- `community_service` - Community service

### Note Types

- `observation` - General observation
- `concern` - Area of concern
- `praise` - Positive feedback
- `progress` - Progress update

### Access Control

- **Admin**: Full access to all features
- **Teacher**: Create incidents, actions, award points, add notes
- **Student**: View own non-private records
- **Parent**: View child's non-private records

---

## Role-Based Access Summary

| Feature               | Admin | Teacher | Student | Parent  |
| --------------------- | ----- | ------- | ------- | ------- |
| Events (Create)       | ✓     | ✓       | ✗       | ✗       |
| Events (Register)     | ✓     | ✓       | ✓       | ✓       |
| Meetings (Create)     | ✓     | ✓       | ✗       | ✗       |
| Meetings (Book)       | ✓     | ✗       | ✗       | ✓       |
| Circulars (Create)    | ✓     | ✗       | ✗       | ✗       |
| Group Messages (Send) | ✓     | ✓       | ✗       | ✗       |
| Admissions (Manage)   | ✓     | ✗       | ✗       | ✗       |
| Report Cards (Create) | ✓     | ✓       | ✗       | ✗       |
| Report Cards (View)   | ✓     | ✓       | Own     | Child's |
| Behavior (Report)     | ✓     | ✓       | ✗       | ✗       |
| Behavior (View)       | ✓     | ✓       | Own     | Child's |

---

## Technical Notes

### Authentication

All endpoints require authentication using Better Auth. Include the session token in the request headers.

### Authorization

Role-based access control is enforced at the API level. Unauthorized access attempts will return a 401 status code.

### Data Formats

- Dates: ISO 8601 format (e.g., "2024-06-15T09:00:00Z")
- JSON Arrays: Stored as JSON strings in TEXT fields
- File URLs: Store external file references

### Performance Considerations

- Use COUNT queries for counting records
- Apply filters at database level
- Implement pagination for large datasets
- Use proper indexes on foreign keys

### Error Handling

All endpoints return standard HTTP status codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error

---

## Future Enhancements

### Planned Features

- PDF generation for report cards and transcripts
- Real-time notifications for events and messages
- Mobile app integration
- Analytics dashboard for behavior trends
- Email notifications for circulars
- SMS integration for urgent notifications
- Document storage integration
- Advanced search and filtering
- Export functionality for reports

---

## Migration Guide

To apply the new schema changes:

```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:push
```

---

## Support

For questions or issues related to these features, please refer to the main project documentation or contact the development team.
