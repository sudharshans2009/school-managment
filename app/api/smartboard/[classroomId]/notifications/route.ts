import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import {
  announcements,
  homework,
  classroomMessages,
} from "@/database/schema";
import { eq, desc, and, gte } from "drizzle-orm";

// GET - Fetch smartboard notifications for a specific classroom
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classroomId: string }> }
) {
  try {
    const { classroomId } = await params;

    // Calculate time threshold (last 24 hours for recent updates)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Fetch class announcements (class-specific + school-wide)
    const classAnnouncements = await db.query.announcements.findMany({
      where: and(
        eq(announcements.isActive, true),
        gte(announcements.createdAt, oneDayAgo)
      ),
      orderBy: [desc(announcements.createdAt)],
      limit: 5,
      with: {
        creator: {
          columns: {
            name: true,
          },
        },
        event: {
          columns: {
            title: true,
            startDate: true,
          },
        },
      },
    });

    // Filter for this classroom or school-wide
    const relevantAnnouncements = classAnnouncements.filter(
      (ann) => ann.classroomId === classroomId || ann.classroomId === null
    );

    // Fetch recent homework for this classroom
    const recentHomework = await db.query.homework.findMany({
      where: and(
        eq(homework.classroomId, classroomId),
        gte(homework.createdAt, oneDayAgo)
      ),
      orderBy: [desc(homework.createdAt)],
      limit: 5,
      with: {
        subject: {
          columns: {
            name: true,
          },
        },
        teacher: {
          columns: {
            name: true,
          },
        },
      },
    });

    // Fetch recent classroom messages (quotes, reminders)
    const recentMessages = await db.query.classroomMessages.findMany({
      where: and(
        eq(classroomMessages.classroomId, classroomId),
        eq(classroomMessages.isActive, true),
        gte(classroomMessages.createdAt, oneDayAgo)
      ),
      orderBy: [desc(classroomMessages.createdAt)],
      limit: 3,
      with: {
        teacher: {
          columns: {
            name: true,
          },
        },
      },
    });

    // Format response
    const notifications = {
      announcements: relevantAnnouncements.map((ann) => ({
        id: ann.id,
        type: "announcement",
        title: ann.title,
        content: ann.content,
        priority: ann.priority,
        createdBy: ann.creator?.name || "Unknown",
        createdAt: ann.createdAt,
        scope: ann.classroomId ? "class" : "school",
        event: ann.event
          ? {
              title: ann.event.title,
              startDate: ann.event.startDate,
            }
          : null,
      })),
      homework: recentHomework.map((hw) => ({
        id: hw.id,
        type: "homework",
        title: hw.title,
        subject: hw.subject?.name || "Unknown",
        teacher: hw.teacher?.name || "Unknown",
        dueDate: hw.dueDate,
        createdAt: hw.createdAt,
      })),
      messages: recentMessages.map((msg) => ({
        id: msg.id,
        type: msg.messageType,
        content: msg.content,
        teacher: msg.teacher?.name || "Unknown",
        createdAt: msg.createdAt,
      })),
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching smartboard notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
