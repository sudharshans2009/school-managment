"use client";

/**
 * Example: Discord RPC Integration in Dashboard Layout
 * 
 * This component demonstrates how to integrate Discord Rich Presence
 * into a layout that wraps multiple pages, automatically updating
 * the presence based on the current route.
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useDiscordRPC } from "@/hooks/use-discord-rpc";
import { SchoolActivity } from "@/types/discord-rpc";
import { DiscordRPCSettingsCard } from "@/components/settings/discord-rpc-settings-card";

interface DiscordPresenceProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that automatically updates Discord presence
 * based on the current route
 */
export function DiscordPresenceProvider({ children }: DiscordPresenceProviderProps) {
  const pathname = usePathname();
  const { isConnected, updateActivityPreset } = useDiscordRPC({
    autoInit: true,
    autoDisconnectOnUnmount: true,
    enableLogging: process.env.NODE_ENV === "development",
  });

  useEffect(() => {
    if (!isConnected) return;

    // Map routes to Discord activities
    const routeToActivity: Record<string, SchoolActivity> = {
      "/dashboard": SchoolActivity.VIEWING_DASHBOARD,
      "/admin": SchoolActivity.VIEWING_DASHBOARD,
      "/student": SchoolActivity.VIEWING_DASHBOARD,
      "/teacher": SchoolActivity.VIEWING_DASHBOARD,
      "/dashboard/attendance": SchoolActivity.VIEWING_ATTENDANCE,
      "/admin/attendance": SchoolActivity.VIEWING_ATTENDANCE,
      "/teacher/attendance": SchoolActivity.VIEWING_ATTENDANCE,
      "/dashboard/timetable": SchoolActivity.VIEWING_TIMETABLE,
      "/admin/timetable": SchoolActivity.VIEWING_TIMETABLE,
      "/student/timetable": SchoolActivity.VIEWING_TIMETABLE,
      "/teacher/timetable": SchoolActivity.VIEWING_TIMETABLE,
      "/dashboard/grades": SchoolActivity.VIEWING_GRADES,
      "/student/grades": SchoolActivity.VIEWING_GRADES,
      "/teacher/grades": SchoolActivity.VIEWING_GRADES,
      "/dashboard/assignments": SchoolActivity.VIEWING_ASSIGNMENTS,
      "/student/assignments": SchoolActivity.VIEWING_ASSIGNMENTS,
      "/teacher/assignments": SchoolActivity.VIEWING_ASSIGNMENTS,
      "/dashboard/calendar": SchoolActivity.VIEWING_CALENDAR,
      "/admin/calendar": SchoolActivity.VIEWING_CALENDAR,
      "/admin/students": SchoolActivity.MANAGING_STUDENTS,
      "/admin/teachers": SchoolActivity.MANAGING_TEACHERS,
      "/admin/classes": SchoolActivity.MANAGING_CLASSES,
      "/admin/reports": SchoolActivity.VIEWING_REPORTS,
      "/settings": SchoolActivity.IN_SETTINGS,
    };

    // Find matching activity for current route
    let activity: SchoolActivity | null = null;
    
    // Try exact match first
    if (pathname in routeToActivity) {
      activity = routeToActivity[pathname];
    } else {
      // Try partial match (for nested routes)
      for (const [route, activityType] of Object.entries(routeToActivity)) {
        if (pathname.startsWith(route)) {
          activity = activityType;
          break;
        }
      }
    }

    // Update presence if activity found
    if (activity) {
      updateActivityPreset(activity);
    }
  }, [pathname, isConnected, updateActivityPreset]);

  return <>{children}</>;
}

/**
 * Example: Manual Discord RPC Usage in a Component
 */
export function AttendancePageExample() {
  const { isConnected, updatePresence, updateActivityPreset } = useDiscordRPC({
    autoInit: true,
  });

  useEffect(() => {
    if (isConnected) {
      // Option 1: Use preset
      updateActivityPreset(SchoolActivity.VIEWING_ATTENDANCE);

      // Option 2: Custom presence
      // updatePresence({
      //   state: "Taking Attendance",
      //   details: "Class 10-A Mathematics",
      //   large_image_key: "school-logo",
      //   large_image_text: "Amrita Vidyalayam",
      //   small_image_key: "attendance-icon",
      //   small_image_text: "Attendance",
      //   start_timestamp: Math.floor(Date.now() / 1000),
      // });
    }
  }, [isConnected]);

  return (
    <div>
      {/* Attendance page content */}
    </div>
  );
}

/**
 * Example: Dynamic Discord RPC Based on User Action
 */
export function GradeManagementExample() {
  const { isConnected, updatePresence } = useDiscordRPC({ autoInit: true });
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && selectedClass) {
      // Update presence with specific class information
      updatePresence({
        state: "Managing Grades",
        details: `Class ${selectedClass}`,
        large_image_key: "school-logo",
        large_image_text: "Amrita Vidyalayam",
        small_image_key: "grades-icon",
        small_image_text: "Grades",
        start_timestamp: Math.floor(Date.now() / 1000),
      });
    }
  }, [isConnected, selectedClass]);

  return (
    <div>
      {/* Grade management content */}
    </div>
  );
}

/**
 * Example: Conditional Discord RPC (only show for certain roles)
 */
export function TeacherDashboardExample() {
  const { isConnected, updateActivityPreset } = useDiscordRPC({ autoInit: true });
  const userRole = "teacher"; // Get from auth context

  useEffect(() => {
    if (isConnected && userRole === "teacher") {
      updateActivityPreset(SchoolActivity.VIEWING_DASHBOARD, "Teacher Dashboard");
    }
  }, [isConnected, userRole]);

  return (
    <div>
      {/* Teacher dashboard content */}
    </div>
  );
}

/**
 * Example: Settings Page Integration
 */
export function SettingsPageExample() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <div className="grid gap-6">
        {/* Other settings cards */}
        
        {/* Add Discord RPC Settings Card */}
        <DiscordRPCSettingsCard />
      </div>
    </div>
  );
}
