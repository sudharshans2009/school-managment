# Events & Calendar System Guide

## Overview

The Events & Calendar System provides comprehensive functionality for managing school events, activities, and the academic calendar. It supports event creation, registration, calendar integration, and notifications.

## Server Actions

All event operations are handled through server actions located in `/actions/events.ts`. These actions follow the repository pattern of returning `{ success, data?, error? }` for consistent error handling.

### Available Actions

#### 1. createEvent
Create a new event with automatic calendar integration.

**Signature:**
```typescript
createEvent(
  eventData: {
    title: string;
    description: string;
    eventType: "academic" | "sports" | "cultural" | "meeting" | "holiday" | "other";
    status?: "upcoming" | "ongoing" | "completed" | "cancelled";
    startDate: string | Date;
    endDate: string | Date;
    location?: string;
    organizer?: string;
    targetAudience?: string[];
    maxParticipants?: number;
    registrationDeadline?: string | Date;
    allowRegistration?: boolean;
    attachments?: string[];
  },
  userId: string
): Promise<{ success: boolean; data?: Event; error?: string }>
```

**Features:**
- Automatic calendar entry creation for event dates
- Holiday events automatically mark calendar days as holidays
- Bulk notifications sent to admins and teachers
- Support for file attachments
- Flexible targeting by audience (students, teachers, parents, etc.)

**Example Usage:**
```typescript
import { createEvent } from "@/actions/events";

const result = await createEvent(
  {
    title: "Annual Sports Day",
    description: "Inter-house sports competition",
    eventType: "sports",
    startDate: "2024-12-15",
    endDate: "2024-12-15",
    location: "School Sports Ground",
    organizer: "Sports Department",
    targetAudience: ["students", "teachers", "parents"],
    maxParticipants: 500,
    registrationDeadline: "2024-12-10",
    allowRegistration: true,
  },
  userId
);

if (result.success) {
  console.log("Event created:", result.data);
}
```

#### 2. updateEvent
Update an existing event.

**Signature:**
```typescript
updateEvent(
  eventId: string,
  eventData: Partial<{
    title: string;
    description: string;
    eventType: "academic" | "sports" | "cultural" | "meeting" | "holiday" | "other";
    status: "upcoming" | "ongoing" | "completed" | "cancelled";
    startDate: string | Date;
    endDate: string | Date;
    location: string;
    organizer: string;
    targetAudience: string[];
    maxParticipants: number;
    registrationDeadline: string | Date;
    allowRegistration: boolean;
    attachments: string[];
  }>
): Promise<{ success: boolean; data?: Event; error?: string }>
```

**Example Usage:**
```typescript
import { updateEvent } from "@/actions/events";

const result = await updateEvent("event-uuid", {
  status: "ongoing",
  location: "Updated Venue",
});

if (result.success) {
  console.log("Event updated successfully");
}
```

#### 3. deleteEvent
Delete an event.

**Signature:**
```typescript
deleteEvent(
  eventId: string
): Promise<{ success: boolean; error?: string }>
```

**Example Usage:**
```typescript
import { deleteEvent } from "@/actions/events";

const result = await deleteEvent("event-uuid");

if (result.success) {
  console.log("Event deleted");
}
```

#### 4. getEvents
Get all events with optional filters.

**Signature:**
```typescript
getEvents(filters?: {
  eventType?: "academic" | "sports" | "cultural" | "meeting" | "holiday" | "other";
  status?: "upcoming" | "ongoing" | "completed" | "cancelled";
  startDate?: string | Date;
  endDate?: string | Date;
  targetAudience?: string;
}): Promise<{ success: boolean; data?: Event[]; error?: string }>
```

**Example Usage:**
```typescript
import { getEvents } from "@/actions/events";

// Get all upcoming sports events
const result = await getEvents({
  eventType: "sports",
  status: "upcoming",
});

// Get events for a specific date range
const monthEvents = await getEvents({
  startDate: "2024-12-01",
  endDate: "2024-12-31",
});

// Get events for students
const studentEvents = await getEvents({
  targetAudience: "students",
});
```

#### 5. getEventById
Get a single event by ID.

**Signature:**
```typescript
getEventById(
  eventId: string
): Promise<{ success: boolean; data?: Event; error?: string }>
```

**Example Usage:**
```typescript
import { getEventById } from "@/actions/events";

const result = await getEventById("event-uuid");

if (result.success && result.data) {
  const event = result.data;
  console.log(`Event: ${event.title}`);
  console.log(`Date: ${event.startDate} to ${event.endDate}`);
}
```

#### 6. registerForEvent
Register a user for an event.

**Signature:**
```typescript
registerForEvent(
  eventId: string,
  userId: string,
  studentId?: string
): Promise<{ success: boolean; data?: EventRegistration; error?: string }>
```

