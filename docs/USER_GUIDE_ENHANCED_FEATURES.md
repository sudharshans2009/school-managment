# Using the Enhanced Tauri Features

## Quick Start Guide

### For End Users

1. **Download the Native App**

   - Visit the [Downloads Page](/downloads)
   - Select your platform (Windows, macOS, iOS, or Android)
   - Download and install the app

2. **Platform-Specific Installation**

   **Windows:**

   - Download the `.msi` installer
   - Double-click to install
   - Allow Windows Defender SmartScreen if prompted

   **macOS:**

   - Download the `.dmg` file
   - Open and drag to Applications
   - Right-click and select "Open" on first launch (if needed)

   **iOS:**

   - Download via TestFlight or direct IPA
   - Install through Xcode or Apple Configurator
   - Trust the developer certificate in Settings

   **Android:**

   - Download the `.apk` file
   - Enable "Install from Unknown Sources"
   - Open and install

3. **Key Features to Try**

   **Notifications:**

   - Enable in system settings for best experience
   - Receive attendance reminders and event alerts

   **Keyboard Shortcuts:**

   - `Cmd/Ctrl + Shift + S` - Quick Search
   - `Cmd/Ctrl + Shift + A` - Quick Attendance
   - `Cmd/Ctrl + Shift + T` - Toggle Window

   **System Tray (Desktop):**

   - Look for the app icon in your system tray
   - Right-click for quick actions
   - Click to show/hide the main window

### For Developers

1. **Installation**

   ```bash
   cd src-tauri
   cargo build
   ```

2. **Development**

   ```bash
   bun run tauri:dev
   ```

3. **Using Features in Your Code**

   ```typescript
   import { useTauriFeatures } from "@/hooks/use-tauri-features";

   function MyComponent() {
     const { isTauri, sendNotification, saveFile, checkForUpdates } =
       useTauriFeatures();

     // Send notification
     const handleNotify = async () => {
       await sendNotification("Title", "Message");
     };

     // Save file
     const handleExport = async () => {
       await saveFile("report.csv", csvData);
     };

     // Check updates
     useEffect(() => {
       if (isTauri) {
         checkForUpdates();
       }
     }, [isTauri]);

     return <button onClick={handleNotify}>Send Notification</button>;
   }
   ```

4. **Available Commands**

   All Tauri commands are automatically available through the hook:

   - `sendNotification(title, body)`
   - `sendNotificationWithIcon(title, body, icon)`
   - `saveFile(filename, content)`
   - `readFile(path)`
   - `checkForUpdates()`
   - `installUpdate()`
   - `toggleWindow()`
   - `quickSearch()`
   - `quickAttendance()`

5. **Building for Production**

   ```bash
   # Build for current platform
   bun run tauri:build

   # Build for specific platform
   bun run tauri:build -- --target [target]
   ```

## Feature Highlights

### 1. System Notifications

**What it does:**

- Sends system-level notifications for important events
- Works across all platforms with native styling
- Supports custom icons and actions

**Use cases:**

- Attendance reminders
- Event notifications
- New announcements
- Grade updates

**Example:**

```typescript
await sendNotification(
  "Attendance Reminder",
  "Don't forget to mark today's attendance!"
);
```

### 2. File System Integration

**What it does:**

- Native file dialogs for save/open operations
- Folder selection for CSV exports
- File metadata reading

**Use cases:**

- Export attendance reports
- Save grade sheets
- Import student data

**Example:**

```typescript
const csvData = generateReport();
const path = await saveFile("attendance-report.csv", csvData);
console.log(`Saved to: ${path}`);
```

### 3. Auto-Updater

**What it does:**

- Checks for updates on startup
- Downloads and installs updates automatically
- Shows update progress and release notes

**Use cases:**

- Keep app up-to-date with latest features
- Security patches
- Bug fixes

**Example:**

```typescript
const update = await checkForUpdates();
if (update?.available) {
  // Show update notification
  await installUpdate();
}
```

