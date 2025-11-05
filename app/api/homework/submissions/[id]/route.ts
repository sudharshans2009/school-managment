import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { homeworkSubmissions, homework } from "@/database/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { forbidden, notFound, unauthorized } from "next/navigation";

// PUT - Grade/update homework submission
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user || session.user.role !== "teacher") {
      unauthorized();
    }

    const { id: submissionId } = await params;
    const body = await req.json();
    const { marksObtained, feedback, status } = body;

    // Fetch submission with homework details
    const submission = await db
      .select({
        submissionId: homeworkSubmissions.id,
        homeworkId: homeworkSubmissions.homeworkId,
        teacherId: homework.teacherId,
      })
      .from(homeworkSubmissions)
      .innerJoin(homework, eq(homeworkSubmissions.homeworkId, homework.id))
      .where(eq(homeworkSubmissions.id, submissionId))
      .limit(1);

    if (submission.length === 0) {
      notFound();
    }

    // Verify teacher has permission
    if (submission[0].teacherId !== session.user.id) {
      forbidden();
    }

    // Update submission
    const [updated] = await db
      .update(homeworkSubmissions)
      .set({
        marksObtained: marksObtained !== undefined ? marksObtained : undefined,
        feedback: feedback !== undefined ? feedback : undefined,
        status: status || "graded",
        gradedAt: new Date(),
        gradedBy: session.user.id,
      })
      .where(eq(homeworkSubmissions.id, submissionId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 },
    );
  }
}

// DELETE - Remove homework submission
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user || session.user.role !== "teacher") {
      unauthorized();
    }

    const { id: submissionId } = await params;

    // Fetch submission with homework details
    const submission = await db
      .select({
        submissionId: homeworkSubmissions.id,
        homeworkId: homeworkSubmissions.homeworkId,
        teacherId: homework.teacherId,
      })
      .from(homeworkSubmissions)
      .innerJoin(homework, eq(homeworkSubmissions.homeworkId, homework.id))
      .where(eq(homeworkSubmissions.id, submissionId))
      .limit(1);

    if (submission.length === 0) {
      notFound();
    }

    // Verify teacher has permission
    if (submission[0].teacherId !== session.user.id) {
      forbidden();
    }

    await db
      .delete(homeworkSubmissions)
      .where(eq(homeworkSubmissions.id, submissionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting submission:", error);
    return NextResponse.json(
      { error: "Failed to delete submission" },
      { status: 500 },
    );
  }
}
