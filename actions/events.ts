"use server";

import { db } from "@/database";
import {
  events,
  users,
  calendarDays,
  eventRegistrations,
  students,
} from "@/database/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import {
  createBulkNotifications,
  getAdminUserIds,
  getTeacherUserIds,
} from "@/actions/notifications";

// ============================================
// EVENTS & CALENDAR MANAGEMENT
// ============================================

export interface Event {
  id: string;
  title: string;
  description: string | null;
  eventType: "academic" | "sports" | "cultural" | "meeting" | "holiday" | "other";
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  startDate: Date;
  endDate: Date;
  location: string | null;
  organizer: string | null;
  targetAudience: string | null;
  maxParticipants: number | null;
  registrationDeadline: Date | null;
  allowRegistration: boolean | null;
  attachments: string | null;
  createdBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  createdByName?: string | null;
}

export interface EventRegistration {
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

/**
 * Create a new event
 * @param eventData - Event data to create
 * @param userId - User ID of the creator
 */
export async function createEvent(
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
): Promise<{ success: boolean; data?: Event; error?: string }> {
  try {
    if (!eventData.title || !eventData.description || !eventData.eventType || !eventData.startDate || !eventData.endDate) {
      return {
        success: false,
        error: "Title, description, event type, start date, and end date are required",
      };
    }

    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const newEvent = await db
      .insert(events)
      .values({
        title: eventData.title,
        description: eventData.description,
        eventType: eventData.eventType,
        status: eventData.status || "upcoming",
        startDate: new Date(eventData.startDate),
        endDate: new Date(eventData.endDate),
        location: eventData.location || null,
        organizer: eventData.organizer || null,
        targetAudience: eventData.targetAudience ? JSON.stringify(eventData.targetAudience) : null,
        maxParticipants: eventData.maxParticipants || null,
        registrationDeadline: eventData.registrationDeadline
          ? new Date(eventData.registrationDeadline)
          : null,
        allowRegistration: eventData.allowRegistration || false,
        attachments: eventData.attachments ? JSON.stringify(eventData.attachments) : null,
        createdBy: userId,
      })
      .returning();

    // Create calendar entries for the event date range
    const eventStartDate = new Date(eventData.startDate);
    const eventEndDate = new Date(eventData.endDate);
    const currentDate = new Date(eventStartDate);

    while (currentDate <= eventEndDate) {
      const dateStr = currentDate.toISOString().split("T")[0];

      // Check if calendar day already exists
      const existingDay = await db.query.calendarDays.findFirst({
        where: eq(calendarDays.date, dateStr),
      });

      if (!existingDay) {
        // Create new calendar day entry
        await db.insert(calendarDays).values({
          date: dateStr,
          dayType: eventData.eventType === "holiday" ? "holiday" : "working",
          dayDuration: "full",
          holidayFor: eventData.eventType === "holiday" ? "all" : null,
          holidayName: eventData.eventType === "holiday" ? eventData.title : null,
          notes: `Event: ${eventData.title}`,
          createdBy: userId,
        });
      } else if (eventData.eventType === "holiday" && existingDay.dayType !== "holiday") {
        // Update existing day to holiday if event is a holiday
        await db
          .update(calendarDays)
          .set({
            dayType: "holiday",
            holidayFor: "all",
            holidayName: eventData.title,
            notes: `${existingDay.notes || ""}\nEvent: ${eventData.title}`,
          })
          .where(eq(calendarDays.id, existingDay.id));
      } else {
        // Just add notes to existing day
        await db
          .update(calendarDays)
          .set({
            notes: `${existingDay.notes || ""}\nEvent: ${eventData.title}`,
          })
          .where(eq(calendarDays.id, existingDay.id));
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Notify all admins and teachers about the new event
    const adminIds = await getAdminUserIds();
    const teacherIds = await getTeacherUserIds();
    const recipientIds = [...new Set([...adminIds, ...teacherIds])];

    if (recipientIds.length > 0) {
      await createBulkNotifications({
        type: "event_created",
        title: `New Event: ${eventData.title}`,
        message: `${eventData.eventType.replace(/_/g, " ").toUpperCase()}: ${eventData.description.substring(0, 100)}${eventData.description.length > 100 ? "..." : ""}`,
        recipientIds,
        senderId: userId,
        relatedId: newEvent[0].id,
        relatedType: "event",
        priority: "normal",
        actionUrl: `/admin/calendar`,
      });
    }

    return { success: true, data: newEvent[0] as Event };
  } catch (error) {
    console.error("Error creating event:", error);
    return { success: false, error: "Failed to create event" };
  }
}

/**
 * Update an existing event
 * @param eventId - Event ID
 * @param eventData - Updated event data
 */
export async function updateEvent(
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
): Promise<{ success: boolean; data?: Event; error?: string }> {
  try {
    if (!eventId) {
      return { success: false, error: "Event ID is required" };
    }

    const updateData: any = {};

    if (eventData.title) updateData.title = eventData.title;
    if (eventData.description) updateData.description = eventData.description;
    if (eventData.eventType) updateData.eventType = eventData.eventType;
    if (eventData.status) updateData.status = eventData.status;
    if (eventData.startDate) updateData.startDate = new Date(eventData.startDate);
    if (eventData.endDate) updateData.endDate = new Date(eventData.endDate);
    if (eventData.location !== undefined) updateData.location = eventData.location;
    if (eventData.organizer !== undefined) updateData.organizer = eventData.organizer;
    if (eventData.targetAudience) updateData.targetAudience = JSON.stringify(eventData.targetAudience);
    if (eventData.maxParticipants !== undefined) updateData.maxParticipants = eventData.maxParticipants;
    if (eventData.registrationDeadline) updateData.registrationDeadline = new Date(eventData.registrationDeadline);
    if (eventData.allowRegistration !== undefined) updateData.allowRegistration = eventData.allowRegistration;
    if (eventData.attachments) updateData.attachments = JSON.stringify(eventData.attachments);

    const updatedEvent = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, eventId))
      .returning();

    if (updatedEvent.length === 0) {
      return { success: false, error: "Event not found" };
    }

    return { success: true, data: updatedEvent[0] as Event };
  } catch (error) {
    console.error("Error updating event:", error);
    return { success: false, error: "Failed to update event" };
  }
}

/**
 * Delete an event
 * @param eventId - Event ID
 */
export async function deleteEvent(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!eventId) {
      return { success: false, error: "Event ID is required" };
    }

