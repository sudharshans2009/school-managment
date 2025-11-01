import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { admissionDocuments } from "@/database/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

// GET documents for an admission application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: applicationId } = await params;

    const documents = await db
      .select()
      .from(admissionDocuments)
      .where(eq(admissionDocuments.applicationId, applicationId));

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching admission documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch admission documents" },
      { status: 500 },
    );
  }
}

// POST - Upload a document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: applicationId } = await params;
    const body = await request.json();
    const { documentType, documentName, fileUrl } = body;

    if (!documentType || !documentName || !fileUrl) {
      return NextResponse.json(
        { error: "Document type, name, and file URL are required" },
        { status: 400 },
      );
    }

    const [document] = await db
      .insert(admissionDocuments)
      .values({
        applicationId,
        documentType,
        documentName,
        fileUrl,
        status: "submitted",
      })
      .returning();

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 },
    );
  }
}

// PUT - Verify/Reject a document (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: applicationId } = await params;
    const body = await request.json();
    const { documentId, status, rejectionReason } = body;

    if (!documentId || !status) {
      return NextResponse.json(
        { error: "Document ID and status are required" },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {
      status,
      verifiedBy: session.user.id,
      verifiedAt: new Date(),
    };

    if (status === "rejected" && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const [updatedDocument] = await db
      .update(admissionDocuments)
      .set(updateData)
      .where(eq(admissionDocuments.id, documentId))
      .returning();

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error("Error verifying document:", error);
    return NextResponse.json(
      { error: "Failed to verify document" },
      { status: 500 },
    );
  }
}
