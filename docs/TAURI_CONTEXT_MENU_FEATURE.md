# Tauri App Context Menu System - Feature Implementation

## 🎯 Objective

Implement a custom context menu system for the Tauri desktop application using ShadCN UI's Context Menu component. This system will replace the default webview context menus throughout the app with custom, page-specific, and component-aware context menus.

## 📋 Requirements

### Core Features

1. **Global Context Menu Provider**
   - Wrap the entire app with a `ContextMenuProvider`
   - Manage context menu state globally
   - Handle menu item registration and actions
   - Disable default webview context menus

2. **Page-Specific Context Menus**
   - Different context menus for different routes (admin, teacher, student)
   - Context-aware actions based on the current page
   - Component-level context menus for specific UI elements

3. **Dynamic Menu Actions**
   - Actions change based on:
     - Current user role (admin, teacher, student)
     - Current page/route
     - Component clicked
     - Data associated with the component (e.g., student ID, classroom ID)

4. **ShadCN UI Integration**
   - Use `@/components/ui/context-menu` from ShadCN UI
   - Maintain consistent design with the rest of the app
   - Support for nested menus, separators, and shortcuts

## 🏗️ Architecture

### 1. Context Menu Provider

**File:** `components/providers/context-menu-provider.tsx`

```typescript
"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { useSession } from "@/lib/auth-client";

interface ContextMenuAction {
  id: string;
  name: string;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
  func: (data: any) => void | Promise<void>;
}

interface ContextMenuConfig {
  id: string;
  actions: ContextMenuAction[];
  data?: any;
}

interface ContextMenuContextType {
  registerMenu: (config: ContextMenuConfig) => void;
  unregisterMenu: (id: string) => void;
  getMenuActions: (id: string) => ContextMenuAction[] | undefined;
  executeAction: (menuId: string, actionId: string, data?: any) => void;
}

const ContextMenuContext = createContext<ContextMenuContextType | undefined>(undefined);

export function ContextMenuProvider({ children }: { children: React.ReactNode }) {
  const [menus, setMenus] = useState<Map<string, ContextMenuConfig>>(new Map());
  const { data: session } = useSession();

  const registerMenu = useCallback((config: ContextMenuConfig) => {
    setMenus((prev) => new Map(prev).set(config.id, config));
  }, []);

  const unregisterMenu = useCallback((id: string) => {
    setMenus((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const getMenuActions = useCallback((id: string) => {
    return menus.get(id)?.actions;
  }, [menus]);

  const executeAction = useCallback((menuId: string, actionId: string, data?: any) => {
    const menu = menus.get(menuId);
    if (!menu) return;

    const action = menu.actions.find((a) => a.id === actionId);
    if (!action) return;

    action.func(data || menu.data);
  }, [menus]);

  return (
    <ContextMenuContext.Provider
      value={{
        registerMenu,
        unregisterMenu,
        getMenuActions,
        executeAction,
      }}
    >
      {children}
    </ContextMenuContext.Provider>
  );
}

export function useContextMenuProvider() {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error("useContextMenuProvider must be used within ContextMenuProvider");
  }
  return context;
}
```

### 2. Context Menu Hook

**File:** `hooks/use-context-menu.ts`

```typescript
"use client";

import { useEffect } from "react";
import { useContextMenuProvider } from "@/components/providers/context-menu-provider";

interface ContextMenuAction {
  id: string;
  name: string;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
  func: (data: any) => void | Promise<void>;
}

interface UseContextMenuProps {
  id: string;
  actions: ContextMenuAction[];
  data?: any;
}

export function useContextMenu({ id, actions, data }: UseContextMenuProps) {
  const { registerMenu, unregisterMenu } = useContextMenuProvider();

  useEffect(() => {
    registerMenu({ id, actions, data });

    return () => {
      unregisterMenu(id);
    };
  }, [id, actions, data, registerMenu, unregisterMenu]);
}
```

### 3. Context Menu Component Wrapper

**File:** `components/ui/app-context-menu.tsx`

```typescript
"use client";

import React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useContextMenuProvider } from "@/components/providers/context-menu-provider";

interface AppContextMenuProps {
  menuId: string;
  children: React.ReactNode;
  data?: any;
}

export function AppContextMenu({ menuId, children, data }: AppContextMenuProps) {
  const { getMenuActions, executeAction } = useContextMenuProvider();
  const actions = getMenuActions(menuId);

  if (!actions || actions.length === 0) {
    return <>{children}</>;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {actions.map((action, index) => {
          if (action.separator) {
            return <ContextMenuSeparator key={`separator-${index}`} />;
          }

          return (
            <ContextMenuItem
              key={action.id}
              disabled={action.disabled}
              onClick={() => executeAction(menuId, action.id, data)}
            >
              {action.icon && <action.icon className="mr-2 h-4 w-4" />}
              {action.name}
              {action.shortcut && <ContextMenuShortcut>{action.shortcut}</ContextMenuShortcut>}
            </ContextMenuItem>
          );
        })}
      </ContextMenuContent>
    </ContextMenu>
  );
}
```

