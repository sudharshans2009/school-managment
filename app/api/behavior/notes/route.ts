import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { behaviorNotes, users } from "@/database/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

// GET - Fetch behavior notes
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("studentId");
    const noteType = searchParams.get("noteType");

    const conditions = [];

    if (studentId) {
      conditions.push(eq(behaviorNotes.studentId, studentId));
    }

    if (noteType) {
      conditions.push(eq(behaviorNotes.noteType, noteType));
    }

    // Filter private notes based on role
    if (session.user.role === "parent") {
      conditions.push(eq(behaviorNotes.isPrivate, false));
    }

    const notes = await db
      .select({
        id: behaviorNotes.id,
        studentId: behaviorNotes.studentId,
        noteType: behaviorNotes.noteType,
        content: behaviorNotes.content,
        isPrivate: behaviorNotes.isPrivate,
        createdBy: behaviorNotes.createdBy,
        creatorName: users.name,
        createdAt: behaviorNotes.createdAt,
      })
      .from(behaviorNotes)
      .leftJoin(users, eq(behaviorNotes.createdBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(behaviorNotes.createdAt));

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching behavior notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch behavior notes" },
      { status: 500 },
    );
  }
}

// POST - Create behavior note (teacher/admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || !["admin", "teacher"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, noteType, content, isPrivate } = body;

    if (!studentId || !noteType || !content) {
      return NextResponse.json(
        { error: "Student ID, note type, and content are required" },
        { status: 400 },
      );
    }

    const [note] = await db
      .insert(behaviorNotes)
      .values({
        studentId,
        noteType,
        content,
        isPrivate: isPrivate || false,
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Error creating behavior note:", error);
    return NextResponse.json(
      { error: "Failed to create behavior note" },
      { status: 500 },
    );
  }
}
