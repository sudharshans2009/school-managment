import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { teacherAssignments, users } from "@/database/schema";
import { eq } from "drizzle-orm";

// GET - Fetch teachers for a classroom
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const teachers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
      })
      .from(teacherAssignments)
      .leftJoin(users, eq(teacherAssignments.teacherId, users.id))
      .where(eq(teacherAssignments.classroomId, id));

    return NextResponse.json(teachers);
  } catch (error) {
    console.error("Error fetching classroom teachers:", error);
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 },
    );
  }
}
