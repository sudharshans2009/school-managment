/**
 * Permission System for School Management System
 * Defines role-based permissions and provides helper functions for permission checking
 */

// Permission types for different user roles
export type Permission =
  // Student permissions
  | "view_own_data"
  | "submit_homework"
  | "view_own_attendance"
  | "view_own_grades"
  | "register_for_events"
  | "view_announcements"
  // Teacher permissions
  | "manage_homework"
  | "mark_attendance"
  | "view_student_data"
  | "grade_assignments"
  | "create_announcements"
  | "manage_classroom"
  | "view_reports"
  // Admin permissions
  | "manage_users"
  | "manage_classrooms"
  | "manage_subjects"
  | "manage_fees"
  | "view_all_data"
  | "manage_admissions"
  | "manage_system_settings"
  | "view_audit_logs"
  | "export_data"
  | "manage_backups"
  // Smartboard permissions
  | "view_classroom_dashboard"
  | "view_timetable"
  | "view_classroom_announcements";

export type UserRole = "admin" | "teacher" | "student" | "parent";

/**
 * Default permissions for each role
 * These define what each role can do by default
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  student: [
    "view_own_data",
    "submit_homework",
    "view_own_attendance",
    "view_own_grades",
    "register_for_events",
    "view_announcements",
  ],
  teacher: [
    "view_own_data",
    "manage_homework",
    "mark_attendance",
    "view_student_data",
    "grade_assignments",
    "create_announcements",
    "manage_classroom",
    "view_reports",
    "view_announcements",
  ],
  parent: [
    "view_own_data",
    "view_announcements",
    "register_for_events", // Can register children for events
  ],
  admin: [
    // Admin has all permissions
    "view_own_data",
    "submit_homework",
    "view_own_attendance",
    "view_own_grades",
    "register_for_events",
    "view_announcements",
    "manage_homework",
    "mark_attendance",
    "view_student_data",
    "grade_assignments",
    "create_announcements",
    "manage_classroom",
    "view_reports",
    "manage_users",
    "manage_classrooms",
    "manage_subjects",
    "manage_fees",
    "view_all_data",
    "manage_admissions",
    "manage_system_settings",
    "view_audit_logs",
    "export_data",
    "manage_backups",
    "view_classroom_dashboard",
    "view_timetable",
    "view_classroom_announcements",
  ],
};

/**
 * Smartboard has special permissions (not a user role, but needs specific access)
 */
export const SMARTBOARD_PERMISSIONS: Permission[] = [
  "view_classroom_dashboard",
  "view_timetable",
  "view_classroom_announcements",
  "view_announcements",
];

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return DEFAULT_ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return DEFAULT_ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Resource-specific permission mappings
 * Maps resources to the permissions needed to perform actions on them
 */
export const RESOURCE_PERMISSIONS = {
  student: {
    view: ["view_student_data", "view_all_data"] as Permission[],
    create: ["manage_users", "manage_admissions"] as Permission[],
    update: ["manage_users"] as Permission[],
    delete: ["manage_users"] as Permission[],
  },
  teacher: {
    view: ["view_all_data"] as Permission[],
    create: ["manage_users"] as Permission[],
    update: ["manage_users"] as Permission[],
    delete: ["manage_users"] as Permission[],
  },
  classroom: {
    view: ["view_all_data", "manage_classroom"] as Permission[],
    create: ["manage_classrooms"] as Permission[],
    update: ["manage_classrooms"] as Permission[],
    delete: ["manage_classrooms"] as Permission[],
  },
  homework: {
    view: ["view_student_data", "manage_homework"] as Permission[],
    create: ["manage_homework"] as Permission[],
    update: ["manage_homework"] as Permission[],
    delete: ["manage_homework"] as Permission[],
  },
  attendance: {
    view: ["view_student_data", "mark_attendance"] as Permission[],
    create: ["mark_attendance"] as Permission[],
    update: ["mark_attendance"] as Permission[],
    delete: ["manage_system_settings"] as Permission[], // Only admin can delete
  },
  announcement: {
    view: ["view_announcements"] as Permission[],
    create: ["create_announcements"] as Permission[],
    update: ["create_announcements"] as Permission[],
    delete: ["create_announcements", "manage_system_settings"] as Permission[],
  },
  "audit-log": {
    view: ["view_audit_logs"] as Permission[],
    create: [] as Permission[], // System only
    update: [] as Permission[], // Immutable
    delete: [] as Permission[], // Immutable
  },
  backup: {
    view: ["manage_backups"] as Permission[],
    create: ["manage_backups"] as Permission[],
    update: [] as Permission[], // Immutable
    delete: ["manage_backups"] as Permission[],
  },
} as const;

export type ResourceType = keyof typeof RESOURCE_PERMISSIONS;
export type ResourceAction = "view" | "create" | "update" | "delete";

/**
 * Check if a user can perform an action on a resource
 */
export function canAccessResource(
  role: UserRole,
  resource: ResourceType,
  action: ResourceAction,
): boolean {
  const requiredPermissions = RESOURCE_PERMISSIONS[resource]?.[action] ?? [];
  if (requiredPermissions.length === 0) {
    return false; // No permissions defined means no access
  }
  return hasAnyPermission(role, requiredPermissions);
}
