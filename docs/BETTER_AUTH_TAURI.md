# Better Auth Tauri Integration

## Overview

The School Management System now supports seamless authentication in the Tauri desktop app using the Better Auth Tauri plugin. This enables proper OAuth flows, deep link handling, and session management across all platforms.

## Components

### 1. Server Configuration

**File**: `lib/auth.ts`

```typescript
import { tauri } from "@daveyplate/better-auth-tauri/plugin";

plugins: [
  tauri({
    scheme: "school-management",      // Deep link scheme
    callbackURL: "/",                  // Post-auth redirect
    successText: "Authentication successful! You can close this window.",
    debugLogs: false,                  // Set to true for debugging
  }),
]
```

**Features:**
- Registers Tauri-specific auth endpoints
- Handles deep link callbacks
- Provides success page for OAuth flows

### 2. Deep Link Registration

**File**: `src-tauri/tauri.conf.json`

```json
"plugins": {
  "deep-link": {
    "desktop": {
      "schemes": ["school-management"]
    }
  }
}
```

**What it does:**
- Registers `school-management://` with the operating system
- App becomes handler for this URL scheme
- OAuth providers can redirect back to the app

### 3. Client Setup

**File**: `components/providers/tauri-provider.tsx`

Automatically initializes Better Auth Tauri when running in desktop mode:

```typescript
import { setupBetterAuthTauri } from "@daveyplate/better-auth-tauri";

setupBetterAuthTauri({
  authClient,
  scheme: "school-management",
  debugLogs: false,
  onSuccess: (callbackURL) => {
    window.location.href = callbackURL;
  },
  onError: (error) => {
    console.error("Auth error:", error);
  },
});
```

### 4. Cookie Handling (macOS)

**File**: `lib/auth/client.ts`

macOS requires special cookie handling using the Tauri HTTP plugin:

```typescript
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { platform } from "@tauri-apps/plugin-os";

fetchOptions: {
  customFetchImpl: (...params) =>
    isTauri() && platform() === "macos" && window.location.protocol === "tauri:"
      ? tauriFetch(...params)
      : fetch(...params)
}
```

### 5. Rust Plugin Initialization

**File**: `src-tauri/src/lib.rs`

```rust
tauri::Builder::default()
  .plugin(tauri_plugin_deep_link::init())
  .plugin(tauri_plugin_http::init())
  .plugin(tauri_plugin_os::init())
  .plugin(tauri_plugin_opener::init())
```

**Dependencies** (`src-tauri/Cargo.toml`):
```toml
tauri-plugin-deep-link = "2.0.0-rc"
tauri-plugin-http = "2.0.0-rc"
tauri-plugin-os = "2.0.0-rc"
tauri-plugin-opener = "2.0.0-rc"
```

### 6. Social Authentication Helper

**File**: `lib/tauri/social-auth.ts`

Utility for initiating social sign-in flows:

```typescript
import { handleSocialSignIn } from '@/lib/tauri/social-auth';

// Example usage
await handleSocialSignIn('google');
await handleSocialSignIn('github');
await handleSocialSignIn('microsoft');
```

## Authentication Flows

### Email/Password Authentication

1. User enters credentials in Tauri app
2. Request sent to `https://sms.sudharshans.me/api/auth/sign-in`
3. Server validates credentials
4. Session cookie returned with `Set-Cookie` header
5. Cookie stored by Tauri (or Tauri HTTP plugin on macOS)
6. Subsequent requests include cookie automatically
7. User redirected to dashboard

**Code Example:**
```typescript
import { signIn } from '@/lib/auth/client';

const { data, error } = await signIn.email({
  email: 'user@example.com',
  password: 'password123',
});

if (data) {
  // Success - redirect to dashboard
  window.location.href = '/dashboard';
}
```

### OAuth Social Sign-In

1. User clicks "Sign in with Google" button
2. `handleSocialSignIn('google')` called
3. System browser opens to:
   ```
   https://sms.sudharshans.me/api/auth/oauth/google/authorize
   ```
4. User authorizes the app on Google's page
5. Google redirects to:
   ```
   https://sms.sudharshans.me/api/auth/oauth/google/callback?code=...
   ```
6. Server processes OAuth, creates session
7. Server redirects to:
   ```
   school-management://callback?token=...
   ```
8. Deep link opens the Tauri app
9. Better Auth Tauri plugin handles the callback
10. Session established, `onSuccess` callback fires
11. User redirected to dashboard

**Code Example:**
```typescript
import { handleSocialSignIn } from '@/lib/tauri/social-auth';

// In your sign-in component
<Button onClick={() => handleSocialSignIn('google')}>
  Sign in with Google
</Button>
```

