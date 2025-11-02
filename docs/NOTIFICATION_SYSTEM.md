# Notification System & Event Management Implementation

## Overview

This document describes the comprehensive notification system and event management features integrated into the school management system.

## 1. Database Schema Changes

### New Tables

#### Notifications Table
```typescript
notifications: {
  id: uuid (PK)
  type: enum (homework_assigned, homework_graded, exam_scheduled, etc.)
  title: varchar(255)
  message: text
  recipientId: uuid (FK -> users.id)
  senderId: uuid (FK -> users.id)
  relatedId: uuid (generic reference)
  relatedType: varchar(50) (homework, exam, announcement, leave, event)
  priority: enum (low, normal, high, urgent)
  isRead: boolean
  actionUrl: varchar(500)
  metadata: text (JSON)
  createdAt: timestamp
  readAt: timestamp
}
```

### Schema Updates

#### Announcements Table
- Added `eventId` field to link announcements to events
- Allows announcements to reference specific calendar events

## 2. Notification Types

### For Admins
- `leave_requested` - When a teacher requests leave
- `substitute_assigned` - When a substitute is assigned
- `event_created` - When new events are created
- `announcement_posted` - School-wide announcements

### For Teachers
- `leave_approved` - When leave request is approved
- `leave_rejected` - When leave request is rejected
- `substitute_assigned` - When assigned as substitute
- `announcement_posted` - School-wide and class announcements (for class teachers)
- `homework_assigned` - When admin assigns homework (if applicable)

### For Students
- `homework_assigned` - New homework assignments
- `homework_graded` - Homework submissions graded
- `exam_scheduled` - New exams scheduled
- `exam_graded` - Exam results published
- `announcement_posted` - Class and school-wide announcements
- `attendance_marked` - Daily attendance notifications (optional)

### For Smartboards
- Display real-time notifications in classroom displays
- Auto-refresh every minute
- Show:
  - Class announcements
  - School-wide announcements
  - Recent homework
  - Daily quotes/messages

## 3. API Endpoints

### `/api/notifications` (User Notifications)
- **GET** - Fetch user's notifications
  - Query params: `unreadOnly=true`, `countOnly=true`
- **PATCH** - Mark notification(s) as read
  - Body: `{ notificationId: string }` or `{ markAll: true }`
- **DELETE** - Delete a notification
  - Query param: `id=notificationId`

### `/api/smartboard/[classroomId]/notifications` (Smartboard)
- **GET** - Fetch classroom-specific notifications
  - Returns: announcements, homework, messages from last 24 hours
  - Auto-refreshes every 60 seconds

### `/api/events` (Event Management)
- **GET** - Fetch all events with filters
- **POST** - Create new event (admin only)
  - Automatically creates calendar entries
  - Notifies all admins and teachers
  - Links events to calendar days

### `/api/announcements` (Enhanced)
- **POST** - Create announcement
  - Optional `eventId` to link to events
  - Automatically notifies:
    - Students in classroom (if class announcement)
    - All staff (if school-wide)
    - Class teacher (if class announcement)

### `/api/homework` (Enhanced)
- **POST** - Create homework
  - Automatically notifies all students in classroom
  - Includes subject name and due date

### `/api/teacher-leaves` (Enhanced)
- **POST** - Create leave request
  - Automatically notifies all admins
  - High priority notification

### `/api/teacher-leaves/[id]` (Enhanced)
- **PUT** - Approve/Reject leave
  - Automatically notifies teacher of decision
  - Includes approval notes if provided

## 4. Server Actions

### `/lib/actions/notifications.ts`

#### Core Functions
```typescript
createNotification(input: CreateNotificationInput)
createBulkNotifications(input: CreateBulkNotificationInput)
getNotifications(userId: string, unreadOnly?: boolean)
getUnreadCount(userId: string)
markAsRead(notificationId: string)
markAllAsRead(userId: string)
deleteNotification(notificationId: string)
```

#### Helper Functions
```typescript
getClassroomStudentUserIds(classroomId: string)
getAdminUserIds()
getTeacherUserIds()
getClassTeacherUserId(classroomId: string)
```

## 5. Notification Flow

### Homework Assignment
1. Teacher creates homework via `/api/homework`
2. System fetches all student user IDs in classroom
3. Bulk notification created for all students
4. Students see "New Homework" notification with details

### Leave Request
1. Teacher submits leave via `/api/teacher-leaves`
2. System fetches all admin user IDs
3. Bulk notification created for all admins
4. Admins see "Leave Request Pending" notification

### Leave Approval/Rejection
1. Admin approves/rejects via `/api/teacher-leaves/[id]`
2. System creates notification for the requesting teacher
3. Teacher sees approval/rejection with notes