    await db.delete(events).where(eq(events.id, eventId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { success: false, error: "Failed to delete event" };
  }
}

/**
 * Get all events with optional filters
 * @param filters - Optional filters for events
 */
export async function getEvents(filters?: {
  eventType?: "academic" | "sports" | "cultural" | "meeting" | "holiday" | "other";
  status?: "upcoming" | "ongoing" | "completed" | "cancelled";
  startDate?: string | Date;
  endDate?: string | Date;
  targetAudience?: string;
}): Promise<{ success: boolean; data?: Event[]; error?: string }> {
  try {
    const conditions = [];

    if (filters?.eventType) {
      conditions.push(eq(events.eventType, filters.eventType));
    }

    if (filters?.status) {
      conditions.push(eq(events.status, filters.status));
    }

    if (filters?.startDate && filters?.endDate) {
      conditions.push(
        and(
          gte(events.startDate, new Date(filters.startDate)),
          lte(events.endDate, new Date(filters.endDate))
        ) as any
      );
    }

    const allEvents = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        eventType: events.eventType,
        status: events.status,
        startDate: events.startDate,
        endDate: events.endDate,
        location: events.location,
        organizer: events.organizer,
        targetAudience: events.targetAudience,
        maxParticipants: events.maxParticipants,
        registrationDeadline: events.registrationDeadline,
        allowRegistration: events.allowRegistration,
        attachments: events.attachments,
        createdBy: events.createdBy,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        createdByName: users.name,
      })
      .from(events)
      .leftJoin(users, eq(events.createdBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(events.startDate));

    // Filter by target audience if specified
    let filteredEvents = allEvents;
    if (filters?.targetAudience) {
      filteredEvents = allEvents.filter((event) => {
        if (!event.targetAudience) return true;
        try {
          const audiences = JSON.parse(event.targetAudience);
          return (
            audiences.includes("all") || audiences.includes(filters.targetAudience)
          );
        } catch {
          return true;
        }
      });
    }

    return { success: true, data: filteredEvents as Event[] };
  } catch (error) {
    console.error("Error fetching events:", error);
    return { success: false, error: "Failed to fetch events" };
  }
}

/**
 * Get a single event by ID
 * @param eventId - Event ID
 */
