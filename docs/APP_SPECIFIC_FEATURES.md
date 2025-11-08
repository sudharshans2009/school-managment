# App-Specific Features Documentation

## Overview

The Amrita School Management System includes enhanced features specifically designed for the native desktop and mobile applications. These features provide a superior user experience compared to the web version, including offline functionality, keyboard shortcuts, system integration, and native performance optimizations.

## Features Implemented

### 1. Enhanced Download Banner

**Component**: `components/app-download-banner.tsx`

A smart, context-aware banner that prompts browser users to download the native application for their platform.

#### Key Features:
- **Automatic Platform Detection**: Detects Windows, Android, macOS, iOS, or Linux
- **Availability Status**: Shows which platforms are currently available vs. coming soon
- **Expandable Feature List**: Displays 6 platform-specific features per OS
- **Visual Design**: Gradient backgrounds, badges, and smooth animations
- **Persistent Dismissal**: Uses localStorage to remember if user dismissed the banner
- **Tauri Detection**: Automatically hides when running in the native app

#### Platform Support:

**Currently Available:**
- ✅ **Windows** (.msi installer)
  - Native desktop performance
  - Offline access to schedules & data
  - System tray notifications
  - Auto-updates
  - File system integration
  - Keyboard shortcuts

- ✅ **Android** (.apk installer)
  - Mobile-optimized interface
  - Push notifications
  - Offline mode
  - Biometric authentication
  - Quick actions from home screen
  - Battery optimized

**Coming Soon:**
- 🚧 **macOS** (.dmg installer)
  - Apple Silicon optimized
  - TouchBar support
  - iCloud integration
  - Handoff support
  - Spotlight search
  - Native macOS design

- 🚧 **iOS** (.ipa installer)
  - Native iOS experience
  - Face ID / Touch ID
  - Widgets support
  - Apple Pencil support
  - Siri shortcuts
  - iCloud sync

- 🚧 **Linux** (.AppImage)
  - AppImage format
  - Cross-distribution support
  - Wayland & X11 compatible
  - Native notifications
  - System tray integration
  - Open source friendly

#### Usage:

The banner automatically appears at the top of the home page when:
- User is browsing from a web browser (not the Tauri app)
- User hasn't previously dismissed the banner
- Platform is detected successfully

```tsx
import { AppDownloadBanner } from "@/components/app-download-banner";

// In your layout
<AppDownloadBanner />
```

#### Customization:

To update download URLs:
```typescript
// In app-download-banner.tsx
detectedPlatform = {
  os: "Windows",
  downloadUrl: "/downloads/your-app-name_windows.msi", // Change this
  // ...
};
```

To modify features list:
```typescript
features: [
  "Your custom feature",
  "Another feature",
  "Add up to 6 features",
  // ...
]
```

---

### 2. Offline Indicator

**Component**: `components/offline-indicator.tsx`

A real-time network status indicator that shows connection state and app mode.

#### Key Features:
- **Real-time Detection**: Uses Navigator.onLine API for instant updates
- **App Mode Display**: Shows "App Mode" when running in Tauri
- **Smart Visibility**: Only shows when offline in browser, always shows in Tauri
- **Color-Coded**: Green for online, red for offline
- **Animated**: Smooth slide-in animation from bottom
- **Minimal**: Doesn't interfere with main content

#### Display States:

| Environment | Online | Display |
|-------------|--------|---------|
| Browser | ✅ Yes | Hidden |
| Browser | ❌ No | "Offline Mode" (red badge) |
| Tauri App | ✅ Yes | "App Mode • Online" (green badge) |
| Tauri App | ❌ No | "App Mode • Offline" (red badge) |

#### Usage:

```tsx
import { OfflineIndicator } from "@/components/offline-indicator";

// Add to your layout (typically at the end)
export function MyLayout({ children }) {
  return (
    <div>
      {/* Your layout content */}
      <main>{children}</main>
      
      {/* Add at bottom */}
      <OfflineIndicator />
    </div>
  );
}
```

#### Styling:

The indicator appears as a fixed badge in the bottom-right corner:
- Position: `fixed bottom-4 right-4`
- z-index: 50 (above most content)
- Responsive padding and sizing

---

### 3. App Quick Actions Menu

**Component**: `components/app-quick-actions.tsx`

A comprehensive dropdown menu providing quick access to common actions, keyboard shortcuts, and window controls (Tauri only).

#### Key Features:
- **Keyboard Shortcuts**: Global hotkeys for navigation
- **Quick Navigation**: Jump to Home, Calendar, Students pages
- **Update Management**: Check for and install updates
- **Offline Sync**: Trigger manual data synchronization
- **Window Controls**: Fullscreen, minimize, close
- **Tauri-Only**: Automatically hidden in browser mode

