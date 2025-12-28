# Discord Rich Presence - Quick Start Guide

## What is Discord Rich Presence?

Discord Rich Presence displays your current activity in the School Management System on your Discord profile. Friends and server members can see what you're working on (e.g., "Viewing Dashboard", "Managing Attendance").

## Quick Setup

### 1. Get a Discord Application ID

1. Visit [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name it "School Management System" (or your preference)
4. Copy the **Application ID**

### 2. Update Configuration

Edit `src-tauri/src/discord_rpc.rs` and replace the placeholder:

```rust
const DISCORD_APP_ID: &str = "YOUR_APPLICATION_ID_HERE";
```

### 3. Build the App

```bash
bun run tauri:build
```

## Usage

### Enable in Settings

1. Open the application
2. Navigate to **Settings**
3. Find the **Discord Rich Presence** card
4. Toggle the switch to enable
5. Make sure Discord is running!

### Automatic Updates

Once enabled, your Discord presence will automatically update as you navigate through the app:

- **Dashboard** → Shows "Viewing Dashboard"
- **Attendance** → Shows "Managing Attendance"
- **Timetable** → Shows "Viewing Timetable"
- **Grades** → Shows "Viewing Grades"
- And more...

## Adding Custom Images (Optional)

To display the school logo and activity icons:

1. In Discord Developer Portal, go to your application
2. Navigate to **Rich Presence** → **Art Assets**
3. Upload images with these exact names:
   - `school-logo` - Your school/app logo
   - `attendance-icon` - Attendance icon
   - `calendar-icon` - Calendar icon
   - `grades-icon` - Grades icon
   - `student-icon` - Student management icon
   - `teacher-icon` - Teacher management icon

Image requirements:

- Minimum size: 512x512 pixels
- Format: PNG or JPG
- Max size: 5MB

## Programmatic Usage

### In Your Components

```tsx
import { useDiscordRPC } from "@/hooks/use-discord-rpc";
import { SchoolActivity } from "@/types/discord-rpc";

function MyComponent() {
  const { isConnected, updateActivityPreset } = useDiscordRPC({
    autoInit: true,
  });

  useEffect(() => {
    if (isConnected) {
      // Use a preset activity
      updateActivityPreset(SchoolActivity.VIEWING_DASHBOARD);
    }
  }, [isConnected]);

  return <div>My Component</div>;
}
```

### Available Presets

- `SchoolActivity.VIEWING_DASHBOARD`
- `SchoolActivity.VIEWING_ATTENDANCE`
- `SchoolActivity.VIEWING_TIMETABLE`
- `SchoolActivity.VIEWING_GRADES`
- `SchoolActivity.VIEWING_ASSIGNMENTS`
- `SchoolActivity.VIEWING_CALENDAR`
- `SchoolActivity.MANAGING_STUDENTS`
- `SchoolActivity.MANAGING_TEACHERS`
- `SchoolActivity.MANAGING_CLASSES`
- `SchoolActivity.VIEWING_REPORTS`
- `SchoolActivity.IN_SETTINGS`

## Troubleshooting

### "Discord RPC failed to connect"

**Solution**: Make sure Discord desktop app is running before enabling the feature.

### "Connection dropped"

**Solution**: Discord was closed or restarted. Toggle the setting off and on again.

### Images not showing

**Solution**:

1. Verify assets are uploaded to Discord Developer Portal
2. Check that asset names match exactly (case-sensitive)
3. Wait a few minutes for Discord to process new assets

### Still not working?

1. Check that the Application ID is correct in `discord_rpc.rs`
2. Verify Discord is updated to the latest version
3. Check console logs with `enableLogging: true` in the hook options

## Privacy

- ✅ Only shows activity type (e.g., "Viewing Dashboard")
- ✅ No personal information is shared
- ✅ No student/teacher names or data
- ✅ Completely optional - enable/disable anytime
- ✅ Communication is local (app ↔ Discord client)

## Need More Details?

See the full documentation: [docs/DISCORD_RPC_INTEGRATION.md](./DISCORD_RPC_INTEGRATION.md)

---

**Enjoy showing off your productivity! 🎓✨**
