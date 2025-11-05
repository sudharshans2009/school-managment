import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { circulars, users } from "@/database/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { unauthorized } from "next/navigation";

// GET - Fetch circulars
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const circularType = searchParams.get("circularType");
    const isPublished = searchParams.get("isPublished");

    const conditions = [];

    if (circularType) {
      conditions.push(eq(circulars.circularType, circularType as never));
    }

    if (isPublished !== null) {
      conditions.push(eq(circulars.isPublished, isPublished === "true"));
    }

    const allCirculars = await db
      .select({
        id: circulars.id,
        title: circulars.title,
        content: circulars.content,
        circularType: circulars.circularType,
        circularNumber: circulars.circularNumber,
        targetAudience: circulars.targetAudience,
        attachments: circulars.attachments,
        requiresAcknowledgment: circulars.requiresAcknowledgment,
        expiresAt: circulars.expiresAt,
        createdBy: circulars.createdBy,
        createdByName: users.name,
        publishedAt: circulars.publishedAt,
        isPublished: circulars.isPublished,
        createdAt: circulars.createdAt,
      })
      .from(circulars)
      .leftJoin(users, eq(circulars.createdBy, users.id))
      .orderBy(desc(circulars.createdAt));

    return NextResponse.json(allCirculars);
  } catch (error) {
    console.error("Error fetching circulars:", error);
    return NextResponse.json(
      { error: "Failed to fetch circulars" },
      { status: 500 },
    );
  }
}

// POST - Create a circular (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || session.user.role !== "admin") {
      unauthorized();
    }

    const body = await request.json();
    const {
      title,
      content,
      circularType,
      circularNumber,
      targetAudience,
      attachments,
      requiresAcknowledgment,
      expiresAt,
      isPublished,
    } = body;

    if (!title || !content || !targetAudience) {
      return NextResponse.json(
        { error: "Title, content, and target audience are required" },
        { status: 400 },
      );
    }

    const [circular] = await db
      .insert(circulars)
      .values({
        title,
        content,
        circularType: circularType || "general",
        circularNumber,
        targetAudience: JSON.stringify(targetAudience),
        attachments: attachments ? JSON.stringify(attachments) : null,
        requiresAcknowledgment: requiresAcknowledgment || false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: session.user.id,
        publishedAt: isPublished ? new Date() : null,
        isPublished: isPublished || false,
      })
      .returning();

    return NextResponse.json(circular, { status: 201 });
  } catch (error) {
    console.error("Error creating circular:", error);
    return NextResponse.json(
      { error: "Failed to create circular" },
      { status: 500 },
    );
  }
}