#### Keyboard Shortcuts:

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Shift + H` | Navigate to Home |
| `Ctrl/Cmd + Shift + C` | Navigate to Calendar |
| `Ctrl/Cmd + Shift + S` | Navigate to Students |
| `F11` | Toggle Fullscreen |
| `Ctrl/Cmd + Q` | Close App |

#### Menu Actions:

**Navigation:**
- Home
- Calendar
- Students

**App Functions:**
- Sync Offline Data - Manually trigger background sync
- Check for Updates - Query and install available updates

**Window Controls:**
- Fullscreen / Exit Fullscreen
- Minimize
- Close App

#### Usage:

```tsx
import { AppQuickActions } from "@/components/app-quick-actions";

// Add to your navbar
<nav>
  {/* Other nav items */}
  <AppQuickActions />
  {/* Theme toggle, user menu, etc. */}
</nav>
```

#### Customization:

Add new shortcuts:
```typescript
// In app-quick-actions.tsx useEffect
if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "N") {
  e.preventDefault();
  router.push("/notifications");
}
```

Add new menu items:
```tsx
<DropdownMenuItem onClick={() => router.push("/your-page")}>
  <YourIcon className="mr-2 h-4 w-4" />
  <span>Your Action</span>
  <DropdownMenuShortcut>⌘⇧X</DropdownMenuShortcut>
</DropdownMenuItem>
```

---

## Implementation Guide

### Step 1: Install Components

All components are already created in the `components/` directory:
- `app-download-banner.tsx`
- `offline-indicator.tsx`
- `app-quick-actions.tsx`

### Step 2: Add to Layout

The components are integrated into `components/layouts/home-layout.tsx`:

```tsx
import { AppDownloadBanner } from "@/components/app-download-banner";
import { AppQuickActions } from "@/components/app-quick-actions";
import { OfflineIndicator } from "@/components/offline-indicator";

export function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Download Banner - Top */}
      <AppDownloadBanner />
      
      {/* Navbar */}
      <nav>
        {/* Other nav items */}
        <AppQuickActions />
        {/* Theme toggle, etc. */}
      </nav>

      {/* Main Content */}
      <main>{children}</main>
      
      {/* Offline Indicator - Bottom */}
      <OfflineIndicator />
    </div>
  );
}
```

### Step 3: Build Native Apps

To create the actual installers that users will download:

**Windows:**
```powershell
bun run tauri:build
```

Output: `src-tauri/target/release/bundle/msi/amrita-school-management_1.0.0_x64_en-US.msi`

**Android:**
```bash
# Configure Android SDK first
bun run tauri:build -- --target android
```

Output: `src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk`

### Step 4: Upload Installers

1. Place built files in `public/downloads/`:
   ```
   public/downloads/
   ├── amrita-school-management_windows.msi
   ├── amrita-school-management_android.apk
   ├── amrita-school-management_macos.dmg (when ready)
   ├── amrita-school-management_ios.ipa (when ready)
   └── amrita-school-management_linux.AppImage (when ready)
   ```

2. Or upload to a CDN and update URLs in `app-download-banner.tsx`

---

## Testing

### Test Download Banner

1. **In Browser:**
   ```bash
   bun run dev
   ```
   - Visit http://localhost:3000
   - Should see banner at top
   - Click "Features" to expand feature list
   - Click "Download" (will 404 until files exist)
   - Click X to dismiss
   - Reload - banner should not reappear

2. **In Tauri:**
   ```bash
   bun run tauri:dev
   ```
   - Banner should NOT appear

### Test Offline Indicator

1. **Browser Online:**
   - Badge should be hidden

2. **Browser Offline:**
   - Disconnect internet
   - "Offline Mode" badge should appear (red)
   - Reconnect - badge disappears

3. **Tauri Online:**
   - Badge shows "App Mode • Online" (green)

4. **Tauri Offline:**
   - Disconnect internet
   - Badge shows "App Mode • Offline" (red)

### Test Quick Actions

1. **In Browser:**
   - Lightning bolt icon should NOT appear

2. **In Tauri:**
   - Click lightning bolt icon
   - Test keyboard shortcuts:
     - `Ctrl+Shift+H` → Home
     - `Ctrl+Shift+C` → Calendar
     - `Ctrl+Shift+S` → Students
     - `F11` → Fullscreen
   - Click "Check for Updates"
   - Click "Sync Offline Data"
   - Test window controls

---

## Technical Details

### Platform Detection Logic

```typescript
const userAgent = navigator.userAgent.toLowerCase();
const platform = navigator.platform.toLowerCase();

// Windows
if (platform.includes("win") || userAgent.includes("windows")) {
  // Windows detected
}

// Android
else if (userAgent.includes("android")) {
  // Android detected
}

// macOS
else if (platform.includes("mac") || userAgent.includes("mac")) {
  // macOS detected
}

// iOS
else if (userAgent.includes("iphone") || userAgent.includes("ipad")) {
  // iOS detected
}

// Linux
else if (platform.includes("linux")) {
  // Linux detected
}
```

### Tauri Detection

All components check for the Tauri environment:

```typescript
// Method 1: Direct check
if (window.__TAURI__) {
  // Running in Tauri
}

