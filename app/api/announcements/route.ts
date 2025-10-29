import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { announcements, classrooms, users } from "@/database/schema";
import { eq, desc, and } from "drizzle-orm";

// GET - Fetch all announcements
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const classroomId = searchParams.get("classroomId");

    const conditions = [];

    if (classroomId) {
      conditions.push(eq(announcements.classroomId, classroomId));
    }

    const allAnnouncements = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        priority: announcements.priority,
        classroomId: announcements.classroomId,
        createdBy: announcements.createdBy,
        createdAt: announcements.createdAt,
        classroomName: classrooms.name,
        createdByName: users.name,
      })
      .from(announcements)
      .leftJoin(classrooms, eq(announcements.classroomId, classrooms.id))
      .leftJoin(users, eq(announcements.createdBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(announcements.createdAt));

    return NextResponse.json(allAnnouncements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

// POST - Create a new announcement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, priority, classroomId, createdBy } = body;

    if (!title || !content || !createdBy) {
      return NextResponse.json(
        { error: "Title, content, and createdBy are required" },
        { status: 400 }
      );
    }

    const newAnnouncement = await db
      .insert(announcements)
      .values({
        title,
        content,
        priority: priority || "normal",
        classroomId: classroomId || null,
        createdBy,
      })
      .returning();

    return NextResponse.json(newAnnouncement[0], { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}
