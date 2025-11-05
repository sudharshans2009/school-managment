import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { exams } from "@/database/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { notFound, unauthorized } from "next/navigation";

// PUT /api/exams/[id]/finalize - Toggle finalization status (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || session.user.role !== "admin") {
      unauthorized();
    }

    const { id } = await params;
    const body = await request.json();
    const { isFinalized } = body;

    if (typeof isFinalized !== "boolean") {
      return NextResponse.json(
        { error: "isFinalized must be a boolean" },
        { status: 400 },
      );
    }

    const [updatedExam] = await db
      .update(exams)
      .set({
        isFinalized,
        finalizedBy: isFinalized ? session.user.id : null,
        finalizedAt: isFinalized ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(exams.id, id))
      .returning();

    if (!updatedExam) {
      notFound();
    }

    return NextResponse.json(updatedExam);
  } catch (error) {
    console.error("Error finalizing exam:", error);
    return NextResponse.json(
      { error: "Failed to finalize exam" },
      { status: 500 },
    );
  }
}
