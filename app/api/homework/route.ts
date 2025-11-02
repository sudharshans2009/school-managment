import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { homework, classrooms, subjects, users } from "@/database/schema";
import { eq, desc } from "drizzle-orm";
import {
  createBulkNotifications,
  getClassroomStudentUserIds,
} from "@/lib/actions/notifications";

// GET - Fetch homework
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const classroomId = searchParams.get("classroomId");

    let homeworkList;

    if (classroomId) {
      homeworkList = await db
        .select({
          id: homework.id,
          title: homework.title,
          description: homework.description,
          classroomId: homework.classroomId,
          subjectId: homework.subjectId,
          teacherId: homework.teacherId,
          assignedDate: homework.assignedDate,
          dueDate: homework.dueDate,
          totalMarks: homework.totalMarks,
          status: homework.status,
          createdAt: homework.createdAt,
          className: classrooms.name,
          subjectName: subjects.name,
          teacherName: users.name,
        })
        .from(homework)
        .leftJoin(classrooms, eq(homework.classroomId, classrooms.id))
        .leftJoin(subjects, eq(homework.subjectId, subjects.id))
        .leftJoin(users, eq(homework.teacherId, users.id))
        .where(eq(homework.classroomId, classroomId))
        .orderBy(desc(homework.dueDate));
    } else {
      homeworkList = await db
        .select({
          id: homework.id,
          title: homework.title,
          description: homework.description,
          classroomId: homework.classroomId,
          subjectId: homework.subjectId,
          teacherId: homework.teacherId,
          assignedDate: homework.assignedDate,
          dueDate: homework.dueDate,
          totalMarks: homework.totalMarks,
          status: homework.status,
          createdAt: homework.createdAt,
          className: classrooms.name,
          subjectName: subjects.name,
          teacherName: users.name,
        })
        .from(homework)
        .leftJoin(classrooms, eq(homework.classroomId, classrooms.id))
        .leftJoin(subjects, eq(homework.subjectId, subjects.id))
        .leftJoin(users, eq(homework.teacherId, users.id))
        .orderBy(desc(homework.dueDate));
    }

    return NextResponse.json(homeworkList);
  } catch (error) {
    console.error("Error fetching homework:", error);
    return NextResponse.json(
      { error: "Failed to fetch homework" },
      { status: 500 },
    );
  }
}

// POST - Create homework
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      classroomId,
      subjectId,
      teacherId,
      title,
      description,
      dueDate,
      totalMarks = 100,
    } = body;

    if (!classroomId || !subjectId || !teacherId || !title || !dueDate) {
      return NextResponse.json(
        {
          error:
            "Classroom ID, Subject ID, Teacher ID, title, and due date are required",
        },
        { status: 400 },
      );
    }

    const [newHomework] = await db
      .insert(homework)
      .values({
        classroomId,
        subjectId,
        teacherId,
        title,
        description: description || "",
        dueDate: new Date(dueDate),
        totalMarks,
        status: "assigned",
      })
      .returning();

    // Notify all students in the classroom
    const studentIds = await getClassroomStudentUserIds(classroomId);

    if (studentIds.length > 0) {
      // Get subject name for notification
      const subject = await db.query.subjects.findFirst({
        where: eq(subjects.id, subjectId),
      });

      await createBulkNotifications({
        type: "homework_assigned",
        title: `New Homework: ${title}`,
        message: `${subject?.name || "Subject"} homework assigned. Due: ${new Date(dueDate).toLocaleDateString()}`,
        recipientIds: studentIds,
        senderId: teacherId,
        relatedId: newHomework.id,
        relatedType: "homework",
        priority: "normal",
        actionUrl: `/student`,
      });
    }

    return NextResponse.json(newHomework, { status: 201 });
  } catch (error) {
    console.error("Error creating homework:", error);
    return NextResponse.json(
      { error: "Failed to create homework" },
      { status: 500 },
    );
  }
}
