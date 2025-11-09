import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { events, users, calendarDays } from "@/database/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { auth } from "@/lib/auth/main";
import {
  createBulkNotifications,
  getAdminUserIds,
  getTeacherUserIds,
} from "@/actions/notifications";

// GET - Fetch all events with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventType = searchParams.get("eventType");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const targetAudience = searchParams.get("targetAudience");

    const conditions = [];

    if (eventType) {
      conditions.push(
        eq(
          events.eventType,
          eventType as
            | "academic"
            | "sports"
            | "cultural"
            | "meeting"
            | "holiday"
            | "other",
        ),
      );
    }

    if (status) {
      conditions.push(
        eq(
          events.status,
          status as "upcoming" | "ongoing" | "completed" | "cancelled",
        ),
      );
    }

    if (startDate && endDate) {
      conditions.push(
        and(
          gte(events.startDate, new Date(startDate)),
          lte(events.endDate, new Date(endDate)),
        ),
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
        createdByName: users.name,
      })
      .from(events)
      .leftJoin(users, eq(events.createdBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(events.startDate));

    // Filter by target audience if specified
    let filteredEvents = allEvents;
    if (targetAudience) {
      filteredEvents = allEvents.filter((event) => {
        if (!event.targetAudience) return true;
        try {
          const audiences = JSON.parse(event.targetAudience);
          return (
            audiences.includes("all") || audiences.includes(targetAudience)
          );
        } catch {
          return true;
        }
      });
    }

    return NextResponse.json(filteredEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}

// POST - Create a new event (admin/teacher only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || !["admin", "teacher"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      eventType,
      status,
      startDate,
      endDate,
      location,
      organizer,
      targetAudience,
      maxParticipants,
      registrationDeadline,
      allowRegistration,
      attachments,
    } = body;

    if (!title || !description || !eventType || !startDate || !endDate) {
      return NextResponse.json(
        {
          error:
            "Title, description, event type, start date, and end date are required",
        },
        { status: 400 },
      );
    }

    const newEvent = await db
      .insert(events)
      .values({
        title,
        description,
        eventType,
        status: status || "upcoming",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        organizer,
        targetAudience: targetAudience ? JSON.stringify(targetAudience) : null,
        maxParticipants,
        registrationDeadline: registrationDeadline
          ? new Date(registrationDeadline)
          : null,
        allowRegistration: allowRegistration || false,
        attachments: attachments ? JSON.stringify(attachments) : null,
        createdBy: session.user.id,
      })
      .returning();

    // Create calendar entries for the event date range
    const eventStartDate = new Date(startDate);
    const eventEndDate = new Date(endDate);
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
          dayType: eventType === "holiday" ? "holiday" : "working",
          dayDuration: "full",
          holidayFor: eventType === "holiday" ? "all" : null,
          holidayName: eventType === "holiday" ? title : null,
          notes: `Event: ${title}`,
          createdBy: session.user.id,
        });
      } else if (eventType === "holiday" && existingDay.dayType !== "holiday") {
        // Update existing day to holiday if event is a holiday
        await db
          .update(calendarDays)
          .set({
            dayType: "holiday",
            holidayFor: "all",
            holidayName: title,
            notes: `${existingDay.notes || ""}\nEvent: ${title}`,
          })
          .where(eq(calendarDays.id, existingDay.id));
      } else {
        // Just add notes to existing day
        await db
          .update(calendarDays)
          .set({
            notes: `${existingDay.notes || ""}\nEvent: ${title}`,
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
        title: `New Event: ${title}`,
        message: `${eventType.replace(/_/g, " ").toUpperCase()}: ${description.substring(0, 100)}${description.length > 100 ? "..." : ""}`,
        recipientIds,
        senderId: session.user.id,
        relatedId: newEvent[0].id,
        relatedType: "event",
        priority: "normal",
        actionUrl: `/admin/calendar`,
      });
    }

    return NextResponse.json(newEvent[0], { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 },
    );
  }
}
