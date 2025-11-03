import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { teacherLeaves } from "@/database/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teacherId } = await params;

    // Get leave records for the teacher
    const leaveRecords = await db
      .select({
        leaveType: teacherLeaves.leaveType,
        status: teacherLeaves.status,
      })
      .from(teacherLeaves)
      .where(eq(teacherLeaves.teacherId, teacherId));

    const totalLeaves = leaveRecords.filter(
      (r) => r.status === "approved"
    ).length;
    const sickLeaves = leaveRecords.filter(
      (r) => r.leaveType === "sick" && r.status === "approved"
    ).length;
    const casualLeaves = leaveRecords.filter(
      (r) => r.leaveType === "casual" && r.status === "approved"
    ).length;
    const earnedLeaves = leaveRecords.filter(
      (r) => r.leaveType === "earned" && r.status === "approved"
    ).length;
    const pendingLeaves = leaveRecords.filter(
      (r) => r.status === "pending"
    ).length;

    return NextResponse.json({
      totalLeaves,
      sickLeaves,
      casualLeaves,
      earnedLeaves,
      pendingLeaves,
    });
  } catch (error) {
    console.error("Error fetching leave stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch leave stats" },
      { status: 500 }
    );
  }
}
