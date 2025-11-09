import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import {
  substituteAssignments,
  users,
  classrooms,
  subjects,
} from "@/database/schema";
import { eq, and, desc } from "drizzle-orm";
import { createNotification } from "@/actions/notifications";

// GET - Fetch substitute assignments
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const teacherId = searchParams.get("teacherId"); // Can be original or substitute teacher
    const classroomId = searchParams.get("classroomId");
    const substituteTeacherId = searchParams.get("substituteTeacherId");

    const conditions = [];

    if (date) {
      conditions.push(eq(substituteAssignments.date, date));
    }

    if (teacherId) {
      // This will be handled with OR logic below
    }

    if (classroomId) {
      conditions.push(eq(substituteAssignments.classroomId, classroomId));
    }

    if (substituteTeacherId) {
      conditions.push(
        eq(substituteAssignments.substituteTeacherId, substituteTeacherId),
      );
    }

    let query = db
      .select({
        id: substituteAssignments.id,
        leaveId: substituteAssignments.leaveId,
        originalTeacherId: substituteAssignments.originalTeacherId,
        substituteTeacherId: substituteAssignments.substituteTeacherId,
        classroomId: substituteAssignments.classroomId,
        subjectId: substituteAssignments.subjectId,
        date: substituteAssignments.date,
        periodNumber: substituteAssignments.periodNumber,
        startTime: substituteAssignments.startTime,
        endTime: substituteAssignments.endTime,
        reason: substituteAssignments.reason,
        assignedBy: substituteAssignments.assignedBy,
        createdAt: substituteAssignments.createdAt,
        updatedAt: substituteAssignments.updatedAt,
        originalTeacherName: users.name,
        classroomName: classrooms.name,
        classroomGrade: classrooms.grade,
        classroomSection: classrooms.section,
        subjectName: subjects.name,
        subjectCode: subjects.code,
      })
      .from(substituteAssignments)
      .leftJoin(users, eq(substituteAssignments.originalTeacherId, users.id))
      .leftJoin(
        classrooms,
        eq(substituteAssignments.classroomId, classrooms.id),
      )
      .leftJoin(subjects, eq(substituteAssignments.subjectId, subjects.id))
      .$dynamic();

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const assignments = await query.orderBy(desc(substituteAssignments.date));

    // If teacherId is provided, filter for assignments where the teacher is either original or substitute
    if (teacherId) {
      return NextResponse.json(
        assignments.filter(
          (a) =>
            a.originalTeacherId === teacherId ||
            a.substituteTeacherId === teacherId,
        ),
      );
    }

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching substitute assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch substitute assignments" },
      { status: 500 },
    );
  }
}

// POST - Create substitute assignment (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      leaveId,
      originalTeacherId,
      substituteTeacherId,
      classroomId,
      subjectId,
      date,
      periodNumber,
      startTime,
      endTime,
      reason,
      assignedBy,
    } = body;

    // Validation
    if (
      !originalTeacherId ||
      !substituteTeacherId ||
      !classroomId ||
      !subjectId ||
      !date ||
      !periodNumber ||
      !startTime ||
      !endTime ||
      !assignedBy
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 },
      );
    }

    // Create substitute assignment
    const newAssignment = await db
      .insert(substituteAssignments)
      .values({
        leaveId: leaveId || null,
        originalTeacherId,
        substituteTeacherId,
        classroomId,
        subjectId,
        date,
        periodNumber,
        startTime,
        endTime,
        reason: reason || null,
        assignedBy,
      })
      .returning();

    // Notify the substitute teacher
    const classroom = await db.query.classrooms.findFirst({
      where: eq(classrooms.id, classroomId),
    });

    const subject = await db.query.subjects.findFirst({
      where: eq(subjects.id, subjectId),
    });

    await createNotification({
      type: "substitute_assigned",
      title: "Substitute Assignment",
      message: `You have been assigned as a substitute teacher for ${subject?.name || "a class"} in ${classroom?.name || "a classroom"} on ${date} during Period ${periodNumber} (${startTime} - ${endTime})`,
      recipientId: substituteTeacherId,
      senderId: assignedBy,
      relatedId: newAssignment[0].id,
      relatedType: "substitute",
      priority: "high",
      actionUrl: `/teacher`,
    });

    return NextResponse.json(newAssignment[0], { status: 201 });
  } catch (error) {
    console.error("Error creating substitute assignment:", error);
    return NextResponse.json(
      { error: "Failed to create substitute assignment" },
      { status: 500 },
    );
  }
}