### Announcement Creation
1. Admin/Teacher creates announcement via `/api/announcements`
2. System determines scope (class vs school-wide)
3. Bulk notifications sent to relevant users
4. Recipients see announcement notification

### Event Creation
1. Admin creates event via `/api/events`
2. System creates calendar entries for date range
3. If holiday, updates calendar day type
4. Notifies all admins and teachers

## 6. Event-Calendar Integration

### Automatic Calendar Updates
- When event is created, calendar days are automatically populated
- Holiday events update `dayType` to "holiday"
- Non-holiday events add notes to calendar days
- Existing calendar days are updated, not replaced

### Event Reference in Announcements
- Announcements can now reference events via `eventId`
- Useful for event-related communications
- Displayed in announcement details

## 7. Smartboard Notifications

### Features
- Real-time classroom-specific data
- Updates every 60 seconds (configurable)
- Shows last 24 hours of activity

### Data Displayed
```typescript
{
  announcements: [
    {
      id, type: "announcement",
      title, content, priority,
      createdBy, createdAt,
      scope: "class" | "school",
      event: { title, startDate } | null
    }
  ],
  homework: [
    {
      id, type: "homework",
      title, subject, teacher,
      dueDate, createdAt
    }
  ],
  messages: [
    {
      id, type: "quote" | "announcement" | "reminder",
      content, teacher, createdAt
    }
  ],
  lastUpdated: ISO timestamp
}
```

## 8. Priority Levels

- **Low** - General information, non-urgent
- **Normal** - Standard notifications (default)
- **High** - Important, requires attention (leave requests)
- **Urgent** - Critical, immediate action needed

## 9. Usage Examples

### Creating a Notification Manually
```typescript
import { createNotification } from "@/lib/actions/notifications";

await createNotification({
  type: "system_alert",
  title: "System Maintenance",
  message: "System will be down for maintenance at 10 PM",
  recipientId: userId,
  priority: "urgent",
  actionUrl: "/dashboard",
});
```

### Bulk Notifications
```typescript
import {
  createBulkNotifications,
  getClassroomStudentUserIds,
} from "@/lib/actions/notifications";

const studentIds = await getClassroomStudentUserIds(classroomId);

await createBulkNotifications({
  type: "announcement_posted",
  title: "Field Trip Tomorrow",
  message: "Remember to bring permission slips",
  recipientIds: studentIds,
  senderId: teacherId,
  priority: "high",
});
```

### Fetching Notifications in Component
```typescript
"use client";
import { useQuery } from "@tanstack/react-query";

export function NotificationBell() {
  const { data: count } = useQuery({
    queryKey: ["notification-count"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?countOnly=true");
      const data = await res.json();
      return data.count;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return <Badge>{count}</Badge>;
}
```

## 10. Next Steps for UI Implementation

### Notification Bell Component
- Display unread count badge
- Dropdown with recent notifications
- Mark as read on click
- "View All" link to notifications page

### Notifications Page
- Tabs: All, Unread, Read
- Filter by type
- Mark all as read button
- Delete individual notifications
- Click to navigate to actionUrl

### Smartboard Notifications Display
- Dedicated notifications section
- Auto-refresh with React Query
- Display announcements with priority badges
- Show recent homework with due dates
- Display daily quotes/messages

## 11. Performance Considerations

- Bulk notifications use single database insert
- Queries limited to recent data (24 hours for smartboard)
- Indexes on `recipientId`, `isRead`, `createdAt`
- Pagination for large notification lists
- Auto-cleanup of old read notifications (recommended cron job)

## 12. Security

- All notification endpoints require authentication
- Users can only access their own notifications
- Admins cannot read other users' notifications
- Smartboard notifications are public but classroom-specific
- Leave notifications only sent to authorized roles

## 13. Testing Checklist

- [ ] Create homework → Students receive notification
- [ ] Submit leave → Admins receive notification
- [ ] Approve leave → Teacher receives notification
- [ ] Create announcement → Relevant users notified
- [ ] Create event → Calendar updated, staff notified
- [ ] Mark as read → Notification updated
- [ ] Mark all as read → All notifications updated
- [ ] Delete notification → Removed from database
- [ ] Unread count updates in real-time
- [ ] Smartboard displays classroom notifications
- [ ] Smartboard auto-refreshes every minute

## 14. Future Enhancements

- Push notifications (web push API)
- Email notifications for high-priority items
- SMS notifications (Twilio integration)
- Notification preferences per user
- Notification grouping (batch similar notifications)
- Notification history/archive
- Analytics dashboard for notification engagement
