import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { meetingSlots, meetingBookings } from "@/database/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

// POST - Book a meeting slot (parents only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || session.user.role !== "parent") {
      return NextResponse.json(
        { error: "Unauthorized. Only parents can book meetings." },
        { status: 401 },
      );
    }

    const { id: slotId } = await params;
    const body = await request.json();
    const { studentId, purpose } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 },
      );
    }

    const slot = await db.query.meetingSlots.findFirst({
      where: eq(meetingSlots.id, slotId),
    });

    if (!slot) {
      return NextResponse.json(
        { error: "Meeting slot not found" },
        { status: 404 },
      );
    }

    if (!slot.isActive) {
      return NextResponse.json(
        { error: "Meeting slot is not active" },
        { status: 400 },
      );
    }

    if ((slot.currentBookings || 0) >= (slot.maxBookings || 1)) {
      return NextResponse.json(
        { error: "Meeting slot is fully booked" },
        { status: 400 },
      );
    }

    const [booking] = await db
      .insert(meetingBookings)
      .values({
        slotId,
        parentId: session.user.id,
        studentId,
        status: "scheduled",
        purpose,
      })
      .returning();

    await db
      .update(meetingSlots)
      .set({ currentBookings: (slot.currentBookings || 0) + 1 })
      .where(eq(meetingSlots.id, slotId));

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error booking meeting:", error);
    return NextResponse.json(
      { error: "Failed to book meeting" },
      { status: 500 },
    );
  }
}
