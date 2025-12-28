# Discord Rich Presence Integration

## Overview

The School Management System now supports Discord Rich Presence (RPC), allowing users to display their current activity in the application on their Discord profile. This feature enhances the user experience by showing what section of the app they're actively using.

## Features

- **Automatic Activity Tracking**: Updates Discord presence based on the current page/activity
- **Predefined Activity Presets**: Common school activities have pre-configured presence states
- **Customizable Presence**: Supports custom state, details, images, and timestamps
- **Settings UI**: Easy toggle to enable/disable Discord RPC
- **Error Handling**: Graceful fallback when Discord is not running
- **Privacy-Focused**: Only shares activity type, no personal or sensitive data

## Architecture

### Backend (Rust)

**Location**: `src-tauri/src/discord_rpc.rs`

The Discord RPC module provides the following Tauri commands:

- `init_discord_rpc()`: Initialize connection to Discord
- `update_discord_presence(DiscordPresenceData)`: Update the presence with custom data
- `clear_discord_presence()`: Clear/remove the current presence
- `disconnect_discord_rpc()`: Close the Discord connection
- `is_discord_connected()`: Check if connected to Discord

**Dependencies**: Uses the `discord-rich-presence` crate (v0.2)

### Frontend (TypeScript/React)

**Types**: `types/discord-rpc.ts`

- Defines TypeScript interfaces for presence data
- Provides `SchoolActivity` enum for common activities
- Includes `ACTIVITY_PRESETS` mapping for predefined configurations

**Hook**: `hooks/use-discord-rpc.ts`

- Custom React hook for managing Discord RPC state
- Handles initialization, updates, and disconnection
- Provides error handling and logging capabilities

**UI Component**: `components/settings/discord-rpc-settings-card.tsx`

- Settings card for enabling/disabling Discord RPC
- Shows connection status and helpful information
- Persists user preference in localStorage

## Setup

### 1. Discord Application Configuration

Before using Discord RPC, you need to create a Discord application and obtain an Application ID:

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Give it a name (e.g., "School Management System")
4. Copy the "Application ID"
5. Update the `DISCORD_APP_ID` constant in `src-tauri/src/discord_rpc.rs`:

```rust
const DISCORD_APP_ID: &str = "YOUR_APPLICATION_ID_HERE";
```

### 2. Add Rich Presence Assets (Optional)

To display custom images in the Discord presence:

1. In your Discord application settings, go to "Rich Presence" → "Art Assets"
2. Upload images for:

   - `school-logo`: Main school/application logo
   - `attendance-icon`: Attendance feature icon
   - `calendar-icon`: Calendar/timetable icon
   - `grades-icon`: Grades feature icon
   - `assignment-icon`: Assignments icon
   - `student-icon`: Student management icon
   - `teacher-icon`: Teacher management icon
   - `class-icon`: Class management icon
   - `report-icon`: Reports icon
   - `settings-icon`: Settings icon

3. The asset keys must match those defined in `types/discord-rpc.ts`

### 3. Build the Application

```bash
bun run tauri:build
```

## Usage

### Basic Usage in Components

```tsx
import { useDiscordRPC } from "@/hooks/use-discord-rpc";
import { SchoolActivity } from "@/types/discord-rpc";

function DashboardPage() {
  const { isConnected, updateActivityPreset } = useDiscordRPC({
    autoInit: true,
  });

  useEffect(() => {
    if (isConnected) {
      updateActivityPreset(SchoolActivity.VIEWING_DASHBOARD);
    }
  }, [isConnected]);

  return <div>Dashboard Content</div>;
}
```

### Custom Presence

```tsx
import { useDiscordRPC } from "@/hooks/use-discord-rpc";

function CustomPresence() {
  const { updatePresence } = useDiscordRPC({ autoInit: true });

  const showCustomActivity = async () => {
    await updatePresence({
      state: "Managing Students",
      details: "Editing student records",
      large_image_key: "school-logo",
      large_image_text: "Amrita Vidyalayam",
      small_image_key: "student-icon",
      small_image_text: "Student Management",
      start_timestamp: Math.floor(Date.now() / 1000),
    });
  };

  return <button onClick={showCustomActivity}>Show Custom Activity</button>;
}
```

### Activity Presets

The following activity presets are available out of the box:

