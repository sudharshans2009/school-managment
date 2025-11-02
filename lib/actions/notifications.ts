"use server";

import { db } from "@/database";
import { notifications, users, students, classrooms } from "@/database/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type NotificationType =
  | "homework_assigned"
  | "homework_graded"
  | "exam_scheduled"
  | "exam_graded"
  | "attendance_marked"
  | "leave_requested"
  | "leave_approved"
  | "leave_rejected"
  | "substitute_assigned"
  | "announcement_posted"
  | "meeting_scheduled"
  | "event_created"
  | "message_received"
  | "system_alert";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  recipientId: string;
  senderId?: string;
  relatedId?: string;
  relatedType?: string;
  priority?: NotificationPriority;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

interface CreateBulkNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  recipientIds: string[];
  senderId?: string;
  relatedId?: string;
  relatedType?: string;
  priority?: NotificationPriority;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(input: CreateNotificationInput) {
  try {
    const [notification] = await db
      .insert(notifications)
      .values({
        type: input.type,
        title: input.title,
        message: input.message,
        recipientId: input.recipientId,
        senderId: input.senderId || null,
        relatedId: input.relatedId || null,
        relatedType: input.relatedType || null,
        priority: input.priority || "normal",
        actionUrl: input.actionUrl || null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      })
      .returning();

    return { success: true, data: notification };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error: "Failed to create notification" };
  }
}

export async function createBulkNotifications(
  input: CreateBulkNotificationInput
) {
  try {
    const notificationsData = input.recipientIds.map((recipientId) => ({
      type: input.type,
      title: input.title,
      message: input.message,
      recipientId,
      senderId: input.senderId || null,
      relatedId: input.relatedId || null,
      relatedType: input.relatedType || null,
      priority: input.priority || "normal",
      actionUrl: input.actionUrl || null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    }));

    const createdNotifications = await db
      .insert(notifications)
      .values(notificationsData)
      .returning();

    return { success: true, data: createdNotifications };
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    return { success: false, error: "Failed to create bulk notifications" };
  }
}

export async function getNotifications(userId: string, unreadOnly = false) {
  try {
    const conditions = unreadOnly
      ? and(eq(notifications.recipientId, userId), eq(notifications.isRead, false))
      : eq(notifications.recipientId, userId);

    const userNotifications = await db.query.notifications.findMany({
      where: conditions,
      orderBy: [desc(notifications.createdAt)],
      limit: 50,
      with: {
        sender: {
          columns: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return { success: true, data: userNotifications };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, error: "Failed to fetch notifications" };
  }
}

export async function getUnreadCount(userId: string) {
  try {
    const unreadNotifications = await db.query.notifications.findMany({
      where: and(
        eq(notifications.recipientId, userId),
        eq(notifications.isRead, false)
      ),
    });

    return { success: true, data: unreadNotifications.length };
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return { success: false, error: "Failed to fetch unread count" };
  }
}

export async function markAsRead(notificationId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const [updatedNotification] = await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.recipientId, session.user.id)
        )
      )
      .returning();

    if (!updatedNotification) {
      return { success: false, error: "Notification not found" };
    }

    return { success: true, data: updatedNotification };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: "Failed to mark as read" };
  }
}

export async function markAllAsRead(userId: string) {
  try {
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(eq(notifications.recipientId, userId), eq(notifications.isRead, false))
      );

    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, error: "Failed to mark all as read" };
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.recipientId, session.user.id)
        )
      );

    return { success: true };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return { success: false, error: "Failed to delete notification" };
  }
}

// Helper function to get all student user IDs in a classroom
export async function getClassroomStudentUserIds(classroomId: string) {
  try {
    const classroomStudents = await db.query.students.findMany({
      where: eq(students.classroomId, classroomId),
      columns: {
        userId: true,
      },
    });

    return classroomStudents.map((s) => s.userId);
  } catch (error) {
    console.error("Error fetching classroom students:", error);
    return [];
  }
}

// Helper function to get all admin user IDs
export async function getAdminUserIds() {
  try {
    const admins = await db.query.users.findMany({
      where: eq(users.role, "admin"),
      columns: {
        id: true,
      },
    });

    return admins.map((a) => a.id);
  } catch (error) {
    console.error("Error fetching admins:", error);
    return [];
  }
}

// Helper function to get all teacher user IDs
export async function getTeacherUserIds() {
  try {
    const teachers = await db.query.users.findMany({
      where: eq(users.role, "teacher"),
      columns: {
        id: true,
      },
    });

    return teachers.map((t) => t.id);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return [];
  }
}

// Helper function to get class teacher user ID
export async function getClassTeacherUserId(classroomId: string) {
  try {
    const classroom = await db.query.classrooms.findFirst({
      where: eq(classrooms.id, classroomId),
      columns: {
        classTeacherId: true,
      },
    });

    return classroom?.classTeacherId || null;
  } catch (error) {
    console.error("Error fetching class teacher:", error);
    return null;
  }
}
