# Build Warnings Documentation

## Tauri Plugin Warnings

### Expected Warnings

When running `bun run build`, you may see these warnings:

```
Turbopack build encountered 2 warnings:
- Module not found: Can't resolve '@tauri-apps/plugin-process'
- Module not found: Can't resolve '@tauri-apps/plugin-updater'
```

### Why These Warnings Appear

These warnings are **expected and safe to ignore** for web builds because:

1. **Optional Dependencies**: The Tauri plugins are optional dependencies only needed for desktop app builds
2. **Graceful Fallback**: The code already includes try-catch blocks in `components/app-quick-actions.tsx` to handle missing plugins
3. **Web-First Design**: The web version of the app doesn't need these plugins - they're only used when building the Tauri desktop app

### Code Pattern

```typescript
// components/app-quick-actions.tsx
try {
  // @ts-expect-error - Optional Tauri plugins
  updaterModule = await import("@tauri-apps/plugin-updater");
  // @ts-expect-error - Optional Tauri plugins
  processModule = await import("@tauri-apps/plugin-process");
} catch {
  console.warn("Tauri updater/process plugins not available");
  alert("Update feature is not available in this build.");
}
```

### When to Address

These warnings should **only** be addressed if:
- You're building the desktop app with Tauri (`TAURI_BUILD=true`)
- Users report that the desktop app update feature isn't working
- You want to add the plugins to package.json for desktop builds

### How to Install (Optional)

If you plan to build the desktop app, install these plugins:

```bash
bun add @tauri-apps/plugin-process @tauri-apps/plugin-updater
```

## Event Registration Schema Fix

### Issue Fixed

The `EventRegistration` interface was using outdated field names that didn't match the database schema:

**Old (Incorrect)**:
- `registrationStatus` → Should be `status`
- `attendedAt` → Removed (not in schema)
- `remarks` → Should be `notes`

**New (Correct)**:
```typescript
export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  studentId: string | null;
  status: "registered" | "attended" | "absent" | "cancelled";
  registeredAt: Date | null;
  notes: string | null;
  userName?: string | null;
  studentName?: string | null;
}
```

### Database Schema (Reference)

```typescript
// database/schema.ts
export const eventRegistrations = pgTable("event_registrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }),
  status: registrationStatusEnum("status").notNull().default("registered"),
  registeredAt: timestamp("registered_at").defaultNow(),
  notes: text("notes"),
});
```

### Files Updated

1. `actions/events.ts`:
   - Fixed `EventRegistration` interface definition
   - Updated `registerForEvent()` - changed `registrationStatus` to `status`
   - Updated `cancelRegistration()` - changed `registrationStatus` to `status`
   - Updated `getEventRegistrations()` - changed all field names to match schema

## Build Status

✅ **All TypeScript errors resolved**  
✅ **Build completes successfully**  
✅ **73 pages generated**  
⚠️ **2 expected warnings for optional Tauri plugins**

---

**Last Updated**: December 2024  
**Related Docs**: TAURI_SETUP.md, SCHEMA_REFERENCE.md
