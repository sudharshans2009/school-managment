import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { behaviorIncidents, users } from "@/database/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { unauthorized } from "next/navigation";

// GET - Fetch behavior incidents
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      unauthorized();
    }

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("studentId");
    const severity = searchParams.get("severity");

    const conditions = [];

    if (studentId) {
      conditions.push(eq(behaviorIncidents.studentId, studentId));
    }

    if (severity) {
      conditions.push(eq(behaviorIncidents.severity, severity as never));
    }

    const incidents = await db
      .select({
        id: behaviorIncidents.id,
        studentId: behaviorIncidents.studentId,
        reportedBy: behaviorIncidents.reportedBy,
        reporterName: users.name,
        incidentDate: behaviorIncidents.incidentDate,
        incidentType: behaviorIncidents.incidentType,
        severity: behaviorIncidents.severity,
        location: behaviorIncidents.location,
        description: behaviorIncidents.description,
        witnessNames: behaviorIncidents.witnessNames,
        actionTaken: behaviorIncidents.actionTaken,
        parentNotified: behaviorIncidents.parentNotified,
        parentNotifiedAt: behaviorIncidents.parentNotifiedAt,
        followUpRequired: behaviorIncidents.followUpRequired,
        followUpNotes: behaviorIncidents.followUpNotes,
        createdAt: behaviorIncidents.createdAt,
      })
      .from(behaviorIncidents)
      .leftJoin(users, eq(behaviorIncidents.reportedBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(behaviorIncidents.incidentDate));

    return NextResponse.json(incidents);
  } catch (error) {
    console.error("Error fetching behavior incidents:", error);
    return NextResponse.json(
      { error: "Failed to fetch behavior incidents" },
      { status: 500 },
    );
  }
}

// POST - Create behavior incident (teacher/admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || !["admin", "teacher"].includes(session.user.role)) {
      unauthorized();
    }

    const body = await request.json();
    const {
      studentId,
      incidentDate,
      incidentType,
      severity,
      location,
      description,
      witnessNames,
      actionTaken,
      parentNotified,
      followUpRequired,
      followUpNotes,
    } = body;

    if (
      !studentId ||
      !incidentDate ||
      !incidentType ||
      !severity ||
      !description
    ) {
      return NextResponse.json(
        {
          error:
            "Student ID, incident date, type, severity, and description are required",
        },
        { status: 400 },
      );
    }

    const [incident] = await db
      .insert(behaviorIncidents)
      .values({
        studentId,
        reportedBy: session.user.id,
        incidentDate: new Date(incidentDate),
        incidentType,
        severity,
        location,
        description,
        witnessNames,
        actionTaken,
        parentNotified: parentNotified || false,
        parentNotifiedAt: parentNotified ? new Date() : null,
        followUpRequired: followUpRequired || false,
        followUpNotes,
      })
      .returning();

    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    console.error("Error creating behavior incident:", error);
    return NextResponse.json(
      { error: "Failed to create behavior incident" },
      { status: 500 },
    );
  }
}
