import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { admissionApplications } from "@/database/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

// GET - Fetch admission applications
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const grade = searchParams.get("grade");

    const conditions = [];

    if (status) {
      conditions.push(eq(admissionApplications.status, status as any));
    }

    if (grade) {
      conditions.push(eq(admissionApplications.gradeAppliedFor, grade));
    }

    const applications = await db
      .select()
      .from(admissionApplications)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(admissionApplications.createdAt));

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching admission applications:", error);
    return NextResponse.json({ error: "Failed to fetch admission applications" }, { status: 500 });
  }
}

// POST - Create admission application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      studentName,
      dateOfBirth,
      gender,
      email,
      phone,
      address,
      guardianName,
      guardianRelation,
      guardianPhone,
      guardianEmail,
      previousSchool,
      gradeAppliedFor,
      academicYear,
    } = body;

    if (!studentName || !dateOfBirth || !gender || !email || !phone || !address ||
        !guardianName || !guardianRelation || !guardianPhone || !guardianEmail ||
        !gradeAppliedFor || !academicYear) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Generate application number using count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(admissionApplications);
    const count = Number(countResult[0]?.count || 0);
    const applicationNumber = `ADM-${academicYear}-${String(count + 1).padStart(4, "0")}`;

    const [application] = await db
      .insert(admissionApplications)
      .values({
        applicationNumber,
        studentName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        email,
        phone,
        address,
        guardianName,
        guardianRelation,
        guardianPhone,
        guardianEmail,
        previousSchool,
        gradeAppliedFor,
        academicYear,
        status: "pending",
      })
      .returning();

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("Error creating admission application:", error);
    return NextResponse.json({ error: "Failed to create admission application" }, { status: 500 });
  }
}
