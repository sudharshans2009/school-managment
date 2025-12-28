# Quick Reference: Tauri Enhanced Features

## 🚀 Quick Start

### Install Hook

```typescript
import { useTauriFeatures } from "@/hooks/use-tauri-features";
```

### Check if Running in Tauri

```typescript
const { isTauri } = useTauriFeatures();
if (isTauri) {
  // Enable native features
}
```

## 📋 Common Use Cases

### Send a Notification

```typescript
const { sendNotification } = useTauriFeatures();
await sendNotification("Title", "Message body");
```

### Save a File

```typescript
const { saveFile } = useTauriFeatures();
const path = await saveFile("report.csv", csvData);
```

### Check for Updates

```typescript
const { checkForUpdates, installUpdate } = useTauriFeatures();
const update = await checkForUpdates();
if (update?.available) {
  await installUpdate();
}
```

### Open File Dialog

```typescript
const { selectFileDialog, readFile } = useTauriFeatures();
const path = await selectFileDialog();
if (path) {
  const content = await readFile(path);
}
```

### Get App Version

```typescript
const { appVersion } = useTauriFeatures();
console.log(`Version: ${appVersion}`);
```

## ⌨️ Keyboard Shortcuts

| Shortcut             | Action           | Function            |
| -------------------- | ---------------- | ------------------- |
| Cmd/Ctrl + Shift + S | Quick Search     | `quickSearch()`     |
| Cmd/Ctrl + Shift + A | Quick Attendance | `quickAttendance()` |
| Cmd/Ctrl + Shift + T | Toggle Window    | `toggleWindow()`    |

## 🔔 Notification Types

### Simple Notification

```typescript
sendNotification("Title", "Body");
```

### With Icon

```typescript
sendNotificationWithIcon("Title", "Body", "/icon.png");
```

### Request Permission

```typescript
const permission = await requestNotificationPermission();
```

## 📁 File Operations

### Save

```typescript
saveFile(filename: string, content: string)
```

### Read

```typescript
readFile(filePath: string)
```

### Get Info

```typescript
getFileInfo(filePath: string)
```

### Dialogs

```typescript
selectFileDialog(); // Returns: string | null
selectFolderDialog(); // Returns: string | null
```

## 🔄 Updater

### Check

```typescript
const update: UpdateInfo = await checkForUpdates();
// { version, current_version, available, download_url }
```

### Install

```typescript
await installUpdate();
```

### Get Version

```typescript
const version: string = await getAppVersion();
```

## 🪟 Window Control

### Toggle

```typescript
await toggleWindow();
```

### Quick Actions

```typescript
await quickSearch();
await quickAttendance();
```

## 🎯 Platform Support

| Feature       | Windows | macOS | iOS | Android | Linux |
| ------------- | ------- | ----- | --- | ------- | ----- |
| Notifications | ✅      | ✅    | ✅  | ✅      | 🚧    |
| System Tray   | ✅      | ✅    | ❌  | ❌      | 🚧    |
| Auto-Update   | ✅      | ✅    | ✅  | ✅      | 🚧    |
| File Dialogs  | ✅      | ✅    | ✅  | ✅      | 🚧    |
| Shortcuts     | ✅      | ✅    | ❌  | ❌      | 🚧    |

## 🔒 Permissions Required

### macOS

- Notifications
- Files and Folders
- Accessibility (for shortcuts)

### iOS

- Notifications
- Photo Library (for uploads)
- Files (for document access)

### Android

- Notifications
- Storage
- Background execution

### Windows

- None (handled by installer)

## 🐛 Error Handling

```typescript
try {
  await sendNotification("Test", "Message");
} catch (error) {
  console.error("Notification failed:", error);
  // Fallback to browser notification or UI alert
}
```

## 📦 TypeScript Types

```typescript
interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
}

interface FileInfo {
  name: string;
  path: string;
  size: number;
  modified: number;
}

interface UpdateInfo {
  version: string;
  current_version: string;
  available: boolean;
  download_url?: string;
}
```

## 🎨 Best Practices

1. **Always check `isTauri`** before using native features
2. **Handle errors gracefully** with fallbacks
3. **Request permissions** before using features
4. **Test on all platforms** before deploying
5. **Use TypeScript** for better type safety

## 📚 Further Reading

- [Complete Feature Guide](TAURI_ENHANCED_FEATURES.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY_ENHANCED_FEATURES.md)
- [App Download Feature](APP_DOWNLOAD_FEATURE.md)

---

**Last Updated**: December 25, 2025
