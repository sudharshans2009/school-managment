# Context Menu Integration Example

This document demonstrates how to integrate the custom context menu system into an existing page.

## Example: Admin Dashboard Page

### Before Integration

```tsx
"use client";

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useQuery } from "@tanstack/react-query";

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchStats,
  });

  return (
    <DashboardLayout title="Dashboard" description="Admin Portal">
      <div className="space-y-6">{/* Dashboard content */}</div>
    </DashboardLayout>
  );
}
```

### After Integration

```tsx
"use client";

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminDashboardContextMenu } from "@/components/admin/admin-dashboard-context-menu";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchStats,
  });

  return (
    <DashboardLayout title="Dashboard" description="Admin Portal">
      <AdminDashboardContextMenu
        onRefresh={() =>
          queryClient.invalidateQueries({ queryKey: ["admin-stats"] })
        }
        onViewAnalytics={() => router.push("/admin/analytics")}
        onViewUsers={() => router.push("/admin/users")}
        onViewCalendar={() => router.push("/admin/calendar")}
      >
        <div className="space-y-6">{/* Dashboard content */}</div>
      </AdminDashboardContextMenu>
    </DashboardLayout>
  );
}
```

## What Changed?

1. **Import the context menu component**

   ```tsx
   import { AdminDashboardContextMenu } from "@/components/admin/admin-dashboard-context-menu";
   ```

2. **Import necessary hooks**

   ```tsx
   import { useQueryClient } from "@tanstack/react-query";
   import { useRouter } from "next/navigation";
   ```

3. **Wrap your content**

   ```tsx
   <AdminDashboardContextMenu
     onRefresh={handleRefresh}
     onViewAnalytics={handleViewAnalytics}
     // ... other handlers
   >
     {/* Your existing content */}
   </AdminDashboardContextMenu>
   ```

4. **Define action handlers**

   ```tsx
   const queryClient = useQueryClient();
   const router = useRouter();

   const handleRefresh = () => {
     queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
   };

   const handleViewAnalytics = () => {
     router.push("/admin/analytics");
   };
   ```

## Result

Now when users right-click anywhere on the admin dashboard page, they will see a context menu with:

- Quick navigation options (Analytics, Users, Calendar)
- Refresh action to reload data
- Optional settings and notifications

The context menu is:

- ✅ Role-aware (only shows for admin users)
- ✅ Page-specific (different pages have different menus)
- ✅ Customizable (you can add/remove actions as needed)
- ✅ Accessible (keyboard shortcuts are displayed)
- ✅ Consistent with the app's design system (ShadCN UI)

## Testing the Integration

1. **Run the app in Tauri dev mode:**

   ```bash
   npm run tauri:dev
   ```

2. **Navigate to the admin dashboard**

3. **Right-click anywhere on the page**

4. **Verify the context menu appears** with the configured actions

5. **Click on menu items** to ensure they trigger the correct actions

## Additional Examples

### Example 1: Student List Page with Submenu

```tsx
const actions: ContextMenuAction[] = [
  {
    label: "Add Student",
    icon: <UserPlus className="mr-2 h-4 w-4" />,
    onClick: () => setAddDialogOpen(true),
  },
  {
    label: "Export",
    icon: <Download className="mr-2 h-4 w-4" />,
    submenu: [
      {
        label: "Export as CSV",
        onClick: () => exportAsCSV(),
      },
      {
        label: "Export as PDF",
        onClick: () => exportAsPDF(),
      },
      {
        label: "Export as Excel",
        onClick: () => exportAsExcel(),
      },
    ],
  },
  { separator: true },
  {
    label: "Delete Selected",
    icon: <Trash2 className="mr-2 h-4 w-4" />,
    onClick: handleDeleteSelected,
    variant: "destructive",
    disabled: selectedStudents.length === 0,
  },
];
```

### Example 2: Disabled Actions

```tsx
const actions: ContextMenuAction[] = [
  {
    label: "Edit",
    icon: <Edit className="mr-2 h-4 w-4" />,
    onClick: handleEdit,
    disabled: !selectedItem, // Disabled when no item is selected
  },
  {
    label: "Delete",
    icon: <Trash className="mr-2 h-4 w-4" />,
    onClick: handleDelete,
    variant: "destructive",
    disabled: !selectedItem || selectedItem.protected,
  },
];
```

### Example 3: Dynamic Actions Based on State

```tsx
const actions: ContextMenuAction[] = [
  {
    label: isEditing ? "Save Changes" : "Edit Mode",
    icon: isEditing ? (
      <Save className="mr-2 h-4 w-4" />
    ) : (
      <Edit className="mr-2 h-4 w-4" />
    ),
    onClick: isEditing ? handleSave : handleEdit,
  },
  {
    label: "Cancel",
    icon: <X className="mr-2 h-4 w-4" />,
    onClick: handleCancel,
    disabled: !isEditing,
  },
];
```

## Common Patterns

### Pattern 1: Refresh Data

```tsx
onRefresh={() => queryClient.invalidateQueries({ queryKey: ["data-key"] })}
```

### Pattern 2: Navigate to Page

```tsx
onNavigate={() => router.push("/path/to/page")}
```

### Pattern 3: Open Dialog

```tsx
onOpenDialog={() => setDialogOpen(true)}
```

### Pattern 4: Trigger Mutation

```tsx
onAction={() => mutation.mutate(data)}
```

### Pattern 5: Download/Export

```tsx
onExport={() => {
  const csv = generateCSV(data);
  downloadFile(csv, "export.csv");
}}
```

## Best Practices Summary

1. ✅ Always provide a refresh action
2. ✅ Group related actions with separators
3. ✅ Use descriptive labels and appropriate icons
4. ✅ Show keyboard shortcuts for common actions
5. ✅ Disable actions that are not currently available
6. ✅ Use destructive variant for dangerous actions
7. ✅ Keep menus focused and concise (5-10 actions max)
8. ✅ Test context menus in different states and roles