### 4. Disable Default Webview Context Menu

**File:** `src-tauri/src/main.rs` (Update)

```rust
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
            }

            // Disable default context menu
            let window = app.get_window("main").unwrap();
            window.eval("document.addEventListener('contextmenu', event => event.preventDefault());")?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Alternative:** Add to `app/layout.tsx` for Next.js handling:

```typescript
// Add to root layout
useEffect(() => {
  // Disable default context menu in Tauri
  if (typeof window !== "undefined" && window.__TAURI__) {
    document.addEventListener("contextmenu", (e) => e.preventDefault());
  }
}, []);
```

## 📝 Implementation Examples

### Example 1: Admin Student Management Context Menu

**File:** `app/admin/students/page.tsx`

```typescript
"use client";

import { useContextMenu } from "@/hooks/use-context-menu";
import { AppContextMenu } from "@/components/ui/app-context-menu";
import { Edit, Trash2, Mail, Eye, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState([]);

  // Define student card context menu
  useContextMenu({
    id: "student-card-menu",
    actions: [
      {
        id: "view-details",
        name: "View Details",
        icon: Eye,
        shortcut: "⌘V",
        func: (studentId) => {
          router.push(`/admin/students/${studentId}`);
        },
      },
      {
        id: "edit-student",
        name: "Edit Student",
        icon: Edit,
        shortcut: "⌘E",
        func: (studentId) => {
          router.push(`/admin/students/${studentId}/edit`);
        },
      },
      {
        id: "send-email",
        name: "Send Email",
        icon: Mail,
        func: async (studentId) => {
          // Email logic
          toast.success("Email sent");
        },
      },
      {
        id: "separator-1",
        name: "",
        separator: true,
        func: () => {},
      },
      {
        id: "export-data",
        name: "Export Student Data",
        icon: Download,
        func: async (studentId) => {
          // GDPR export logic
          toast.success("Data exported");
        },
      },
      {
        id: "separator-2",
        name: "",
        separator: true,
        func: () => {},
      },
      {
        id: "delete-student",
        name: "Delete Student",
        icon: Trash2,
        shortcut: "⌘⌫",
        func: async (studentId) => {
          if (confirm("Are you sure?")) {
            // Delete logic
            toast.success("Student deleted");
          }
        },
      },
    ],
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {students.map((student) => (
        <AppContextMenu key={student.id} menuId="student-card-menu" data={student.id}>
          <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{student.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Grade: {student.grade}</p>
              <p>Roll No: {student.rollNumber}</p>
            </CardContent>
          </Card>
        </AppContextMenu>
      ))}
    </div>
  );
}
```

### Example 2: Admin Dashboard Context Menu

**File:** `app/admin/page.tsx`

```typescript
"use client";

import { useContextMenu } from "@/hooks/use-context-menu";
import { AppContextMenu } from "@/components/ui/app-context-menu";
import { RefreshCw, Download, Settings, BarChart } from "lucide-react";

export default function AdminDashboard() {
  useContextMenu({
    id: "dashboard-menu",
    actions: [
      {
        id: "refresh-stats",
        name: "Refresh Statistics",
        icon: RefreshCw,
        shortcut: "⌘R",
        func: async () => {
          await queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
          toast.success("Statistics refreshed");
        },
      },
      {
        id: "export-report",
        name: "Export Dashboard Report",
        icon: Download,
        func: async () => {
          // Export logic
          toast.success("Report exported");
        },
      },
      {
        id: "separator-1",
        name: "",
        separator: true,
        func: () => {},
      },
      {
        id: "dashboard-settings",
        name: "Dashboard Settings",
        icon: Settings,
        func: () => {
          router.push("/admin/settings");
        },
      },
      {
        id: "view-analytics",
        name: "View Analytics",
        icon: BarChart,
        shortcut: "⌘A",
        func: () => {
          router.push("/admin/analytics");
        },
      },
    ],
  });

  return (
    <AppContextMenu menuId="dashboard-menu">
      <div className="space-y-6">
        {/* Dashboard content */}
      </div>
    </AppContextMenu>
  );
}
```

### Example 3: Teacher Classroom Context Menu

**File:** `app/teacher/classes/page.tsx`

```typescript
"use client";

import { useContextMenu } from "@/hooks/use-context-menu";
import { AppContextMenu } from "@/components/ui/app-context-menu";
import { Users, BookOpen, CheckSquare, MessageSquare } from "lucide-react";

export default function TeacherClassesPage() {
  useContextMenu({
    id: "classroom-card-menu",
    actions: [
      {
        id: "view-students",
        name: "View Students",
        icon: Users,
        func: (classroomId) => {
          router.push(`/teacher/classes/${classroomId}/students`);
        },
      },
      {
        id: "view-timetable",
        name: "View Timetable",
        icon: BookOpen,
        func: (classroomId) => {
          router.push(`/teacher/classes/${classroomId}/timetable`);
        },
      },
      {
        id: "mark-attendance",
        name: "Mark Attendance",
        icon: CheckSquare,
        shortcut: "⌘A",
        func: (classroomId) => {
          router.push(`/teacher/classes/${classroomId}/attendance`);
        },
      },
      {
        id: "send-message",
        name: "Send Class Message",
        icon: MessageSquare,
        func: (classroomId) => {
          // Open message dialog
        },
      },
    ],
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {classrooms.map((classroom) => (
        <AppContextMenu key={classroom.id} menuId="classroom-card-menu" data={classroom.id}>
          <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
            {/* Classroom card content */}
          </Card>
        </AppContextMenu>
      ))}
    </div>
  );
}
```

## 🎯 Implementation Priority

### Phase 1: Core Infrastructure (Week 1)
1. ✅ Create `ContextMenuProvider` component
2. ✅ Create `useContextMenu` hook
3. ✅ Create `AppContextMenu` wrapper component
4. ✅ Disable default webview context menus
5. ✅ Test basic functionality

### Phase 2: Admin Portal (Week 2)
1. ✅ Admin dashboard context menu
2. ✅ Student management context menus
3. ✅ Teacher management context menus
4. ✅ Classroom management context menus
5. ✅ Admission management context menus

### Phase 3: Teacher Portal (Week 3)
1. ✅ Teacher dashboard context menu
2. ✅ Classroom card context menus
3. ✅ Student card context menus
4. ✅ Homework management context menus
5. ✅ Attendance marking context menus

### Phase 4: Student Portal (Week 4)
1. ✅ Student dashboard context menu
2. ✅ Homework submission context menus
3. ✅ Grade view context menus
4. ✅ Timetable context menus

### Phase 5: Polish & Optimization (Week 5)
1. ✅ Add keyboard shortcuts
2. ✅ Optimize performance
3. ✅ Add animations/transitions
4. ✅ User testing and feedback
5. ✅ Documentation

## 📚 Context Menu Patterns

### Pattern 1: Data Card Context Menu
```typescript
// For cards displaying data (students, teachers, classrooms)
actions: [
  { view: "View Details" },
  { edit: "Edit" },
  { separator },
  { export: "Export Data" },
  { separator },
  { delete: "Delete" (destructive) }
]
```

### Pattern 2: Dashboard Context Menu
```typescript
// For dashboard sections
actions: [
  { refresh: "Refresh" },
  { export: "Export Report" },
  { separator },
  { settings: "Settings" },
  { analytics: "View Analytics" }
]
```

### Pattern 3: Table Row Context Menu
```typescript
// For table rows
actions: [
  { view: "View" },
  { edit: "Edit" },
  { duplicate: "Duplicate" },
  { separator },
  { archive: "Archive" },
  { delete: "Delete" }
]
```

## 🔐 Role-Based Menu Items

```typescript
import { useSession } from "@/lib/auth-client";

function useRoleBasedActions() {
  const { data: session } = useSession();
  
  const getActions = (baseActions: ContextMenuAction[]) => {
    return baseActions.filter(action => {
      // Filter actions based on role
      if (action.requiresRole) {
        return action.requiresRole.includes(session?.user?.role);
      }
      return true;
    });
  };

  return { getActions };
}
```

## 🧪 Testing Checklist

- [ ] Context menus appear on right-click
- [ ] Default context menu is disabled
- [ ] Menu actions execute correctly
- [ ] Keyboard shortcuts work
- [ ] Menu items are role-aware
- [ ] Multiple menus can coexist on same page
- [ ] Menus are properly cleaned up on unmount
- [ ] Performance is acceptable with many context menus
- [ ] Works in both development and production builds
- [ ] Tauri-specific features work correctly

## 📖 Documentation

Create user documentation in `docs/TAURI_CONTEXT_MENU_USAGE.md`:

1. How to use context menus as an end user
2. Keyboard shortcuts reference
3. Available context menus by page
4. Tips and tricks

## 🚀 Success Criteria

- ✅ Default context menus disabled throughout app
- ✅ Custom context menus on 80%+ of admin pages
- ✅ Custom context menus on 60%+ of teacher pages
- ✅ Custom context menus on 40%+ of student pages
- ✅ All menu actions work as expected
- ✅ Performance: <50ms menu rendering time
- ✅ Zero console errors or warnings
- ✅ User feedback is positive

---

**Start Date:** TBD  
**Expected Completion:** 5 weeks  
**Assigned To:** AI Code Agent  

**Dependencies:**
- ShadCN UI Context Menu component
- Tauri desktop app setup
- Existing admin/teacher/student portals
