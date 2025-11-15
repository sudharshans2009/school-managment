import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { behaviorIncidents } from "@/database/schema";
import { auth } from "@/lib/auth/main";
import { auditResourceAccess } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !["admin", "teacher"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      studentId,
      incidentDate,
      actionType,
      severity,
      description,
      actionTaken,
      witnessesOrInvolved,
      parentNotified,
      parentMeetingRequired,
      parentMeetingDate,
      resolutionNotes,
    } = body;

    // Verify student exists
    const studentExists = await db.query.students.findFirst({
      where: (students, { eq }) => eq(students.id, studentId),
    });

    if (!studentExists) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Map severity from form to database enum
    const severityMap: Record<
      string,
      "minor" | "moderate" | "major" | "critical"
    > = {
      Minor: "minor",
      Moderate: "moderate",
      Severe: "major",
    };

    // Create behavior incident record
    const [incident] = await db
      .insert(behaviorIncidents)
      .values({
        studentId,
        incidentDate: new Date(incidentDate),
        incidentType: actionType,
        severity: severityMap[severity] || "minor",
        description: `${description}\n\nAction Taken: ${actionTaken}${witnessesOrInvolved ? `\n\nWitnesses/Involved: ${witnessesOrInvolved}` : ""}${resolutionNotes ? `\n\nResolution: ${resolutionNotes}` : ""}`,
        location: "School",
        reportedBy: session.user.id,
        witnessNames: witnessesOrInvolved || null,
        parentNotified: parentNotified || false,
        parentNotifiedAt: parentNotified ? new Date() : null,
        actionTaken: actionTaken,
        followUpRequired: parentMeetingRequired || false,
        followUpNotes: parentMeetingDate
          ? `Parent meeting scheduled for ${new Date(parentMeetingDate).toLocaleString()}`
          : resolutionNotes || null,
      })
      .returning();

    // Audit log
    await auditResourceAccess(
      session.user.id,
      session.user.email,
      session.user.role,
      "create",
      "disciplinary_action",
      incident.id,
      `Created disciplinary action for student ${studentId}`,
      { actionType, severity },
      request,
    );

    return NextResponse.json(incident);
  } catch (error) {
    console.error("Error creating disciplinary action:", error);
    return NextResponse.json(
      { error: "Failed to create disciplinary action" },
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

    const incidents = await db.query.behaviorIncidents.findMany({
      where: (behaviorIncidents, { eq }) =>
        eq(behaviorIncidents.studentId, studentId),
      with: {
        reporter: {
          columns: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: (behaviorIncidents, { desc }) => [
        desc(behaviorIncidents.incidentDate),
      ],
    });

    return NextResponse.json(incidents);
  } catch (error) {
    console.error("Error fetching disciplinary actions:", error);
    return NextResponse.json(
      { error: "Failed to fetch disciplinary actions" },
      { status: 500 },
    );
  }
}
