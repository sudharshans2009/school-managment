import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { events } from "@/database/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/main";

// GET single event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const event = await db.query.events.findFirst({
      where: eq(events.id, id),
      with: {
        creator: true,
        registrations: {
          with: {
            user: true,
            student: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 },
    );
  }
}

// PUT update event (admin/teacher only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || !["admin", "teacher"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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

    const existingEvent = await db.query.events.findFirst({
      where: eq(events.id, id),
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (eventType) updateData.eventType = eventType;
    if (status) updateData.status = status;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (location !== undefined) updateData.location = location;
    if (organizer !== undefined) updateData.organizer = organizer;
    if (targetAudience !== undefined)
      updateData.targetAudience = targetAudience
        ? JSON.stringify(targetAudience)
        : null;
    if (maxParticipants !== undefined)
      updateData.maxParticipants = maxParticipants;
    if (registrationDeadline !== undefined)
      updateData.registrationDeadline = registrationDeadline
        ? new Date(registrationDeadline)
        : null;
    if (allowRegistration !== undefined)
      updateData.allowRegistration = allowRegistration;
    if (attachments !== undefined)
      updateData.attachments = attachments ? JSON.stringify(attachments) : null;

    const [updatedEvent] = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, id))
      .returning();

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 },
    );
  }
}

// DELETE event (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingEvent = await db.query.events.findFirst({
      where: eq(events.id, id),
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await db.delete(events).where(eq(events.id, id));

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 },
    );
  }
}
