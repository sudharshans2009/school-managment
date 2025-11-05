import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { circulars, circularAcknowledgments } from "@/database/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { notFound, unauthorized } from "next/navigation";

// GET single circular
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const circular = await db.query.circulars.findFirst({
      where: eq(circulars.id, id),
      with: {
        creator: true,
        acknowledgments: {
          with: {
            user: true,
          },
        },
      },
    });

    if (!circular) {
      notFound();
    }

    return NextResponse.json(circular);
  } catch (error) {
    console.error("Error fetching circular:", error);
    return NextResponse.json(
      { error: "Failed to fetch circular" },
      { status: 500 },
    );
  }
}

// PUT update circular (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || session.user.role !== "admin") {
      unauthorized();
    }

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      content,
      circularType,
      targetAudience,
      attachments,
      requiresAcknowledgment,
      expiresAt,
      isPublished,
    } = body;

    const existingCircular = await db.query.circulars.findFirst({
      where: eq(circulars.id, id),
    });

    if (!existingCircular) {
      notFound();
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (circularType) updateData.circularType = circularType;
    if (targetAudience !== undefined)
      updateData.targetAudience = JSON.stringify(targetAudience);
    if (attachments !== undefined)
      updateData.attachments = attachments ? JSON.stringify(attachments) : null;
    if (requiresAcknowledgment !== undefined)
      updateData.requiresAcknowledgment = requiresAcknowledgment;
    if (expiresAt !== undefined)
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (isPublished !== undefined) {
      updateData.isPublished = isPublished;
      if (isPublished && !existingCircular.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const [updatedCircular] = await db
      .update(circulars)
      .set(updateData)
      .where(eq(circulars.id, id))
      .returning();

    return NextResponse.json(updatedCircular);
  } catch (error) {
    console.error("Error updating circular:", error);
    return NextResponse.json(
      { error: "Failed to update circular" },
      { status: 500 },
    );
  }
}

// POST acknowledge circular
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      unauthorized();
    }

    const { id: circularId } = await params;
    const body = await request.json();
    const { notes } = body;

    const circular = await db.query.circulars.findFirst({
      where: eq(circulars.id, circularId),
    });

    if (!circular) {
      notFound();
    }

    if (!circular.requiresAcknowledgment) {
      return NextResponse.json(
        { error: "This circular does not require acknowledgment" },
        { status: 400 },
      );
    }

    // Check if already acknowledged by this user
    const existingAck = await db
      .select()
      .from(circularAcknowledgments)
      .where(
        and(
          eq(circularAcknowledgments.circularId, circularId),
          eq(circularAcknowledgments.userId, session.user.id),
        ),
      );

    if (existingAck.length > 0) {
      return NextResponse.json(
        { error: "Already acknowledged" },
        { status: 400 },
      );
    }

    const [acknowledgment] = await db
      .insert(circularAcknowledgments)
      .values({
        circularId,
        userId: session.user.id,
        notes,
      })
      .returning();

    return NextResponse.json(acknowledgment, { status: 201 });
  } catch (error) {
    console.error("Error acknowledging circular:", error);
    return NextResponse.json(
      { error: "Failed to acknowledge circular" },
      { status: 500 },
    );
  }
}
