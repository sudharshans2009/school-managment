import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { events, users } from "@/database/schema";
import { eq, desc, and, gte, lte, inArray, or } from "drizzle-orm";
import { auth } from "@/lib/auth";

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
      conditions.push(eq(events.eventType, eventType as any));
    }

    if (status) {
      conditions.push(eq(events.status, status as any));
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

    return NextResponse.json(newEvent[0], { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 },
    );
  }
}