### 4. Global Shortcuts

**What it does:**

- System-wide keyboard shortcuts
- Work even when app is in background
- Customizable per user preference

**Use cases:**

- Quick search from anywhere
- Fast attendance marking
- Toggle window visibility

**Shortcuts:**

- `Cmd/Ctrl + Shift + S` → Quick Search
- `Cmd/Ctrl + Shift + A` → Quick Attendance
- `Cmd/Ctrl + Shift + T` → Toggle Window

### 5. System Tray (Desktop Only)

**What it does:**

- Keeps app running in background
- Quick access from system tray
- Context menu with common actions

**Use cases:**

- Keep notifications active
- Quick access without taskbar space
- Background operation

## Platform Comparison

| Feature       | Windows | macOS | iOS | Android | Linux |
| ------------- | ------- | ----- | --- | ------- | ----- |
| Notifications | ✅      | ✅    | ✅  | ✅      | 🚧    |
| System Tray   | ✅      | ✅    | ❌  | ❌      | 🚧    |
| Auto-Update   | ✅      | ✅    | ✅  | ✅      | 🚧    |
| File Dialogs  | ✅      | ✅    | ✅  | ✅      | 🚧    |
| Shortcuts     | ✅      | ✅    | ❌  | ❌      | 🚧    |
| Offline Mode  | ✅      | ✅    | ✅  | ✅      | 🚧    |

## Troubleshooting

### Notifications Not Showing

1. **Check System Settings**

   - macOS: System Settings → Notifications
   - Windows: Settings → Notifications
   - iOS: Settings → Notifications
   - Android: Settings → Apps → Notifications

2. **App Permissions**

   - Ensure notification permission is granted
   - Check "Do Not Disturb" mode is off

3. **Restart App**
   - Close and reopen the application
   - Check if notifications work after restart

### Keyboard Shortcuts Not Working

1. **Check for Conflicts**

   - Another app might be using the same shortcut
   - Try changing the shortcut in settings

2. **Accessibility Permission (macOS)**

   - System Settings → Privacy & Security → Accessibility
   - Add the app to allowed list

3. **Background Execution**
   - Ensure app has permission to run in background

### File Operations Failing

1. **Check Permissions**

   - Verify app has file system access
   - Grant necessary permissions in system settings

2. **Storage Space**

   - Ensure sufficient disk space available
   - Check file size limits

3. **File Paths**
   - Use absolute paths
   - Avoid special characters in filenames

### Updates Not Installing

1. **Internet Connection**

   - Check network connectivity
   - Verify firewall allows app connections

2. **Disk Space**

   - Ensure sufficient space for update
   - Typically need 2x the app size

3. **Permissions**
   - May need admin/elevated permissions
   - Close all instances of the app

## Best Practices

### For Users

1. **Enable Notifications** - Get timely reminders and alerts
2. **Learn Shortcuts** - Save time with keyboard shortcuts
3. **Keep Updated** - Install updates when available
4. **Use Native Features** - Take advantage of platform-specific capabilities

### For Developers

1. **Check `isTauri`** - Always verify before using native features
2. **Handle Errors** - Provide fallbacks for failed operations
3. **Test Platforms** - Test on all supported platforms
4. **Request Permissions** - Ask for permissions before using features
5. **Optimize Performance** - Use native features efficiently

## Resources

- [Complete Feature Documentation](./TAURI_ENHANCED_FEATURES.md)
- [API Reference](./QUICK_REFERENCE_TAURI.md)
- [Implementation Details](./IMPLEMENTATION_SUMMARY_ENHANCED_FEATURES.md)
- [What's New](./NEW_FEATURES_DECEMBER_2025.md)

## Support

Need help?

- 📖 Check the documentation
- 🐛 Report issues on GitHub
- 💬 Join our Discord community
- 📧 Contact support

---

**Version:** 1.0.0  
**Last Updated:** December 25, 2025  
**Platforms:** Windows, macOS, iOS, Android
