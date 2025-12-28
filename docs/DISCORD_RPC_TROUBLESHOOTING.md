# Discord RPC Troubleshooting Guide

## Quick Checks

### 1. Is Discord Running?
- **Windows/Mac**: Check if Discord desktop app is running (not just the browser version)
- Discord RPC only works with the desktop client

### 2. Test Page
Navigate to: `http://localhost:3000/test-discord` to test Discord RPC functionality with detailed logging.

### 3. Check Console Logs
1. Open browser DevTools (F12 or Right-click → Inspect)
2. Go to Console tab
3. Look for messages starting with `[Discord RPC]`

### 4. Common Errors & Solutions

#### Error: "Failed to connect to Discord"
**Cause**: Discord desktop app is not running
**Solution**: 
- Start Discord desktop app
- Wait a few seconds
- Try initializing again

#### Error: "Discord RPC not initialized"
**Cause**: Connection wasn't established before trying to update presence
**Solution**:
- Go to Settings and toggle Discord RPC on
- Or use the test page to manually initialize

#### No presence showing on Discord profile
**Possible causes**:
1. **Activity Status disabled in Discord**
   - Open Discord Settings → Activity Settings → Activity Privacy
   - Make sure "Display current activity as a status message" is ON

2. **Wrong Application ID**
   - Check `src-tauri/src/discord_rpc.rs` line 7
   - Verify the Application ID matches your Discord application

3. **Images not uploaded**
   - Go to Discord Developer Portal
   - Your Application → Rich Presence → Art Assets
   - Upload required images (optional but recommended)

4. **Not running in Tauri**
   - Discord RPC only works in the desktop app (Tauri)
   - It won't work in the browser version

#### Error: "invalid type: map, expected unit"
**Cause**: Plugin configuration error in tauri.conf.json
**Solution**: Already fixed - this was a configuration issue

## Step-by-Step Testing

### Method 1: Using Settings Page

1. Start the app: `bun run tauri:dev`
2. Navigate to Settings page
3. Find "Discord Rich Presence" card
4. Toggle it ON
5. Check your Discord profile

### Method 2: Using Test Page

1. Start the app: `bun run tauri:dev`
2. Navigate to `/test-discord` in the app
3. Click "Initialize Discord RPC"
4. If connected, click any activity button
5. Check your Discord profile

### Method 3: Programmatic Test

Add this to any page:

```tsx
import { useDiscordRPC } from "@/hooks/use-discord-rpc";
import { SchoolActivity } from "@/types/discord-rpc";
import { useEffect } from "react";

function MyComponent() {
  const { isConnected, updateActivityPreset } = useDiscordRPC({ 
    autoInit: true,
    enableLogging: true // Enable to see logs
  });

  useEffect(() => {
    if (isConnected) {
      console.log("✅ Discord RPC Connected!");
      updateActivityPreset(SchoolActivity.VIEWING_DASHBOARD);
    }
  }, [isConnected]);

  return <div>Check console and Discord profile</div>;
}
```

## Verification Checklist

- [ ] Discord desktop app is running (not browser)
- [ ] Application ID is set in `src-tauri/src/discord_rpc.rs`
- [ ] App is running via `bun run tauri:dev` (not just Next.js)
- [ ] Browser console shows no errors
- [ ] Discord Activity Status is enabled in Discord settings
- [ ] You're logged into Discord
- [ ] You've toggled Discord RPC on in Settings

## Discord Developer Portal Setup

If you haven't set up your Discord application yet:

1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Name it "School Management System"
4. Copy the Application ID
5. Paste it in `src-tauri/src/discord_rpc.rs`:
   ```rust
   const DISCORD_APP_ID: &str = "YOUR_APP_ID_HERE";
   ```
6. (Optional) Upload assets:
   - Go to Rich Presence → Art Assets
   - Upload `school-logo` (512x512 PNG)
   - Upload other icons as needed

## Still Not Working?

### Enable Full Logging

Edit `hooks/use-discord-rpc.ts` and set `enableLogging: true` by default:

```typescript
export function useDiscordRPC(options: UseDiscordRPCOptions = {}) {
  const {
    autoInit = false,
    autoDisconnectOnUnmount = true,
    enableLogging = true, // Changed from false
  } = options;
  // ...
}
```

### Check Rust Logs

Run with verbose logging:
```bash
RUST_LOG=debug bun run tauri:dev
```

### Manual Test

Open browser console and run:
```javascript
window.__TAURI__.invoke('is_discord_connected')
  .then(connected => console.log('Connected:', connected))
  .catch(err => console.error('Error:', err));
```

### Rebuild

Sometimes a clean rebuild helps:
```bash
cd src-tauri
cargo clean
cd ..
bun run tauri:dev
```

## Expected Behavior

When working correctly:

1. **In Console**: You'll see logs like:
   ```
   [Discord RPC] Initialized Discord RPC successfully
   [Discord RPC] Presence updated
   ```

2. **In Discord**: Your profile will show:
   - "Playing School Management System"
   - Your current activity (e.g., "Viewing Dashboard")
   - School logo (if uploaded)
   - Time elapsed

3. **In Settings**: Connection status badge shows "Connected" (green)

## Need More Help?

Check the full documentation:
- [DISCORD_RPC_INTEGRATION.md](./DISCORD_RPC_INTEGRATION.md) - Complete technical docs
- [DISCORD_RPC_QUICKSTART.md](./DISCORD_RPC_QUICKSTART.md) - Quick setup guide