export async function getEventById(
  eventId: string
): Promise<{ success: boolean; data?: Event; error?: string }> {
  try {
    if (!eventId) {
      return { success: false, error: "Event ID is required" };
    }

    const event = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        eventType: events.eventType,
        status: events.status,
        startDate: events.startDate,
        endDate: events.endDate,
        location: events.location,
        organizer: events.organizer,
        targetAudience: events.targetAudience,
        maxParticipants: events.maxParticipants,
        registrationDeadline: events.registrationDeadline,
        allowRegistration: events.allowRegistration,
        attachments: events.attachments,
        createdBy: events.createdBy,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        createdByName: users.name,
      })
      .from(events)
      .leftJoin(users, eq(events.createdBy, users.id))
      .where(eq(events.id, eventId))
      .limit(1);

    if (event.length === 0) {
      return { success: false, error: "Event not found" };
    }

    return { success: true, data: event[0] as Event };
  } catch (error) {
    console.error("Error fetching event:", error);
    return { success: false, error: "Failed to fetch event" };
  }
}

/**
 * Register for an event
 * @param eventId - Event ID
 * @param userId - User ID
 * @param studentId - Student ID (optional, for parent registering on behalf of student)
 */
export async function registerForEvent(
  eventId: string,
  userId: string,
  studentId?: string
): Promise<{ success: boolean; data?: EventRegistration; error?: string }> {
  try {
    if (!eventId || !userId) {
      return { success: false, error: "Event ID and User ID are required" };
    }

    // Check if event exists and allows registration
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    if (!event.allowRegistration) {
      return { success: false, error: "Registration is not allowed for this event" };
    }

    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return { success: false, error: "Registration deadline has passed" };
    }

    // Check if already registered
    const existingRegistration = await db.query.eventRegistrations.findFirst({
      where: and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.userId, userId)
      ),
    });

    if (existingRegistration) {
      return { success: false, error: "Already registered for this event" };
    }

    // Check max participants
    if (event.maxParticipants) {
      const registrationCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(eventRegistrations)
        .where(eq(eventRegistrations.eventId, eventId));

      if (registrationCount[0].count >= event.maxParticipants) {
        return { success: false, error: "Event has reached maximum participants" };
      }
    }

    const newRegistration = await db
      .insert(eventRegistrations)
      .values({
        eventId,
        userId,
        studentId: studentId || null,
        registrationStatus: "registered",
      })
      .returning();

    return { success: true, data: newRegistration[0] as EventRegistration };
  } catch (error) {
    console.error("Error registering for event:", error);
    return { success: false, error: "Failed to register for event" };
  }
}

/**
 * Cancel event registration
 * @param registrationId - Registration ID
 */
export async function cancelEventRegistration(
  registrationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!registrationId) {
      return { success: false, error: "Registration ID is required" };
    }

    await db
      .update(eventRegistrations)
      .set({ registrationStatus: "cancelled" })
      .where(eq(eventRegistrations.id, registrationId));

    return { success: true };
  } catch (error) {
    console.error("Error cancelling registration:", error);
    return { success: false, error: "Failed to cancel registration" };
  }
}

/**
 * Get event registrations
 * @param eventId - Event ID
 */
export async function getEventRegistrations(
  eventId: string
): Promise<{ success: boolean; data?: EventRegistration[]; error?: string }> {
  try {
    if (!eventId) {
      return { success: false, error: "Event ID is required" };
    }

    const registrations = await db
      .select({
        id: eventRegistrations.id,
        eventId: eventRegistrations.eventId,
        userId: eventRegistrations.userId,
        studentId: eventRegistrations.studentId,
        registrationStatus: eventRegistrations.registrationStatus,
        registeredAt: eventRegistrations.registeredAt,
        attendedAt: eventRegistrations.attendedAt,
        remarks: eventRegistrations.remarks,
        userName: users.name,
        studentName: sql<string>`COALESCE((SELECT u.name FROM ${students} s JOIN ${users} u ON s.user_id = u.id WHERE s.id = ${eventRegistrations.studentId}), NULL)`,
      })
      .from(eventRegistrations)
      .leftJoin(users, eq(eventRegistrations.userId, users.id))
      .where(eq(eventRegistrations.eventId, eventId))
      .orderBy(eventRegistrations.registeredAt);

    return { success: true, data: registrations as EventRegistration[] };
  } catch (error) {
    console.error("Error fetching event registrations:", error);
    return { success: false, error: "Failed to fetch registrations" };
  }
}
