import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { admissionApplications } from "@/database/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/main";

// GET single admission application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const application = await db.query.admissionApplications.findFirst({
      where: eq(admissionApplications.id, id),
      with: {
        entranceTest: true,
        documents: true,
        reviewer: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error fetching admission application:", error);
    return NextResponse.json(
      { error: "Failed to fetch admission application" },
      { status: 500 },
    );
  }
}

// PUT update admission application
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      status,
      entranceTestId,
      testScore,
      interviewDate,
      admissionDate,
      rejectionReason,
      notes,
    } = body;

    const existingApplication = await db.query.admissionApplications.findFirst({
      where: eq(admissionApplications.id, id),
    });

    if (!existingApplication) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
    };

    if (status) updateData.status = status;
    if (entranceTestId !== undefined)
      updateData.entranceTestId = entranceTestId;
    if (testScore !== undefined) updateData.testScore = testScore;
    if (interviewDate !== undefined)
      updateData.interviewDate = interviewDate ? new Date(interviewDate) : null;
    if (admissionDate !== undefined)
      updateData.admissionDate = admissionDate ? new Date(admissionDate) : null;
    if (rejectionReason !== undefined)
      updateData.rejectionReason = rejectionReason;
    if (notes !== undefined) updateData.notes = notes;

    const [updatedApplication] = await db
      .update(admissionApplications)
      .set(updateData)
      .where(eq(admissionApplications.id, id))
      .returning();

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error("Error updating admission application:", error);
    return NextResponse.json(
      { error: "Failed to update admission application" },
      { status: 500 },
    );
  }
}
