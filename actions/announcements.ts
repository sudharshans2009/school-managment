"use server";

import { db } from "@/database";
import { announcements, classrooms, users, events } from "@/database/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth/main";
import { headers } from "next/headers";
import {
  createBulkNotifications,
  getAdminUserIds,
  getTeacherUserIds,
  getClassroomStudentUserIds,
  getClassTeacherUserId,
} from "@/actions/notifications";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  classroomId: string | null;
  eventId: string | null;
  createdBy: string;
  createdAt: Date | null;
  classroomName: string | null;
  createdByName: string | null;
  eventTitle: string | null;
}

export async function getAnnouncements(classroomId?: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

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

    return { success: true, data: allAnnouncements };
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return { success: false, error: "Failed to fetch announcements" };
  }
}

export async function createAnnouncement(data: {
  title: string;
  content: string;
  priority: string;
  classroomId: string | null;
  createdBy: string;
  eventId?: string | null;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const { title, content, priority, classroomId, eventId, createdBy } = data;

    if (!title || !content || !createdBy) {
      return {
        success: false,
        error: "Title, content, and createdBy are required",
      };
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

    return { success: true, data: newAnnouncement[0] };
  } catch (error) {
    console.error("Error creating announcement:", error);
    return { success: false, error: "Failed to create announcement" };
  }
}

export async function updateAnnouncement(
  id: string,
  data: {
    title: string;
    content: string;
    priority: string;
    classroomId: string | null;
  },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const { title, content, priority, classroomId } = data;

    if (!title || !content) {
      return { success: false, error: "Title and content are required" };
    }

    const updated = await db
      .update(announcements)
      .set({
        title,
        content,
        priority: priority || "normal",
        classroomId: classroomId || null,
      })
      .where(eq(announcements.id, id))
      .returning();

    if (updated.length === 0) {
      return { success: false, error: "Announcement not found" };
    }

    return { success: true, data: updated[0] };
  } catch (error) {
    console.error("Error updating announcement:", error);
    return { success: false, error: "Failed to update announcement" };
  }
}

export async function deleteAnnouncement(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const deleted = await db
      .delete(announcements)
      .where(eq(announcements.id, id))
      .returning();

    if (deleted.length === 0) {
      return { success: false, error: "Announcement not found" };
    }

    return { success: true, data: deleted[0] };
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return { success: false, error: "Failed to delete announcement" };
  }
}

export async function getClassrooms() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const allClassrooms = await db
      .select({
        id: classrooms.id,
        name: classrooms.name,
      })
      .from(classrooms);

    return { success: true, data: allClassrooms };
  } catch (error) {
    console.error("Error fetching classrooms:", error);
    return { success: false, error: "Failed to fetch classrooms" };
  }
}
