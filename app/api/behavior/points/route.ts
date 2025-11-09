import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { behaviorPoints, users } from "@/database/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth/main";

// GET - Fetch behavior points
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("studentId");
    const pointType = searchParams.get("pointType");

    const conditions = [];

    if (studentId) {
      conditions.push(eq(behaviorPoints.studentId, studentId));
    }

    if (pointType) {
      conditions.push(eq(behaviorPoints.pointType, pointType));
    }

    const points = await db
      .select({
        id: behaviorPoints.id,
        studentId: behaviorPoints.studentId,
        pointType: behaviorPoints.pointType,
        points: behaviorPoints.points,
        reason: behaviorPoints.reason,
        category: behaviorPoints.category,
        awardedBy: behaviorPoints.awardedBy,
        awarderName: users.name,
        awardedDate: behaviorPoints.awardedDate,
        incidentId: behaviorPoints.incidentId,
        notes: behaviorPoints.notes,
        createdAt: behaviorPoints.createdAt,
      })
      .from(behaviorPoints)
      .leftJoin(users, eq(behaviorPoints.awardedBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(behaviorPoints.awardedDate));

    return NextResponse.json(points);
  } catch (error) {
    console.error("Error fetching behavior points:", error);
    return NextResponse.json(
      { error: "Failed to fetch behavior points" },
      { status: 500 },
    );
  }
}

// POST - Award behavior points (teacher/admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || !["admin", "teacher"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      studentId,
      pointType,
      points,
      reason,
      category,
      incidentId,
      notes,
    } = body;

    if (!studentId || !pointType || !points || !reason) {
      return NextResponse.json(
        { error: "Student ID, point type, points, and reason are required" },
        { status: 400 },
      );
    }

    if (!["merit", "demerit"].includes(pointType)) {
      return NextResponse.json(
        { error: "Point type must be either 'merit' or 'demerit'" },
        { status: 400 },
      );
    }

    const [behaviorPoint] = await db
      .insert(behaviorPoints)
      .values({
        studentId,
        pointType,
        points: Number(points),
        reason,
        category,
        awardedBy: session.user.id,
        awardedDate: new Date(),
        incidentId,
        notes,
      })
      .returning();

    return NextResponse.json(behaviorPoint, { status: 201 });
  } catch (error) {
    console.error("Error awarding behavior points:", error);
    return NextResponse.json(
      { error: "Failed to award behavior points" },
      { status: 500 },
    );
  }
}
