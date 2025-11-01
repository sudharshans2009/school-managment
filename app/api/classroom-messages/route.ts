import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { classroomMessages, classrooms, users } from "@/database/schema";
import { eq, and, gte, desc } from "drizzle-orm";

// GET - Fetch classroom messages
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const classroomId = searchParams.get("classroomId");
    const messageType = searchParams.get("messageType");
    const today = searchParams.get("today"); // If true, only get today's messages

    if (!classroomId) {
      return NextResponse.json(
        { error: "Classroom ID is required" },
        { status: 400 },
      );
    }

    const conditions = [
      eq(classroomMessages.classroomId, classroomId),
      eq(classroomMessages.isActive, true),
    ];

    if (messageType) {
      conditions.push(eq(classroomMessages.messageType, messageType));
    }

    if (today === "true") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      conditions.push(gte(classroomMessages.date, todayStart));
    }

    const classMessages = await db
      .select({
        id: classroomMessages.id,
        classroomId: classroomMessages.classroomId,
        teacherId: classroomMessages.teacherId,
        messageType: classroomMessages.messageType,
        content: classroomMessages.content,
        date: classroomMessages.date,
        isActive: classroomMessages.isActive,
        createdAt: classroomMessages.createdAt,
        teacherName: users.name,
        classroomName: classrooms.name,
      })
      .from(classroomMessages)
      .leftJoin(users, eq(classroomMessages.teacherId, users.id))
      .leftJoin(classrooms, eq(classroomMessages.classroomId, classrooms.id))
      .where(and(...conditions))
      .orderBy(desc(classroomMessages.date));

    return NextResponse.json(classMessages);
  } catch (error) {
    console.error("Error fetching classroom messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch classroom messages" },
      { status: 500 },
    );
  }
}

// POST - Create a new classroom message (quote, announcement, etc.)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classroomId, teacherId, messageType, content } = body;

    if (!classroomId || !teacherId || !messageType || !content) {
      return NextResponse.json(
        {
          error:
            "Classroom ID, Teacher ID, message type, and content are required",
        },
        { status: 400 },
      );
    }

    const [newMessage] = await db
      .insert(classroomMessages)
      .values({
        classroomId,
        teacherId,
        messageType,
        content,
        date: new Date(),
        isActive: true,
      })
      .returning();

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error("Error creating classroom message:", error);
    return NextResponse.json(
      { error: "Failed to create classroom message" },
      { status: 500 },
    );
  }
}
