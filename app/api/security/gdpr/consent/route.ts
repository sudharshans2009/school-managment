/**
 * GDPR Consent Management API
 * Track and manage user consent for data processing
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { userConsents } from "@/database/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-middleware";
import { auditResourceAccess } from "@/lib/audit";

const CURRENT_POLICY_VERSION = "1.0.0";

// GET - Get user's consent records
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { user } = authResult;

  try {
    const consents = await db
      .select()
      .from(userConsents)
      .where(eq(userConsents.userId, user.id))
      .orderBy(desc(userConsents.consentedAt));

    // Get latest consent for each type
    const latestConsents: Record<string, (typeof consents)[0]> = {};
    for (const consent of consents) {
      if (!latestConsents[consent.consentType]) {
        latestConsents[consent.consentType] = consent;
      }
    }

    return NextResponse.json({
      consents,
      latestConsents,
      currentPolicyVersion: CURRENT_POLICY_VERSION,
    });
  } catch (error) {
    console.error("Error fetching consents:", error);
    return NextResponse.json(
      { error: "Failed to fetch consents" },
      { status: 500 },
    );
  }
}

// POST - Record user consent
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { user } = authResult;

  try {
    const body = await request.json();
    const { consentType, isGranted, version = CURRENT_POLICY_VERSION } = body;

    if (!consentType || typeof isGranted !== "boolean") {
      return NextResponse.json(
        { error: "consentType and isGranted are required" },
        { status: 400 },
      );
    }

    // Get request metadata
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    // Record consent
    const [consent] = await db
      .insert(userConsents)
      .values({
        userId: user.id,
        consentType,
        isGranted,
        version,
        ipAddress,
        userAgent,
      })
      .returning();

    // Audit consent change
    await auditResourceAccess(
      user.id,
      user.email,
      user.role,
      "create",
      "user",
      user.id,
      `Consent ${isGranted ? "granted" : "revoked"} for ${consentType}`,
      { consentType, isGranted, version },
      request,
    );

    return NextResponse.json({
      message: "Consent recorded successfully",
      consent,
    });
  } catch (error) {
    console.error("Error recording consent:", error);
    return NextResponse.json(
      { error: "Failed to record consent" },
      { status: 500 },
    );
  }
}

// PUT - Update consent
export async function PUT(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { user } = authResult;

  try {
    const body = await request.json();
    const { consentType, isGranted } = body;

    if (!consentType || typeof isGranted !== "boolean") {
      return NextResponse.json(
        { error: "consentType and isGranted are required" },
        { status: 400 },
      );
    }

    // Get request metadata
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    // Create new consent record (we keep history)
    const [consent] = await db
      .insert(userConsents)
      .values({
        userId: user.id,
        consentType,
        isGranted,
        version: CURRENT_POLICY_VERSION,
        ipAddress,
        userAgent,
      })
      .returning();

    // Audit consent change
    await auditResourceAccess(
      user.id,
      user.email,
      user.role,
      "update",
      "user",
      user.id,
      `Consent updated for ${consentType}`,
      { consentType, isGranted },
      request,
    );

    return NextResponse.json({
      message: "Consent updated successfully",
      consent,
    });
  } catch (error) {
    console.error("Error updating consent:", error);
    return NextResponse.json(
      { error: "Failed to update consent" },
      { status: 500 },
    );
  }
}