**Features:**
- Validates registration deadline
- Checks maximum participants limit
- Prevents duplicate registrations
- Supports parent registration on behalf of student

**Example Usage:**
```typescript
import { registerForEvent } from "@/actions/events";

// Student self-registration
const result = await registerForEvent("event-uuid", userId);

// Parent registering for student
const parentResult = await registerForEvent(
  "event-uuid",
  parentUserId,
  studentId
);

if (result.success) {
  console.log("Registration successful");
} else {
  console.error(result.error);
}
```

#### 7. cancelEventRegistration
Cancel an event registration.

**Signature:**
```typescript
cancelEventRegistration(
  registrationId: string
): Promise<{ success: boolean; error?: string }>
```

**Example Usage:**
```typescript
import { cancelEventRegistration } from "@/actions/events";

const result = await cancelEventRegistration("registration-uuid");

if (result.success) {
  console.log("Registration cancelled");
}
```

#### 8. getEventRegistrations
Get all registrations for an event.

**Signature:**
```typescript
getEventRegistrations(
  eventId: string
): Promise<{ success: boolean; data?: EventRegistration[]; error?: string }>
```

**Example Usage:**
```typescript
import { getEventRegistrations } from "@/actions/events";

const result = await getEventRegistrations("event-uuid");

if (result.success && result.data) {
  const registrations = result.data;
  console.log(`Total registrations: ${registrations.length}`);
  
  const attended = registrations.filter(
    r => r.registrationStatus === "attended"
  ).length;
  console.log(`Attended: ${attended}`);
}
```

## Data Types

### Event
```typescript
interface Event {
  id: string;
  title: string;
  description: string | null;
  eventType: "academic" | "sports" | "cultural" | "meeting" | "holiday" | "other";
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  startDate: Date;
  endDate: Date;
  location: string | null;
  organizer: string | null;
  targetAudience: string | null; // JSON array
  maxParticipants: number | null;
  registrationDeadline: Date | null;
  allowRegistration: boolean | null;
  attachments: string | null; // JSON array
  createdBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  createdByName?: string | null;
}
```

### EventRegistration
```typescript
interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  studentId: string | null;
  registrationStatus: "registered" | "attended" | "absent" | "cancelled";
  registeredAt: Date | null;
  attendedAt: Date | null;
  remarks: string | null;
  userName?: string | null;
  studentName?: string | null;
}
```

### Event Types
- **academic**: Academic events (exams, workshops, seminars)
- **sports**: Sports activities and competitions
- **cultural**: Cultural programs and celebrations
- **meeting**: Parent-teacher meetings, staff meetings
- **holiday**: School holidays and breaks
- **other**: Other miscellaneous events

### Event Statuses
- **upcoming**: Event is scheduled for the future
- **ongoing**: Event is currently happening
- **completed**: Event has finished
- **cancelled**: Event has been cancelled

## Usage in Pages

### Admin Events Page

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createEvent,
  getEvents,
  updateEvent,
  deleteEvent,
} from "@/actions/events";

export default function AdminEventsPage() {
  const queryClient = useQueryClient();
  
  // Fetch all events
  const { data: eventsResult } = useQuery({
    queryKey: ["events"],
    queryFn: () => getEvents(),
  });

  // Create event mutation
  const createMutation = useMutation({
    mutationFn: (eventData) => createEvent(eventData, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event created successfully");
    },
  });

  // Update event mutation
  const updateMutation = useMutation({
    mutationFn: ({ eventId, data }) => updateEvent(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event updated successfully");
    },
  });

  // Delete event mutation
  const deleteMutation = useMutation({
    mutationFn: (eventId) => deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event deleted successfully");
    },
  });

  // Render UI...
}
```

### Student Events Page

```typescript
import { getEvents, registerForEvent } from "@/actions/events";

