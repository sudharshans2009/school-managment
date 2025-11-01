import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import {
  groupMessages,
  groupMessageRecipients,
  users,
} from "@/database/schema";
import { eq, desc, or, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

// GET - Fetch group messages
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const targetGroup = searchParams.get("targetGroup");

    const messages = await db
      .select({
        id: groupMessages.id,
        subject: groupMessages.subject,
        content: groupMessages.content,
        senderId: groupMessages.senderId,
        senderName: users.name,
        targetGroups: groupMessages.targetGroups,
        attachments: groupMessages.attachments,
        priority: groupMessages.priority,
        sentAt: groupMessages.sentAt,
      })
      .from(groupMessages)
      .leftJoin(users, eq(groupMessages.senderId, users.id))
      .orderBy(desc(groupMessages.sentAt));

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching group messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch group messages" },
      { status: 500 },
    );
  }
}

// POST - Send a group message (admin/teacher only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || !["admin", "teacher"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, content, targetGroups, attachments, priority } = body;

    if (!subject || !content || !targetGroups || targetGroups.length === 0) {
      return NextResponse.json(
        { error: "Subject, content, and target groups are required" },
        { status: 400 },
      );
    }

    const [message] = await db
      .insert(groupMessages)
      .values({
        subject,
        content,
        senderId: session.user.id,
        targetGroups: JSON.stringify(targetGroups),
        attachments: attachments ? JSON.stringify(attachments) : null,
        priority: priority || "normal",
      })
      .returning();

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error sending group message:", error);
    return NextResponse.json(
      { error: "Failed to send group message" },
      { status: 500 },
    );
  }
}
