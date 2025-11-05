import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { users } from "@/database/schema";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { unauthorized } from "next/navigation";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (
      !session?.user ||
      (session.user as { role?: string }).role !== "admin"
    ) {
      unauthorized();
    }

    const body = await req.json();
    const { teachers } = body;

    if (!teachers || !Array.isArray(teachers)) {
      return NextResponse.json(
        { error: "Invalid data format. Expected array of teachers." },
        { status: 400 },
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const teacher of teachers) {
      try {
        const { name, email, password, phone, address } = teacher;

        // Validate required fields
        if (!name || !email || !password) {
          results.failed++;
          results.errors.push(
            `Missing required fields for ${email || "unknown"}`,
          );
          continue;
        }

        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.email, email),
        });

        if (existingUser) {
          results.failed++;
          results.errors.push(`User with email ${email} already exists`);
          continue;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        await db.insert(users).values({
          name,
          email,
          role: "teacher",
          passwordHash,
          phone: phone || null,
          address: address || null,
          emailVerified: true,
          isActive: true,
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Error creating teacher ${teacher.email}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    return NextResponse.json({
      message: `Bulk upload completed. ${results.success} teachers created, ${results.failed} failed.`,
      ...results,
    });
  } catch (error) {
    console.error("Error in bulk teacher upload:", error);
    return NextResponse.json(
      { error: "Failed to process bulk upload" },
      { status: 500 },
    );
  }
}
