import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { entranceTests } from "@/database/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { unauthorized } from "next/navigation";

// GET - Fetch entrance tests
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const grade = searchParams.get("grade");
    const isActive = searchParams.get("isActive");

    const conditions = [];

    if (grade) {
      conditions.push(eq(entranceTests.grade, grade));
    }

    if (isActive !== null) {
      conditions.push(eq(entranceTests.isActive, isActive === "true"));
    }

    const tests = await db
      .select()
      .from(entranceTests)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(entranceTests.testDate));

    return NextResponse.json(tests);
  } catch (error) {
    console.error("Error fetching entrance tests:", error);
    return NextResponse.json(
      { error: "Failed to fetch entrance tests" },
      { status: 500 },
    );
  }
}

// POST - Create entrance test (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || session.user.role !== "admin") {
      unauthorized();
    }

    const body = await request.json();
    const {
      testName,
      grade,
      testDate,
      duration,
      totalMarks,
      passingMarks,
      venue,
      instructions,
      syllabus,
    } = body;

    if (
      !testName ||
      !grade ||
      !testDate ||
      !duration ||
      !totalMarks ||
      !passingMarks
    ) {
      return NextResponse.json(
        {
          error:
            "Test name, grade, test date, duration, total marks, and passing marks are required",
        },
        { status: 400 },
      );
    }

    const [test] = await db
      .insert(entranceTests)
      .values({
        testName,
        grade,
        testDate: new Date(testDate),
        duration,
        totalMarks,
        passingMarks,
        venue,
        instructions,
        syllabus,
        isActive: true,
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    console.error("Error creating entrance test:", error);
    return NextResponse.json(
      { error: "Failed to create entrance test" },
      { status: 500 },
    );
  }
}
