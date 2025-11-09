import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { teacherLeaves, users } from "@/database/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import {
  createBulkNotifications,
  getAdminUserIds,
} from "@/actions/notifications";

// GET - Fetch teacher leaves
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const teacherId = searchParams.get("teacherId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const conditions = [];

    if (teacherId) {
      conditions.push(eq(teacherLeaves.teacherId, teacherId));
    }

    if (status) {
      conditions.push(
        eq(
          teacherLeaves.status,
          status as "pending" | "approved" | "rejected" | "cancelled",
        ),
      );
    }

    if (startDate) {
      conditions.push(gte(teacherLeaves.startDate, startDate));
    }

    if (endDate) {
      conditions.push(lte(teacherLeaves.endDate, endDate));
    }

    const leaves = await db
      .select({
        id: teacherLeaves.id,
        teacherId: teacherLeaves.teacherId,
        leaveType: teacherLeaves.leaveType,
        startDate: teacherLeaves.startDate,
        endDate: teacherLeaves.endDate,
        reason: teacherLeaves.reason,
        status: teacherLeaves.status,
        approvedBy: teacherLeaves.approvedBy,
        approvalNotes: teacherLeaves.approvalNotes,
        approvedAt: teacherLeaves.approvedAt,
        createdAt: teacherLeaves.createdAt,
        updatedAt: teacherLeaves.updatedAt,
        teacherName: users.name,
        teacherEmail: users.email,
      })
      .from(teacherLeaves)
      .leftJoin(users, eq(teacherLeaves.teacherId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(teacherLeaves.createdAt));

    return NextResponse.json(leaves);
  } catch (error) {
    console.error("Error fetching teacher leaves:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher leaves" },
      { status: 500 },
    );
  }
}

// POST - Create new leave request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacherId, leaveType, startDate, endDate, reason } = body;

    // Validation
    if (!teacherId || !leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return NextResponse.json(
        { error: "Start date cannot be after end date" },
        { status: 400 },
      );
    }

    // Create leave request
    const newLeave = await db
      .insert(teacherLeaves)
      .values({
        teacherId,
        leaveType,
        startDate,
        endDate,
        reason,
        status: "pending",
      })
      .returning();

    // Notify all admins about the leave request
    const adminIds = await getAdminUserIds();

    if (adminIds.length > 0) {
      // Get teacher name
      const teacher = await db.query.users.findFirst({
        where: eq(users.id, teacherId),
      });

      await createBulkNotifications({
        type: "leave_requested",
        title: "Leave Request Pending",
        message: `${teacher?.name || "A teacher"} requested ${leaveType} leave from ${startDate} to ${endDate}`,
        recipientIds: adminIds,
        senderId: teacherId,
        relatedId: newLeave[0].id,
        relatedType: "leave",
        priority: "high",
        actionUrl: `/admin/leaves`,
      });
    }

    return NextResponse.json(newLeave[0], { status: 201 });
  } catch (error) {
    console.error("Error creating leave request:", error);
    return NextResponse.json(
      { error: "Failed to create leave request" },
      { status: 500 },
    );
  }
}
