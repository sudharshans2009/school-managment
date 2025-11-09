import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { announcements, classrooms, users, events } from "@/database/schema";
import { eq, desc, and } from "drizzle-orm";
import {
  createBulkNotifications,
  getAdminUserIds,
  getTeacherUserIds,
  getClassroomStudentUserIds,
  getClassTeacherUserId,
} from "@/actions/notifications";

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
        eventId: announcements.eventId,
        createdBy: announcements.createdBy,
        createdAt: announcements.createdAt,
        classroomName: classrooms.name,
        createdByName: users.name,
        eventTitle: events.title,
      })
      .from(announcements)
      .leftJoin(classrooms, eq(announcements.classroomId, classrooms.id))
      .leftJoin(users, eq(announcements.createdBy, users.id))
      .leftJoin(events, eq(announcements.eventId, events.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(announcements.createdAt));

    return NextResponse.json(allAnnouncements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 },
    );
  }
}

// POST - Create a new announcement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, priority, classroomId, eventId, createdBy } = body;

    if (!title || !content || !createdBy) {
      return NextResponse.json(
        { error: "Title, content, and createdBy are required" },
        { status: 400 },
      );
    }

    const newAnnouncement = await db
      .insert(announcements)
      .values({
        title,
        content,
        priority: priority || "normal",
        classroomId: classroomId || null,
        eventId: eventId || null,
        createdBy,
      })
      .returning();

    // Send notifications based on announcement scope
    let recipientIds: string[] = [];

    if (classroomId) {
      // Class announcement: Notify students in the classroom + class teacher
      const studentIds = await getClassroomStudentUserIds(classroomId);
      const classTeacherId = await getClassTeacherUserId(classroomId);
      recipientIds = [...studentIds];
      if (classTeacherId && classTeacherId !== createdBy) {
        recipientIds.push(classTeacherId);
      }
    } else {
      // School-wide announcement: Notify all admins, teachers, and students
      const adminIds = await getAdminUserIds();
      const teacherIds = await getTeacherUserIds();
      // For school-wide, we might want to limit to just staff
      recipientIds = [...new Set([...adminIds, ...teacherIds])];
    }

    // Remove the sender from recipients
    recipientIds = recipientIds.filter((id) => id !== createdBy);

    if (recipientIds.length > 0) {
      await createBulkNotifications({
        type: "announcement_posted",
        title: classroomId
          ? `Class Announcement: ${title}`
          : `School Announcement: ${title}`,
        message:
          content.substring(0, 150) + (content.length > 150 ? "..." : ""),
        recipientIds,
        senderId: createdBy,
        relatedId: newAnnouncement[0].id,
        relatedType: "announcement",
        priority: priority === "urgent" ? "urgent" : "normal",
        actionUrl: classroomId ? `/teacher/classes` : `/admin/announcements`,
      });
    }

    return NextResponse.json(newAnnouncement[0], { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 },
    );
  }
}
