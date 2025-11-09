import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { events, eventRegistrations } from "@/database/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth/main";

// POST - Register for an event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;
    const body = await request.json();
    const { studentId, notes } = body;

    // Check if event exists and allows registration
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!event.allowRegistration) {
      return NextResponse.json(
        { error: "Registration is not allowed for this event" },
        { status: 400 },
      );
    }

    // Check if registration deadline has passed
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return NextResponse.json(
        { error: "Registration deadline has passed" },
        { status: 400 },
      );
    }

    // Check if max participants reached using count
    if (event.maxParticipants) {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(eventRegistrations)
        .where(
          and(
            eq(eventRegistrations.eventId, eventId),
            eq(eventRegistrations.status, "registered"),
          ),
        );
      const registrationCount = Number(countResult[0]?.count || 0);

      if (registrationCount >= event.maxParticipants) {
        return NextResponse.json(
          { error: "Maximum participants reached" },
          { status: 400 },
        );
      }
    }

    // Check if already registered (excluding cancelled registrations)
    const existingRegistration = await db.query.eventRegistrations.findFirst({
      where: and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.userId, session.user.id),
        eq(eventRegistrations.status, "registered"),
      ),
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: "Already registered for this event" },
        { status: 400 },
      );
    }

    // Create registration
    const [registration] = await db
      .insert(eventRegistrations)
      .values({
        eventId,
        userId: session.user.id,
        studentId: studentId || null,
        status: "registered",
        notes,
      })
      .returning();

    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    console.error("Error registering for event:", error);
    return NextResponse.json(
      { error: "Failed to register for event" },
      { status: 500 },
    );
  }
}

// DELETE - Cancel registration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;

    const registration = await db.query.eventRegistrations.findFirst({
      where: and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.userId, session.user.id),
      ),
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 },
      );
    }

    await db
      .update(eventRegistrations)
      .set({ status: "cancelled" })
      .where(eq(eventRegistrations.id, registration.id));

    return NextResponse.json({
      message: "Registration cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling registration:", error);
    return NextResponse.json(
      { error: "Failed to cancel registration" },
      { status: 500 },
    );
  }
}
