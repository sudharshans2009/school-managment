import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { disciplinaryActions, users } from "@/database/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { unauthorized } from "next/navigation";

// GET - Fetch disciplinary actions
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      unauthorized();
    }

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("studentId");
    const incidentId = searchParams.get("incidentId");
    const status = searchParams.get("status");

    const conditions = [];

    if (studentId) {
      conditions.push(eq(disciplinaryActions.studentId, studentId));
    }

    if (incidentId) {
      conditions.push(eq(disciplinaryActions.incidentId, incidentId));
    }

    if (status) {
      conditions.push(eq(disciplinaryActions.status, status));
    }

    const actions = await db
      .select({
        id: disciplinaryActions.id,
        incidentId: disciplinaryActions.incidentId,
        studentId: disciplinaryActions.studentId,
        actionType: disciplinaryActions.actionType,
        description: disciplinaryActions.description,
        startDate: disciplinaryActions.startDate,
        endDate: disciplinaryActions.endDate,
        assignedBy: disciplinaryActions.assignedBy,
        assignerName: users.name,
        status: disciplinaryActions.status,
        completedAt: disciplinaryActions.completedAt,
        notes: disciplinaryActions.notes,
        createdAt: disciplinaryActions.createdAt,
      })
      .from(disciplinaryActions)
      .leftJoin(users, eq(disciplinaryActions.assignedBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(disciplinaryActions.createdAt));

    return NextResponse.json(actions);
  } catch (error) {
    console.error("Error fetching disciplinary actions:", error);
    return NextResponse.json(
      { error: "Failed to fetch disciplinary actions" },
      { status: 500 },
    );
  }
}

// POST - Create disciplinary action (teacher/admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || !["admin", "teacher"].includes(session.user.role)) {
      unauthorized();
    }

    const body = await request.json();
    const {
      incidentId,
      studentId,
      actionType,
      description,
      startDate,
      endDate,
      notes,
    } = body;

    if (!studentId || !actionType || !description || !startDate) {
      return NextResponse.json(
        {
          error:
            "Student ID, action type, description, and start date are required",
        },
        { status: 400 },
      );
    }

    const [action] = await db
      .insert(disciplinaryActions)
      .values({
        incidentId: incidentId || null,
        studentId,
        actionType,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        assignedBy: session.user.id,
        status: "active",
        notes,
      })
      .returning();

    return NextResponse.json(action, { status: 201 });
  } catch (error) {
    console.error("Error creating disciplinary action:", error);
    return NextResponse.json(
      { error: "Failed to create disciplinary action" },
      { status: 500 },
    );
  }
}
