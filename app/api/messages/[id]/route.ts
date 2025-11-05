import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { messages } from "@/database/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

// PATCH - Mark message as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const [updatedMessage] = await db
      .update(messages)
      .set({
        status: "read",
        readAt: new Date(),
      })
      .where(eq(messages.id, id))
      .returning();

    if (!updatedMessage) {
      notFound();
    }

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 },
    );
  }
}

// DELETE - Delete a message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await db.delete(messages).where(eq(messages.id, id));

    return NextResponse.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 },
    );
  }
}
