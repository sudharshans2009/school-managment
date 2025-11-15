"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AppContextMenu } from "@/components/ui/app-context-menu";
import { type ContextMenuAction } from "@/components/providers/context-menu-provider";
import { AdminStudentsContextMenu } from "@/components/admin/admin-students-context-menu";
import { AdminDashboardContextMenu } from "@/components/admin/admin-dashboard-context-menu";
import { TeacherClassroomContextMenu } from "@/components/teacher/teacher-classroom-context-menu";
import { StudentDashboardContextMenu } from "@/components/student/student-dashboard-context-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  FileText,
  Edit,
  Trash,
  Copy,
  Download,
  Share,
  Eye,
  Settings,
} from "lucide-react";

export default function ContextMenuDemo() {
  const [actionLog, setActionLog] = useState<string[]>([]);

  const logAction = (action: string) => {
    setActionLog((prev) => [...prev.slice(-4), action]);
    toast.success(action);
  };

  // Basic context menu actions
  const basicActions: ContextMenuAction[] = [
    {
      label: "View",
      icon: <Eye className="mr-2 h-4 w-4" />,
      onClick: () => logAction("View clicked"),
      shortcut: "⌘V",
    },
    {
      label: "Edit",
      icon: <Edit className="mr-2 h-4 w-4" />,
      onClick: () => logAction("Edit clicked"),
      shortcut: "⌘E",
    },
    { separator: true } as ContextMenuAction,
    {
      label: "Copy",
      icon: <Copy className="mr-2 h-4 w-4" />,
      onClick: () => logAction("Copy clicked"),
      shortcut: "⌘C",
    },
    {
      label: "Download",
      icon: <Download className="mr-2 h-4 w-4" />,
      onClick: () => logAction("Download clicked"),
    },
    { separator: true } as ContextMenuAction,
    {
      label: "Delete",
      icon: <Trash className="mr-2 h-4 w-4" />,
      onClick: () => logAction("Delete clicked"),
      variant: "destructive",
    },
  ];

  // Submenu example
  const submenuActions: ContextMenuAction[] = [
    {
      label: "File",
      icon: <FileText className="mr-2 h-4 w-4" />,
      submenu: [
        {
          label: "New File",
          onClick: () => logAction("New File clicked"),
        },
        {
          label: "Open File",
          onClick: () => logAction("Open File clicked"),
        },
        { separator: true } as ContextMenuAction,
        {
          label: "Save",
          onClick: () => logAction("Save clicked"),
          shortcut: "⌘S",
        },
      ],
    },
    {
      label: "Share",
      icon: <Share className="mr-2 h-4 w-4" />,
      submenu: [
        {
          label: "Email",
          onClick: () => logAction("Share via Email"),
        },
        {
          label: "Link",
          onClick: () => logAction("Share via Link"),
        },
        {
          label: "Social Media",
          onClick: () => logAction("Share on Social Media"),
        },
      ],
    },
    { separator: true } as ContextMenuAction,
    {
      label: "Settings",
      icon: <Settings className="mr-2 h-4 w-4" />,
      onClick: () => logAction("Settings clicked"),
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Context Menu Demo</h1>
        <p className="text-muted-foreground">
          Right-click on any card to see the custom context menu in action
        </p>
      </div>

      {/* Action Log */}
      <Card>
        <CardHeader>
          <CardTitle>Action Log</CardTitle>
          <CardDescription>Last 5 actions performed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {actionLog.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No actions yet. Right-click on any card below to get started.
              </p>
            ) : (
              actionLog.map((action, index) => (
                <div
                  key={index}
                  className="text-sm p-2 bg-muted rounded-md"
                >
                  {action}
                </div>
              ))
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setActionLog([])}
          >
            Clear Log
          </Button>
        </CardContent>
      </Card>

      {/* Basic Context Menu */}
      <AppContextMenu actions={basicActions}>
        <Card className="cursor-context-menu hover:border-primary transition-colors">
          <CardHeader>
            <CardTitle>Basic Context Menu</CardTitle>
            <CardDescription>
              Right-click here to see a basic context menu with icons, shortcuts, and a destructive action
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This demonstrates a simple context menu with common actions like View, Edit, Copy, Download, and Delete.
            </p>
          </CardContent>
        </Card>
      </AppContextMenu>

      {/* Submenu Context Menu */}
      <AppContextMenu actions={submenuActions}>
        <Card className="cursor-context-menu hover:border-primary transition-colors">
          <CardHeader>
            <CardTitle>Context Menu with Submenus</CardTitle>
            <CardDescription>
              Right-click here to see a context menu with nested submenus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This demonstrates context menus with submenu support. Hover over &quot;File&quot; or &quot;Share&quot; to see nested options.
            </p>
          </CardContent>
        </Card>
      </AppContextMenu>

      {/* Admin Students Context Menu */}
      <AdminStudentsContextMenu
        onAddStudent={() => logAction("Add New Student")}
        onBulkUpload={() => logAction("Bulk Upload CSV")}
        onRefresh={() => logAction("Refresh Students List")}
        onExport={() => logAction("Export to CSV")}
        onFilter={() => logAction("Filter Students")}
      >
        <Card className="cursor-context-menu hover:border-primary transition-colors">
          <CardHeader>
            <CardTitle>Admin Students Context Menu</CardTitle>
            <CardDescription>
              Right-click here to see the admin student management context menu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This is a pre-built context menu designed for the admin student management page.
              It includes actions for adding students, bulk upload, refreshing, and exporting data.
            </p>
          </CardContent>
        </Card>
      </AdminStudentsContextMenu>

      {/* Admin Dashboard Context Menu */}
      <AdminDashboardContextMenu
        onRefresh={() => logAction("Refresh Dashboard")}
        onViewAnalytics={() => logAction("View Analytics")}
        onViewUsers={() => logAction("Manage Users")}
        onViewCalendar={() => logAction("View Calendar")}
        onSettings={() => logAction("Dashboard Settings")}
      >
        <Card className="cursor-context-menu hover:border-primary transition-colors">
          <CardHeader>
            <CardTitle>Admin Dashboard Context Menu</CardTitle>
            <CardDescription>
              Right-click here to see the admin dashboard context menu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Pre-built context menu for the admin dashboard with quick navigation and refresh options.
            </p>
          </CardContent>
        </Card>
      </AdminDashboardContextMenu>

      {/* Teacher Classroom Context Menu */}
      <TeacherClassroomContextMenu
        onTakeAttendance={() => logAction("Take Attendance")}
        onAssignHomework={() => logAction("Assign Homework")}
        onViewStudents={() => logAction("View Students")}
        onViewSchedule={() => logAction("View Schedule")}
        onRefresh={() => logAction("Refresh Classroom")}
        onGenerateReport={() => logAction("Generate Report")}
      >
        <Card className="cursor-context-menu hover:border-primary transition-colors">
          <CardHeader>
            <CardTitle>Teacher Classroom Context Menu</CardTitle>
            <CardDescription>
              Right-click here to see the teacher classroom context menu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Pre-built context menu for teacher classroom pages with attendance, homework, and student management actions.
            </p>
          </CardContent>
        </Card>
      </TeacherClassroomContextMenu>

      {/* Student Dashboard Context Menu */}
      <StudentDashboardContextMenu
        onViewHomework={() => logAction("View My Homework")}
        onViewSchedule={() => logAction("View My Schedule")}
        onViewGrades={() => logAction("View My Grades")}
        onViewProfile={() => logAction("View My Profile")}
        onRefresh={() => logAction("Refresh Dashboard")}
        onHelp={() => logAction("Get Help")}
      >
        <Card className="cursor-context-menu hover:border-primary transition-colors">
          <CardHeader>
            <CardTitle>Student Dashboard Context Menu</CardTitle>
            <CardDescription>
              Right-click here to see the student dashboard context menu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Pre-built context menu for student dashboard with quick access to homework, schedule, grades, and profile.
            </p>
          </CardContent>
        </Card>
      </StudentDashboardContextMenu>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Testing the Context Menus:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Right-click on any card above</li>
              <li>The custom context menu will appear</li>
              <li>Click on any menu item to trigger an action</li>
              <li>Watch the action log above to see the result</li>
              <li>Try hovering over items with submenus (File, Share)</li>
              <li>Notice the keyboard shortcuts displayed</li>
              <li>Try the destructive action (Delete) to see the red styling</li>
            </ol>
          </div>
          <div>
            <h4 className="font-medium mb-2">Features Demonstrated:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Basic context menu with icons and shortcuts</li>
              <li>Submenus with nested actions</li>
              <li>Separators for grouping actions</li>
              <li>Destructive variant for dangerous actions</li>
              <li>Role-specific pre-built context menus (Admin, Teacher, Student)</li>
              <li>Page-specific context menus</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Notes:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>The default browser/Tauri context menu is disabled</li>
              <li>Keyboard shortcuts are displayed but not bound (implement separately)</li>
              <li>All actions are logged to the Action Log above</li>
              <li>Context menus are consistent with the app&apos;s ShadCN UI design system</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