// Method 2: With useMemo (preferred for performance)
const isTauri = useMemo(() => {
  try {
    return !!window.__TAURI__;
  } catch {
    return false;
  }
}, []);
```

### Network Detection

Uses the Network Information API:

```typescript
// Initial state
const [isOnline, setIsOnline] = useState(() => {
  if (typeof window !== "undefined") {
    return navigator.onLine;
  }
  return true;
});

// Listen for changes
useEffect(() => {
  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}, []);
```

---

## Troubleshooting

### Banner Not Showing

**Problem**: Download banner doesn't appear

**Solutions**:
1. Check localStorage: `localStorage.getItem("appDownloadBannerDismissed")`
2. Clear if needed: `localStorage.removeItem("appDownloadBannerDismissed")`
3. Hard refresh: `Ctrl+Shift+R`
4. Check console for errors
5. Verify not running in Tauri app

### Quick Actions Not Available

**Problem**: Lightning bolt icon missing

**Solution**: Quick Actions only appear in Tauri app, not browser

### Keyboard Shortcuts Not Working

**Problem**: Shortcuts don't trigger actions

**Solutions**:
1. Ensure running in Tauri app (check for offline indicator showing "App Mode")
2. Check if another application is capturing the shortcut
3. Try in fullscreen mode
4. Check browser console for errors
5. Verify focus is on the application window

### Offline Indicator Always Shows

**Problem**: Badge appears even when online in browser

**Solution**: This is a bug - the indicator should hide when online in browser mode. Check the component logic in `offline-indicator.tsx`

### Update Check Fails

**Problem**: "Check for Updates" shows error

**Solutions**:
1. Verify Tauri updater is configured in `src-tauri/tauri.conf.json`
2. Check that update server is accessible
3. Ensure app is signed (required for updates)
4. Check console for detailed error message

---

## Best Practices

### 1. Always Check for Tauri

Before using Tauri-specific APIs:
```typescript
if (typeof window !== "undefined" && window.__TAURI__) {
  // Safe to use Tauri APIs
}
```

### 2. Provide Browser Fallbacks

Don't rely solely on Tauri features:
```typescript
// Good
const canUpdate = isTauri;
if (canUpdate) {
  // Show update button
}

// Bad
// Always show update button (will error in browser)
```

### 3. Handle Errors Gracefully

Wrap Tauri API calls in try-catch:
```typescript
try {
  const { appWindow } = await import("@tauri-apps/plugin-window");
  await appWindow.setFullscreen(true);
} catch (error) {
  console.error("Failed to set fullscreen:", error);
  // Show user-friendly message
}
```

### 4. Test Both Modes

Always test features in both browser and Tauri:
- `bun run dev` - Browser mode
- `bun run tauri:dev` - Tauri mode

### 5. Use Feature Detection

Prefer feature detection over user agent sniffing:
```typescript
// Good
if ("serviceWorker" in navigator) {
  // Use service worker
}

// Less ideal
if (userAgent.includes("chrome")) {
  // Assume service worker support
}
```

---

## Performance Considerations

### Download Banner
- **Lazy Loading**: Features list only renders when expanded
- **Local Storage**: Single check on mount, no repeated queries
- **Conditional Rendering**: Component returns `null` when not needed

### Offline Indicator
- **useMemo**: Tauri check runs only once
- **Event Listeners**: Properly cleaned up to prevent memory leaks
- **Conditional Rendering**: Hidden when not needed

### Quick Actions
- **Async Imports**: Tauri modules loaded on-demand
- **Event Delegation**: Single keyboard listener for all shortcuts
- **Menu on Demand**: Dropdown content only renders when opened

---

## Future Enhancements

### Version 1.1
- [ ] Custom notification sounds
- [ ] System tray menu with quick actions
- [ ] macOS release

### Version 1.2
- [ ] iOS widgets
- [ ] Background data sync
- [ ] Share sheet integration
- [ ] Deep linking

### Version 1.3
- [ ] Voice commands
- [ ] QR code scanner (mobile)
- [ ] Linux AppImage release
- [ ] Advanced offline capabilities

### Version 2.0
- [ ] Redesigned UI
- [ ] AI assistant integration
- [ ] Advanced analytics
- [ ] Plugin system

---

## Related Documentation

- [APP_DOWNLOAD_FEATURE.md](./APP_DOWNLOAD_FEATURE.md) - Initial download feature documentation
- [TAURI_SETUP.md](./TAURI_SETUP.md) - Tauri setup and configuration
- [BETTER_AUTH_TAURI.md](./BETTER_AUTH_TAURI.md) - Authentication in Tauri apps
- [Tauri Documentation](https://tauri.app/v1/guides/) - Official Tauri docs
- [Navigator.onLine](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine) - Network detection API

---

## Support

For issues or questions:
1. Check this documentation
2. Review console errors
3. Test in both browser and Tauri modes
4. Check GitHub issues
5. Contact development team

---

**Last Updated**: November 8, 2025  
**Version**: 1.0.0  
**Maintainer**: Development Team
