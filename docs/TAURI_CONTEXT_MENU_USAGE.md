# Tauri Context Menu System - Usage Guide

## Overview

This custom context menu system replaces the default webview context menu in the Tauri desktop application with a role-aware, page-specific context menu using ShadCN UI components.

## Core Components

### 1. ContextMenuProvider

Global provider that manages context menu state across the application.

**Location:** `components/providers/context-menu-provider.tsx`

Already integrated in `components/providers/index.tsx`.

### 2. useContextMenu Hook

Custom hook for registering page-specific context menus.

**Location:** `hooks/use-context-menu.ts`

**Usage:**

```tsx
import { useContextMenu } from "@/hooks/use-context-menu";
import { type ContextMenuAction } from "@/components/providers/context-menu-provider";

const actions: ContextMenuAction[] = [
  {
    label: "Action Name",
    icon: <IconComponent className="mr-2 h-4 w-4" />,
    onClick: () => {
      /* action handler */
    },
    shortcut: "⌘K",
  },
  { separator: true },
  {
    label: "Submenu",
    icon: <IconComponent className="mr-2 h-4 w-4" />,
    submenu: [
      {
        label: "Nested Action",
        onClick: () => {
          /* nested action handler */
        },
      },
    ],
  },
];

useContextMenu("unique-page-id", actions);
```

### 3. AppContextMenu Component

Wrapper component that renders the context menu around any children.

**Location:** `components/ui/app-context-menu.tsx`

**Usage:**

```tsx
import { AppContextMenu } from "@/components/ui/app-context-menu";

<AppContextMenu actions={actions}>
  <div>Your page content here</div>
</AppContextMenu>;
```

## Pre-built Context Menu Components

### Admin Student Management Context Menu

**Location:** `components/admin/admin-students-context-menu.tsx`

**Example:**

```tsx
import { AdminStudentsContextMenu } from "@/components/admin/admin-students-context-menu";

<AdminStudentsContextMenu
  onAddStudent={() => setOpen(true)}
  onBulkUpload={() => setCsvDialogOpen(true)}
  onRefresh={() => queryClient.invalidateQueries({ queryKey: ["students"] })}
  onExport={() => exportToCSV()}
>
  <div className="space-y-4">{/* Your page content */}</div>
</AdminStudentsContextMenu>;
```

### Teacher Classroom Context Menu

**Location:** `components/teacher/teacher-classroom-context-menu.tsx`

**Example:**

```tsx
import { TeacherClassroomContextMenu } from "@/components/teacher/teacher-classroom-context-menu";

<TeacherClassroomContextMenu
  onTakeAttendance={() => router.push("/teacher/attendance")}
  onAssignHomework={() => setHomeworkDialogOpen(true)}
  onViewStudents={() => setStudentsDialogOpen(true)}
  onRefresh={() => queryClient.invalidateQueries()}
>
  <div className="dashboard-content">{/* Your classroom content */}</div>
</TeacherClassroomContextMenu>;
```

### Student Dashboard Context Menu

**Location:** `components/student/student-dashboard-context-menu.tsx`

**Example:**

```tsx
import { StudentDashboardContextMenu } from "@/components/student/student-dashboard-context-menu";

<StudentDashboardContextMenu
  onViewHomework={() => router.push("/student/homework")}
  onViewSchedule={() => router.push("/student/schedule")}
  onViewGrades={() => router.push("/student/grades")}
  onRefresh={() => queryClient.invalidateQueries()}
>
  <div className="student-dashboard">{/* Your dashboard content */}</div>
</StudentDashboardContextMenu>;
```

## Creating Custom Context Menus

To create a custom context menu for a specific page:

```tsx
"use client";

import { useContextMenu } from "@/hooks/use-context-menu";
import { type ContextMenuAction } from "@/components/providers/context-menu-provider";
import { AppContextMenu } from "@/components/ui/app-context-menu";
import { ReactNode } from "react";
import { Icon1, Icon2, Icon3 } from "lucide-react";

interface CustomContextMenuProps {
  children: ReactNode;
  onAction1: () => void;
  onAction2: () => void;
  onRefresh: () => void;
}

export function CustomContextMenu({
  children,
  onAction1,
  onAction2,
  onRefresh,
}: CustomContextMenuProps) {
  const actions: ContextMenuAction[] = [
    {
      label: "Action 1",
      icon: <Icon1 className="mr-2 h-4 w-4" />,
      onClick: onAction1,
      shortcut: "⌘1",
    },
    {
      label: "Action 2",
      icon: <Icon2 className="mr-2 h-4 w-4" />,
      onClick: onAction2,
    },
    { separator: true } as ContextMenuAction,
    {
      label: "Refresh",
      icon: <Icon3 className="mr-2 h-4 w-4" />,
      onClick: onRefresh,
      shortcut: "⌘R",
    },
  ];

  useContextMenu("custom-page-id", actions);

  return <AppContextMenu actions={actions}>{children}</AppContextMenu>;
}
```

## Context Menu Action Properties

```typescript
interface ContextMenuAction {
  label: string; // Display text for the menu item
  icon?: ReactNode; // Optional icon (usually from lucide-react)
  onClick: () => void; // Action to perform when clicked
  variant?: "default" | "destructive"; // Style variant (destructive for delete actions)
  disabled?: boolean; // Whether the action is disabled
  shortcut?: string; // Keyboard shortcut hint (display only)
  separator?: boolean; // Renders a separator instead of an action
  submenu?: ContextMenuAction[]; // Nested submenu actions
}
```

## Keyboard Shortcuts

The shortcut property displays a hint in the context menu but does not actually bind the keyboard shortcut. You need to implement keyboard shortcuts separately using libraries like `react-hotkeys-hook` or native event listeners.

## Disabling Default Context Menu

The default Tauri webview context menu is disabled via the configuration:

**File:** `src-tauri/tauri.conf.json`

```json
{
  "app": {
    "windows": [
      {
        "disableContextMenu": true
      }
    ]
  }
}
```

## Best Practices

1. **Keep context menus focused** - Include only the most relevant actions for the page
2. **Use separators** - Group related actions together with separators
3. **Provide keyboard shortcuts** - Show shortcuts for common actions
4. **Use appropriate icons** - Visual indicators help users quickly identify actions
5. **Consider user roles** - Only show actions relevant to the current user's role
6. **Disable unavailable actions** - Use the `disabled` property instead of hiding actions
7. **Use destructive variant** - Mark dangerous actions (like delete) with `variant="destructive"`

## Testing

To test the context menu:

1. Right-click anywhere on a page with a registered context menu
2. Verify that the menu appears with the correct actions
3. Click on menu items to ensure actions are triggered
4. Test submenus by hovering over items with nested actions
5. Verify that destructive actions are styled appropriately
6. Ensure that disabled actions cannot be clicked

## Troubleshooting

### Context menu not appearing

- Ensure the page component is wrapped with a context menu component
- Verify that actions array is not empty
- Check that the ContextMenuProvider is in the provider hierarchy

### Actions not working

- Verify that onClick handlers are properly defined
- Check browser console for any errors
- Ensure the action is not disabled

### Styling issues

- Verify that the ShadCN UI context menu styles are loaded
- Check for conflicting CSS
- Ensure Tailwind CSS is properly configured
