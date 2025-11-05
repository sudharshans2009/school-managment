import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { timetable } from "@/database/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

// DELETE /api/timetable/[id] - Delete timetable entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(timetable)
      .where(eq(timetable.id, id))
      .returning();

    if (!deleted) {
      notFound();
    }

    return NextResponse.json({
      message: "Timetable entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting timetable entry:", error);
    return NextResponse.json(
      { error: "Failed to delete timetable entry" },
      { status: 500 },
    );
  }
}

// PUT /api/timetable/[id] - Update timetable entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { subjectId, teacherId, dayOfWeek, startTime, endTime, room } = body;

    const [updated] = await db
      .update(timetable)
      .set({
        subjectId,
        teacherId,
        dayOfWeek,
        startTime,
        endTime,
        room,
      })
      .where(eq(timetable.id, id))
      .returning();

    if (!updated) {
      notFound();
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating timetable entry:", error);
    return NextResponse.json(
      { error: "Failed to update timetable entry" },
      { status: 500 },
    );
  }
}