export default function StudentEventsPage() {
  // Fetch events for students
  const { data: eventsResult } = useQuery({
    queryKey: ["student-events"],
    queryFn: () => getEvents({ 
      targetAudience: "students",
      status: "upcoming",
    }),
  });

  // Register for event
  const registerMutation = useMutation({
    mutationFn: (eventId) => registerForEvent(eventId, userId),
    onSuccess: () => {
      toast.success("Registered successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Render UI...
}
```

### Calendar View Component

```typescript
import { getEvents } from "@/actions/events";
import { format, startOfMonth, endOfMonth } from "date-fns";

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: eventsResult } = useQuery({
    queryKey: ["calendar-events", currentMonth],
    queryFn: () => getEvents({
      startDate: startOfMonth(currentMonth),
      endDate: endOfMonth(currentMonth),
    }),
  });

  // Render calendar with events...
}
```

## Calendar Integration

When an event is created, the system automatically:

1. **Creates Calendar Entries**: For each day in the event's date range
2. **Marks Holidays**: If event type is "holiday", marks days as non-working
3. **Adds Notes**: Event information is added to calendar day notes
4. **Updates Existing Days**: If a calendar day already exists, appends event info

```typescript
// Calendar day structure after event creation
{
  date: "2024-12-15",
  dayType: "holiday", // or "working"
  holidayFor: "all",
  holidayName: "Annual Sports Day",
  notes: "Event: Annual Sports Day"
}
```

## Notifications

Event creation automatically sends notifications to:
- All admin users
- All teacher users
- Users specified in `targetAudience` (future enhancement)

Notification includes:
- Event title
- Event type
- Description preview
- Link to calendar page

## Best Practices

1. **Target Audience**: Always specify target audience for better event filtering:
```typescript
targetAudience: ["students", "teachers", "parents"]
```

2. **Registration Limits**: Set `maxParticipants` for events with limited capacity:
```typescript
maxParticipants: 100,
allowRegistration: true,
registrationDeadline: "2024-12-10"
```

3. **File Attachments**: Store attachments as URL array:
```typescript
attachments: [
  "https://example.com/event-poster.pdf",
  "https://example.com/event-schedule.pdf"
]
```

4. **Event Status Management**: Update status as event progresses:
```typescript
// When event starts
await updateEvent(eventId, { status: "ongoing" });

// When event ends
await updateEvent(eventId, { status: "completed" });
```

5. **Cancellations**: Don't delete cancelled events, update status instead:
```typescript
await updateEvent(eventId, { status: "cancelled" });
```

## Permission-Based Access

### Admin
- Create, update, and delete all events
- View all event registrations
- Mark attendance for events
- Full calendar management

### Teacher
- Create events (subject to admin approval)
- View all events
- Register for events
- View registrations for their events

### Student
- View events targeted to students
- Register for events (if allowed)
- View own registrations
- Cancel own registrations

### Parent
- View events targeted to parents
- Register children for events
- View children's registrations

## Database Schema

### Events Table
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type event_type NOT NULL,
  status event_status NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  location VARCHAR(255),
  organizer VARCHAR(255),
  target_audience TEXT, -- JSON array
  max_participants INTEGER,
  registration_deadline TIMESTAMP,
  allow_registration BOOLEAN DEFAULT false,
  attachments TEXT, -- JSON array
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Event Registrations Table
```sql
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  student_id UUID REFERENCES students(id),
  registration_status registration_status NOT NULL,
  registered_at TIMESTAMP DEFAULT NOW(),
  attended_at TIMESTAMP,
  remarks TEXT
);
```

## Advanced Features

### Recurring Events
For recurring events (future enhancement), create multiple event entries:

```typescript
// Create monthly meeting series
const months = ["2024-01", "2024-02", "2024-03"];
for (const month of months) {
  await createEvent({
    title: `Monthly Staff Meeting - ${month}`,
    description: "Regular monthly staff meeting",
    eventType: "meeting",
    startDate: `${month}-15T10:00:00`,
    endDate: `${month}-15T12:00:00`,
    // ... other fields
  }, userId);
}
```

### Event Categories
Filter events by multiple types:

```typescript
const academicEvents = await getEvents({ eventType: "academic" });
const funEvents = await getEvents({ 
  // Get both sports and cultural
});
// Note: Currently supports single type, multi-type filtering is a future enhancement
```

### Attendance Tracking
Track event attendance through registration status:

```typescript
// Mark student as attended
await db.update(eventRegistrations)
  .set({ 
    registrationStatus: "attended",
    attendedAt: new Date() 
  })
  .where(eq(eventRegistrations.id, registrationId));
```

## Troubleshooting

### Common Issues

**Issue**: Event not appearing in calendar
- **Solution**: Check that the event date range is valid and calendar page is refreshing

**Issue**: Cannot register for event
- **Solution**: Verify:
  - `allowRegistration` is `true`
  - Registration deadline hasn't passed
  - Max participants limit not reached
  - User hasn't already registered

**Issue**: Notifications not sent
- **Solution**: Ensure admins and teachers exist in database. Check notification service logs.

## Future Enhancements

1. **Recurring Events**: Built-in support for recurring event patterns
2. **Event Templates**: Pre-defined templates for common events
3. **RSVP System**: More sophisticated RSVP with meal preferences, etc.
4. **Event Reminders**: Automated reminders before events
5. **Photo Gallery**: Upload and share event photos
6. **Feedback Forms**: Post-event feedback collection
7. **iCal Export**: Export events to calendar applications

## Related Documentation

- [Calendar System Guide](./CALENDAR_SYSTEM.md)
- [Notification System Guide](./NOTIFICATION_SYSTEM.md)
- [Admin Dashboard Guide](./SETUP_COMPLETE.md)

## Support

For issues or questions about the Events & Calendar System:
1. Check this documentation
2. Review server action code in `/actions/events.ts`
3. Check database schema in `/database/schema.ts`
4. Contact the development team

---

Last updated: 2024-11-09
