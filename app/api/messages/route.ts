import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { messages, users } from "@/database/schema";
import { eq, or, desc } from "drizzle-orm";

// GET - Fetch messages for a user (sent or received)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const type = searchParams.get("type"); // 'sent', 'received', 'all'

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    let userMessages;

    if (type === "sent") {
      userMessages = await db
        .select({
          id: messages.id,
          senderId: messages.senderId,
          receiverId: messages.receiverId,
          subject: messages.subject,
          message: messages.message,
          messageType: messages.messageType,
          status: messages.status,
          readAt: messages.readAt,
          createdAt: messages.createdAt,
          senderName: users.name,
          senderEmail: users.email,
        })
        .from(messages)
        .leftJoin(users, eq(messages.receiverId, users.id))
        .where(eq(messages.senderId, userId))
        .orderBy(desc(messages.createdAt));
    } else if (type === "received") {
      userMessages = await db
        .select({
          id: messages.id,
          senderId: messages.senderId,
          receiverId: messages.receiverId,
          subject: messages.subject,
          message: messages.message,
          messageType: messages.messageType,
          status: messages.status,
          readAt: messages.readAt,
          createdAt: messages.createdAt,
          senderName: users.name,
          senderEmail: users.email,
        })
        .from(messages)
        .leftJoin(users, eq(messages.senderId, users.id))
        .where(eq(messages.receiverId, userId))
        .orderBy(desc(messages.createdAt));
    } else {
      // All messages (sent or received)
      userMessages = await db
        .select({
          id: messages.id,
          senderId: messages.senderId,
          receiverId: messages.receiverId,
          subject: messages.subject,
          message: messages.message,
          messageType: messages.messageType,
          status: messages.status,
          readAt: messages.readAt,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(
          or(eq(messages.senderId, userId), eq(messages.receiverId, userId)),
        )
        .orderBy(desc(messages.createdAt));
    }

    return NextResponse.json(userMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      senderId,
      receiverId,
      subject,
      message,
      messageType = "general",
    } = body;

    if (!senderId || !receiverId || !subject || !message) {
      return NextResponse.json(
        { error: "Sender ID, Receiver ID, subject, and message are required" },
        { status: 400 },
      );
    }

    const [newMessage] = await db
      .insert(messages)
      .values({
        senderId,
        receiverId,
        subject,
        message,
        messageType,
        status: "sent",
      })
      .returning();

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}
