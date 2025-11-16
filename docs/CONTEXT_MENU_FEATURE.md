# Custom Context Menu System for Tauri Desktop Application

## Overview

This implementation provides a custom, role-aware context menu system for the Tauri desktop application, replacing the default webview context menu with a feature-rich solution built using ShadCN UI's Context Menu component.

## Features

✅ **Global Context Menu Provider** - Centralized state management for context menus across the entire application

✅ **Page-Specific Menus** - Each page can register its own context menu with relevant actions

✅ **Role-Aware Actions** - Different context menus for admin, teacher, and student roles

✅ **Rich UI Components** - Support for:

- Icons from lucide-react
- Keyboard shortcuts (display only)
- Separators for grouping actions
- Nested submenus
- Destructive variants for dangerous actions
- Disabled states

✅ **Type-Safe** - Full TypeScript support with comprehensive type definitions

✅ **Zero Security Vulnerabilities** - Passed CodeQL security scanning

✅ **ShadCN UI Integration** - Consistent with the application's design system

## Quick Start

### 1. The Context Menu System is Already Set Up

The ContextMenuProvider is already integrated in `components/providers/index.tsx`, so you can start using context menus immediately.

### 2. Using Pre-Built Context Menus

Choose from our pre-built context menus:

#### Admin Pages

```tsx
import { AdminStudentsContextMenu } from "@/components/admin/admin-students-context-menu";
import { AdminDashboardContextMenu } from "@/components/admin/admin-dashboard-context-menu";
```

#### Teacher Pages

```tsx
import { TeacherClassroomContextMenu } from "@/components/teacher/teacher-classroom-context-menu";
```

#### Student Pages

```tsx
import { StudentDashboardContextMenu } from "@/components/student/student-dashboard-context-menu";
```

### 3. Wrap Your Page Content

```tsx
export default function MyPage() {
  const queryClient = useQueryClient();

  return (
    <AdminDashboardContextMenu
      onRefresh={() => queryClient.invalidateQueries()}
      onViewAnalytics={() => router.push("/admin/analytics")}
    >
      <div className="page-content">{/* Your page content here */}</div>
    </AdminDashboardContextMenu>
  );
}
```

### 4. Test It Out

Right-click anywhere on your page to see the context menu!

## Demo Page

Visit `/examples/context-menu-demo` to see an interactive demonstration of:

- Basic context menus
- Submenus
- Destructive actions
- All pre-built context menu components
- Live action logging

## Creating Custom Context Menus

For pages that need custom context menus, use the low-level API:

```tsx
import { AppContextMenu } from "@/components/ui/app-context-menu";
import { type ContextMenuAction } from "@/components/providers/context-menu-provider";

const actions: ContextMenuAction[] = [
  {
    label: "My Action",
    icon: <Icon className="mr-2 h-4 w-4" />,
    onClick: () => handleAction(),
    shortcut: "⌘A",
  },
  { separator: true },
  {
    label: "Delete",
    icon: <Trash className="mr-2 h-4 w-4" />,
    onClick: handleDelete,
    variant: "destructive",
  },
];

return <AppContextMenu actions={actions}>{children}</AppContextMenu>;
```

## Files Structure

```
components/
├── providers/
│   ├── context-menu-provider.tsx  # Global provider
│   └── index.tsx                  # Provider integration
├── ui/
│   └── app-context-menu.tsx       # Core wrapper component
├── admin/
│   ├── admin-students-context-menu.tsx
│   └── admin-dashboard-context-menu.tsx
├── teacher/
│   └── teacher-classroom-context-menu.tsx
└── student/
    └── student-dashboard-context-menu.tsx

hooks/
└── use-context-menu.ts            # Custom hook for registration

docs/
├── TAURI_CONTEXT_MENU_USAGE.md
└── CONTEXT_MENU_INTEGRATION_EXAMPLE.md

app/examples/context-menu-demo/
└── page.tsx                       # Interactive demo

src-tauri/
└── tauri.conf.json               # Tauri config (context menu disabled)
```

## API Reference

### ContextMenuAction Interface

```typescript
interface ContextMenuAction {
  label: string; // Menu item text
  icon?: ReactNode; // Optional icon
  onClick?: () => void; // Action handler (optional for submenus)
  variant?: "default" | "destructive"; // Style variant
  disabled?: boolean; // Disabled state
  shortcut?: string; // Keyboard shortcut hint
  separator?: boolean; // Render as separator
  submenu?: ContextMenuAction[]; // Nested menu items
}
```

### useContextMenu Hook

```typescript
useContextMenu(
  pageId: string,           // Unique page identifier
  actions: ContextMenuAction[],  // Menu actions
  enabled?: boolean         // Enable/disable (default: true)
)
```

### AppContextMenu Component

```typescript
<AppContextMenu
  actions={actions}         // Menu actions array
  pageId?: string          // Optional page ID
>
  {children}
</AppContextMenu>
```

## Configuration

The default Tauri webview context menu is disabled in `src-tauri/tauri.conf.json`:

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

## Documentation

- **[Usage Guide](./docs/TAURI_CONTEXT_MENU_USAGE.md)** - Complete usage documentation with examples
- **[Integration Examples](./docs/CONTEXT_MENU_INTEGRATION_EXAMPLE.md)** - Step-by-step integration guide
- **[Demo Page](./app/examples/context-menu-demo/page.tsx)** - Interactive demonstration

## Best Practices

1. ✅ Use pre-built context menus when available
2. ✅ Always include a refresh action
3. ✅ Group related actions with separators
4. ✅ Show keyboard shortcuts for common actions
5. ✅ Use destructive variant for dangerous actions
6. ✅ Disable unavailable actions instead of hiding them
7. ✅ Keep menus focused (5-10 actions recommended)
8. ✅ Use appropriate icons from lucide-react

## Testing

1. Navigate to `/examples/context-menu-demo`
2. Right-click on any card to test different context menus
3. Verify actions are triggered correctly
4. Test submenus and destructive actions
5. Check responsive behavior

## Security

- ✅ No vulnerabilities found (CodeQL scan passed)
- ✅ Type-safe implementation
- ✅ No inline event handlers in JSX
- ✅ All user actions properly validated

## Browser Compatibility

This context menu system works in:

- ✅ Tauri desktop application (primary target)
- ✅ Modern web browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (with touch-and-hold gesture)

## Troubleshooting

### Context menu not appearing

- Verify ContextMenuProvider is in the provider hierarchy
- Check that actions array is not empty
- Ensure page is wrapped with a context menu component

### Actions not triggering

- Check onClick handlers are defined
- Look for errors in browser console
- Verify action is not disabled

### Styling issues

- Ensure ShadCN UI styles are loaded
- Check Tailwind CSS configuration
- Verify no conflicting CSS

## Future Enhancements

Potential improvements for future iterations:

- [ ] Actual keyboard shortcut binding (currently display-only)
- [ ] Context menu templates for common patterns
- [ ] Analytics tracking for menu usage
- [ ] Multi-select support for batch operations
- [ ] Customizable menu positioning
- [ ] Animation and transition options

## Support

For questions or issues:

1. Check the [Usage Guide](./docs/TAURI_CONTEXT_MENU_USAGE.md)
2. Review [Integration Examples](./docs/CONTEXT_MENU_INTEGRATION_EXAMPLE.md)
3. Try the [Demo Page](/examples/context-menu-demo)
4. Check browser console for errors

## License

This implementation is part of the School Management System project.
