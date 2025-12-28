/**
 * Discord Rich Presence types for Tauri commands
 */

export interface DiscordPresenceData {
  state: string;
  details: string;
  large_image_key?: string;
  large_image_text?: string;
  small_image_key?: string;
  small_image_text?: string;
  start_timestamp?: number;
}

export interface DiscordRPCCommands {
  initDiscordRpc: () => Promise<string>;
  updateDiscordPresence: (data: DiscordPresenceData) => Promise<string>;
  clearDiscordPresence: () => Promise<string>;
  disconnectDiscordRpc: () => Promise<string>;
  isDiscordConnected: () => Promise<boolean>;
}

/**
 * Predefined presence states for common school activities
 */
export enum SchoolActivity {
  VIEWING_DASHBOARD = "dashboard",
  VIEWING_ATTENDANCE = "attendance",
  VIEWING_TIMETABLE = "timetable",
  VIEWING_GRADES = "grades",
  VIEWING_ASSIGNMENTS = "assignments",
  VIEWING_CALENDAR = "calendar",
  MANAGING_STUDENTS = "students",
  MANAGING_TEACHERS = "teachers",
  MANAGING_CLASSES = "classes",
  VIEWING_REPORTS = "reports",
  IN_SETTINGS = "settings",
}

export interface ActivityPresenceConfig {
  state: string;
  details: string;
  largeImage?: string;
  largeText?: string;
  smallImage?: string;
  smallText?: string;
}

/**
 * Mapping of school activities to Discord presence configurations
 */
export const ACTIVITY_PRESETS: Record<SchoolActivity, ActivityPresenceConfig> = {
  [SchoolActivity.VIEWING_DASHBOARD]: {
    state: "Viewing Dashboard",
    details: "School Management System",
    largeImage: "test",
    largeText: "School Management",
  },
  [SchoolActivity.VIEWING_ATTENDANCE]: {
    state: "Managing Attendance",
    details: "Tracking student presence",
    largeImage: "test",
    largeText: "School Management",
  },
  [SchoolActivity.VIEWING_TIMETABLE]: {
    state: "Viewing Timetable",
    details: "Checking class schedule",
    largeImage: "test",
    largeText: "School Management",
  },
  [SchoolActivity.VIEWING_GRADES]: {
    state: "Viewing Grades",
    details: "Checking academic performance",
    largeImage: "test",
    largeText: "School Management",
  },
  [SchoolActivity.VIEWING_ASSIGNMENTS]: {
    state: "Managing Assignments",
    details: "Reviewing homework",
    largeImage: "test",
    largeText: "School Management",
  },
  [SchoolActivity.VIEWING_CALENDAR]: {
    state: "Viewing Calendar",
    details: "Checking events",
    largeImage: "test",
    largeText: "School Management",
  },
  [SchoolActivity.MANAGING_STUDENTS]: {
    state: "Managing Students",
    details: "Student administration",
    largeImage: "test",
    largeText: "School Management",
  },
  [SchoolActivity.MANAGING_TEACHERS]: {
    state: "Managing Teachers",
    details: "Teacher administration",
    largeImage: "test",
    largeText: "School Management",
  },
  [SchoolActivity.MANAGING_CLASSES]: {
    state: "Managing Classes",
    details: "Classroom administration",
    largeImage: "test",
    largeText: "School Management",
  },
  [SchoolActivity.VIEWING_REPORTS]: {
    state: "Viewing Reports",
    details: "Analyzing data",
    largeImage: "test",
    largeText: "School Management",
  },
  [SchoolActivity.IN_SETTINGS]: {
    state: "In Settings",
    details: "Configuring application",
    largeImage: "test",
    largeText: "School Management",
  },
};
