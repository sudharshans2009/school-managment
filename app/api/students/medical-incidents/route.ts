import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { medicalIncidents } from "@/database/schema";
import { auth } from "@/lib/auth/main";
import { auditResourceAccess } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      studentId,
      incidentDate,
      incidentType,
      description,
      treatment,
      severity,
      followUpRequired,
      followUpNotes,
      parentNotified,
    } = body;

    // Verify student exists
    const studentExists = await db.query.students.findFirst({
      where: (students, { eq }) => eq(students.id, studentId),
    });

    if (!studentExists) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const [incident] = await db
      .insert(medicalIncidents)
      .values({
        studentId,
        incidentDate: new Date(incidentDate),
        incidentType,
        description,
        treatment: treatment || null,
        severity,
        reportedBy: session.user.id,
        followUpRequired: followUpRequired || false,
        followUpNotes: followUpNotes || null,
        parentNotified: parentNotified || false,
      })
      .returning();

    // Audit log
    await auditResourceAccess(
      session.user.id,
      session.user.email,
      session.user.role,
      "create",
      "medical_incident",
      incident.id,
      `Created medical incident for student ${studentId}`,
      { incidentType, severity },
      request,
    );

    return NextResponse.json(incident);
  } catch (error) {
    console.error("Error creating medical incident:", error);
    return NextResponse.json(
      { error: "Failed to create medical incident" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !["admin", "teacher"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID required" },
        { status: 400 },
      );
    }

    const incidents = await db.query.medicalIncidents.findMany({
      where: (medicalIncidents, { eq }) =>
        eq(medicalIncidents.studentId, studentId),
      with: {
        reporter: {
          columns: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: (medicalIncidents, { desc }) => [
        desc(medicalIncidents.incidentDate),
      ],
    });

    return NextResponse.json(incidents);
  } catch (error) {
    console.error("Error fetching medical incidents:", error);
    return NextResponse.json(
      { error: "Failed to fetch medical incidents" },
      { status: 500 },
    );
  }
}