- `VIEWING_DASHBOARD`: Main dashboard
- `VIEWING_ATTENDANCE`: Attendance management
- `VIEWING_TIMETABLE`: Timetable/schedule
- `VIEWING_GRADES`: Grade management
- `VIEWING_ASSIGNMENTS`: Homework/assignments
- `VIEWING_CALENDAR`: Calendar/events
- `MANAGING_STUDENTS`: Student administration
- `MANAGING_TEACHERS`: Teacher administration
- `MANAGING_CLASSES`: Classroom management
- `VIEWING_REPORTS`: Reports and analytics
- `IN_SETTINGS`: Application settings

### Settings Integration

Add the Discord RPC settings card to your settings page:

```tsx
import { DiscordRPCSettingsCard } from "@/components/settings/discord-rpc-settings-card";

function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Other settings cards */}
      <DiscordRPCSettingsCard />
    </div>
  );
}
```

## Hook Options

The `useDiscordRPC` hook accepts the following options:

```typescript
interface UseDiscordRPCOptions {
  autoInit?: boolean; // Auto-initialize on mount (default: false)
  autoDisconnectOnUnmount?: boolean; // Auto-disconnect on unmount (default: true)
  enableLogging?: boolean; // Enable console logging (default: false)
}
```

## Troubleshooting

### Discord RPC Not Connecting

1. **Discord Not Running**: Ensure Discord desktop app is running
2. **Wrong Application ID**: Verify the Application ID in `discord_rpc.rs` matches your Discord app
3. **Firewall/Permissions**: Check if Discord's IPC socket is accessible

### Connection Fails Silently

Enable logging to see detailed error messages:

```tsx
const { error } = useDiscordRPC({ enableLogging: true });
```

### Images Not Showing

1. Verify asset keys match exactly between code and Discord Developer Portal
2. Ensure assets are uploaded and approved in Discord Developer Portal
3. Asset names are case-sensitive

## Best Practices

1. **Enable in Settings**: Let users control Discord RPC via settings
2. **Graceful Degradation**: App should work normally even if Discord RPC fails
3. **Update on Navigation**: Update presence when users navigate to different sections
4. **Clear on Exit**: Clear presence when app closes (handled automatically)
5. **Privacy**: Only share activity type, never personal or sensitive information

## Privacy & Security

- **No Personal Data**: Only activity type is shared (e.g., "Viewing Dashboard")
- **No Student/Teacher Info**: Individual names, grades, or records are never shared
- **User Control**: Users can enable/disable the feature at any time
- **Local Only**: Communication happens locally between app and Discord client
- **Optional Feature**: Completely opt-in functionality

## API Reference

### Rust Commands

#### `init_discord_rpc() -> Result<String, String>`

Initialize Discord RPC connection.

#### `update_discord_presence(presence_data: DiscordPresenceData) -> Result<String, String>`

Update the Discord presence with new activity data.

#### `clear_discord_presence() -> Result<String, String>`

Clear/remove the current presence display.

#### `disconnect_discord_rpc() -> Result<String, String>`

Disconnect from Discord RPC.

#### `is_discord_connected() -> Result<bool, String>`

Check if currently connected to Discord.

### TypeScript Hook

#### `useDiscordRPC(options?: UseDiscordRPCOptions): UseDiscordRPCReturn`

Returns:

- `isConnected: boolean` - Connection status
- `isInitializing: boolean` - Initialization in progress
- `error: string | null` - Last error message
- `init: () => Promise<void>` - Initialize connection
- `disconnect: () => Promise<void>` - Disconnect
- `updatePresence: (data: DiscordPresenceData) => Promise<void>` - Update with custom data
- `updateActivityPreset: (activity: SchoolActivity, customDetails?: string) => Promise<void>` - Update with preset
- `clearPresence: () => Promise<void>` - Clear presence
- `checkConnection: () => Promise<void>` - Check connection status

## Future Enhancements

Potential improvements for future versions:

- [ ] Rich presence buttons (e.g., "Visit Website")
- [ ] Party/group support for collaborative features
- [ ] Spectate mode for shared screens
- [ ] Time-based activities (show elapsed time)
- [ ] More granular activity tracking
- [ ] Integration with calendar events
- [ ] Join/spectate features for smartboard sessions

## License

This feature is part of the School Management System and follows the same license as the main application.

## Support

For issues or questions about Discord RPC integration:

1. Check Discord Developer Documentation
2. Review this documentation
3. Check application logs for detailed error messages
4. Ensure Discord desktop application is up to date
