/**
 * Discord RPC Utility Functions
 * 
 * Helper functions and utilities for working with Discord Rich Presence
 */

import { invoke } from "@tauri-apps/api/core";
import {
  DiscordPresenceData,
  SchoolActivity,
  ACTIVITY_PRESETS,
} from "@/types/discord-rpc";

/**
 * Check if we're running in Tauri (desktop app)
 */
export function isDiscordRPCAvailable(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

/**
 * Initialize Discord RPC with error handling
 */
export async function initializeDiscordRPC(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!isDiscordRPCAvailable()) {
    return { success: false, error: "Not running in Tauri environment" };
  }

  try {
    await invoke("init_discord_rpc");
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Discord RPC] Initialization failed:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Update Discord presence with retry logic
 */
export async function updateDiscordPresenceWithRetry(
  data: DiscordPresenceData,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<{ success: boolean; error?: string }> {
  if (!isDiscordRPCAvailable()) {
    return { success: false, error: "Not available in web mode" };
  }

  let lastError: string | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await invoke("update_discord_presence", { presenceData: data });
      return { success: true };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.warn(
        `[Discord RPC] Update attempt ${attempt + 1}/${maxRetries} failed:`,
        lastError
      );

      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  return { success: false, error: lastError };
}

/**
 * Create a custom presence with sensible defaults
 */
export function createCustomPresence(
  state: string,
  details?: string,
  options?: {
    largeImage?: string;
    largeText?: string;
    smallImage?: string;
    smallText?: string;
    includeTimestamp?: boolean;
  }
): DiscordPresenceData {
  return {
    state,
    details: details || "School Management System",
    large_image_key: options?.largeImage || "school-logo",
    large_image_text: options?.largeText || "Amrita Vidyalayam",
    small_image_key: options?.smallImage,
    small_image_text: options?.smallText,
    start_timestamp:
      options?.includeTimestamp !== false
        ? Math.floor(Date.now() / 1000)
        : undefined,
  };
}

/**
 * Get Discord presence configuration for a specific route
 */
export function getPresenceForRoute(
  pathname: string
): DiscordPresenceData | null {
  // Map common routes to activities
  const routeMap: Record<string, SchoolActivity> = {
    "/dashboard": SchoolActivity.VIEWING_DASHBOARD,
    "/admin": SchoolActivity.VIEWING_DASHBOARD,
    "/student": SchoolActivity.VIEWING_DASHBOARD,
    "/teacher": SchoolActivity.VIEWING_DASHBOARD,
    "/attendance": SchoolActivity.VIEWING_ATTENDANCE,
    "/timetable": SchoolActivity.VIEWING_TIMETABLE,
    "/grades": SchoolActivity.VIEWING_GRADES,
    "/assignments": SchoolActivity.VIEWING_ASSIGNMENTS,
    "/calendar": SchoolActivity.VIEWING_CALENDAR,
    "/students": SchoolActivity.MANAGING_STUDENTS,
    "/teachers": SchoolActivity.MANAGING_TEACHERS,
    "/classes": SchoolActivity.MANAGING_CLASSES,
    "/reports": SchoolActivity.VIEWING_REPORTS,
    "/settings": SchoolActivity.IN_SETTINGS,
  };

  // Find matching activity
  for (const [route, activity] of Object.entries(routeMap)) {
    if (pathname.includes(route)) {
      const preset = ACTIVITY_PRESETS[activity];
      return {
        state: preset.state,
        details: preset.details,
        large_image_key: preset.largeImage,
        large_image_text: preset.largeText,
        small_image_key: preset.smallImage,
        small_image_text: preset.smallText,
        start_timestamp: Math.floor(Date.now() / 1000),
      };
    }
  }

  return null;
}

/**
 * Get user preference for Discord RPC from localStorage
 */
export function getDiscordRPCPreference(): boolean {
  if (typeof window === "undefined") return false;

  const preference = localStorage.getItem("discord-rpc-enabled");
  return preference === "true";
}

/**
 * Save user preference for Discord RPC to localStorage
 */
export function setDiscordRPCPreference(enabled: boolean): void {
  if (typeof window === "undefined") return;

  localStorage.setItem("discord-rpc-enabled", enabled.toString());
}

/**
 * Create presence for class-specific activities
 */
export function createClassPresence(
  activity: "Teaching" | "Attending" | "Managing",
  className: string,
  subjectName?: string
): DiscordPresenceData {
  const activityMap = {
    Teaching: "Teaching Class",
    Attending: "In Class",
    Managing: "Managing Class",
  };

  const details = subjectName
    ? `${className} - ${subjectName}`
    : className;

  return createCustomPresence(activityMap[activity], details, {
    smallImage: activity === "Teaching" ? "teacher-icon" : "student-icon",
    smallText: activity,
  });
}

/**
 * Create presence for exam/assessment activities
 */
export function createExamPresence(
  examType: "Taking" | "Grading" | "Reviewing",
  examName: string
): DiscordPresenceData {
  const activityMap = {
    Taking: "Taking Exam",
    Grading: "Grading Exams",
    Reviewing: "Reviewing Results",
  };

  return createCustomPresence(activityMap[examType], examName, {
    smallImage: "grades-icon",
    smallText: examType,
  });
}

/**
 * Batch update multiple presence fields safely
 */
export async function batchUpdatePresence(
  updates: Partial<DiscordPresenceData>[]
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  for (const update of updates) {
    if (!update.state || !update.details) continue;

    const result = await updateDiscordPresenceWithRetry(
      update as DiscordPresenceData
    );

    if (!result.success && result.error) {
      errors.push(result.error);
    }
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Clear Discord presence with retry
 */
export async function clearDiscordPresenceWithRetry(
  maxRetries: number = 3
): Promise<{ success: boolean; error?: string }> {
  if (!isDiscordRPCAvailable()) {
    return { success: false, error: "Not available in web mode" };
  }

  let lastError: string | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await invoke("clear_discord_presence");
      return { success: true };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  return { success: false, error: lastError };
}

/**
 * Check if Discord is currently running
 */
export async function checkDiscordRunning(): Promise<boolean> {
  if (!isDiscordRPCAvailable()) return false;

  try {
    return await invoke<boolean>("is_discord_connected");
  } catch {
    return false;
  }
}

/**
 * Disconnect Discord RPC gracefully
 */
export async function disconnectDiscordRPC(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!isDiscordRPCAvailable()) {
    return { success: false, error: "Not available in web mode" };
  }

  try {
    await invoke("disconnect_discord_rpc");
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}