### Session Persistence

**How it works:**
- Sessions stored as HTTP-only cookies
- Tauri manages cookie storage securely
- Sessions persist across app restarts
- 7-day expiration (configurable in `lib/auth.ts`)

**Checking session:**
```typescript
import { useSession } from '@/lib/auth/client';

function MyComponent() {
  const { data: session, isPending } = useSession();
  
  if (isPending) return <div>Loading...</div>;
  if (!session?.user) return <div>Not logged in</div>;
  
  return <div>Welcome {session.user.name}!</div>;
}
```

## Platform-Specific Behavior

### Windows
- Standard cookie handling works out of the box
- No special configuration needed
- Deep links registered during installation

### macOS
- Requires Tauri HTTP plugin for cookie support
- Automatic platform detection in `auth-client.ts`
- Deep links registered as URL handler in app bundle

### Linux
- Standard cookie handling
- Deep links registered via .desktop file
- May require manual protocol handler registration on some distros

## Installed Dependencies

### NPM Packages
```json
{
  "@daveyplate/better-auth-tauri": "^0.1.6",
  "@tauri-apps/plugin-deep-link": "^2.4.5",
  "@tauri-apps/plugin-http": "^2.5.4",
  "@tauri-apps/plugin-os": "^2.3.2",
  "@tauri-apps/plugin-opener": "^2.5.2"
}
```

### Rust Crates
```toml
tauri-plugin-deep-link = "2.0.0-rc"
tauri-plugin-http = "2.0.0-rc"
tauri-plugin-os = "2.0.0-rc"
tauri-plugin-opener = "2.0.0-rc"
```

## Testing Authentication

### Development Mode

```bash
bun run tauri:dev
```

**Test checklist:**
1. ✅ Email/password sign-in works
2. ✅ Session persists on page reload
3. ✅ Sign-out clears session
4. ✅ Protected routes redirect to login
5. ✅ Deep link handler registered (check logs)
6. ✅ OAuth flow opens system browser (if configured)

**Logs to look for:**
```
🦀 Running in Tauri environment
📡 API Base: https://sms.sudharshans.me
✅ Better Auth Tauri setup complete
```

### Production Build

```bash
bun run tauri:build
```

1. Install the generated app from `src-tauri/target/release/bundle/`
2. Test authentication flows
3. Check session persistence across app restarts
4. Verify deep links work (may need to restart after first install)

## Troubleshooting

### Issue: Deep links not working

**Solution:**
1. Restart the app after first installation
2. Check if scheme is registered: `school-management://test` should open the app
3. On Linux, verify `.desktop` file is installed
4. Enable debug logs: Set `debugLogs: true` in plugin config

### Issue: Sessions not persisting on macOS

**Solution:**
1. Verify Tauri HTTP plugin is initialized in `lib.rs`
2. Check `auth-client.ts` has macOS cookie handling
3. Ensure `window.location.protocol === "tauri:"` check is working
4. Enable debug logs to see which fetch implementation is used

### Issue: OAuth redirects to wrong URL

**Solution:**
1. Check `callbackURL` in server plugin config (`lib/auth.ts`)
2. Verify deep link scheme matches in all configs
3. Ensure production API is accessible
4. Check Better Auth server logs for redirect URLs

### Issue: "Failed to setup Better Auth Tauri" error

**Solution:**
1. Verify all dependencies are installed: `bun install`
2. Check that `@daveyplate/better-auth-tauri` is in package.json
3. Ensure Tauri plugins are loaded before setup
4. Check browser console for detailed error message

## Security Considerations

1. **HTTPS Required**: Production API must use HTTPS
2. **Secure Cookies**: HTTP-only cookies prevent XSS attacks
3. **Session Expiration**: 7-day expiration with 1-day refresh
4. **Deep Link Validation**: Plugin validates callback tokens
5. **Same Origin Policy**: Browser version uses same-origin credentials

## Future Enhancements

- [ ] Add biometric authentication (Touch ID, Face ID, Windows Hello)
- [ ] Implement offline mode with local database
- [ ] Add automatic session refresh before expiration
- [ ] Support for custom OAuth providers
- [ ] Two-factor authentication (2FA) support
- [ ] Device management (view/revoke sessions)

## References

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Better Auth Tauri Plugin](https://github.com/daveyplate/better-auth-tauri)
- [Tauri Deep Link Plugin](https://v2.tauri.app/plugin/deep-link/)
- [Tauri HTTP Plugin](https://v2.tauri.app/plugin/http/)
