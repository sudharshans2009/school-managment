# Tauri Authentication Test Checklist

## Pre-Testing Setup

### 1. Verify Dependencies
```bash
# Check all packages are installed
bun install

# Verify Tauri CLI
bunx tauri --version  # Should show 2.0.0-rc.18 or higher
```

### 2. Check Configuration Files

**Server** (`lib/auth.ts`):
- [x] Tauri plugin imported
- [x] Plugin configured with scheme "school-management"
- [x] callbackURL set to "/"

**Client** (`components/providers/tauri-provider.tsx`):
- [x] setupBetterAuthTauri called in Tauri environment
- [x] Scheme matches server config
- [x] onSuccess/onError handlers implemented

**Tauri Config** (`src-tauri/tauri.conf.json`):
- [x] Deep-link plugin registered
- [x] Scheme "school-management" added

**Rust** (`src-tauri/src/lib.rs`):
- [x] All 4 plugins initialized (deep-link, http, os, opener)

## Development Mode Testing

### Start Development Server
```bash
bun run tauri:dev
```

### Test Checklist

#### 1. App Launch
- [ ] Tauri window opens without errors
- [ ] Console shows: "🦀 Running in Tauri environment"
- [ ] Console shows: "📡 API Base: https://sms.sudharshans.me"
- [ ] Console shows: "✅ Better Auth Tauri setup complete"

#### 2. Email/Password Sign-In
- [ ] Navigate to sign-in page
- [ ] Enter valid credentials
- [ ] Click "Sign In" button
- [ ] Request sent to production API
- [ ] Session cookie received
- [ ] Redirect to dashboard works
- [ ] User info displayed correctly

#### 3. Session Persistence
- [ ] Signed in successfully
- [ ] Refresh the page (Cmd/Ctrl+R)
- [ ] User still signed in
- [ ] Dashboard loads with user data

#### 4. Sign Out
- [ ] Click sign out button
- [ ] Session cleared
- [ ] Redirect to login page
- [ ] Attempting to access protected route redirects to login

#### 5. Sign Up (if enabled)
- [ ] Navigate to sign-up page
- [ ] Enter new user details
- [ ] Submit form
- [ ] Account created successfully
- [ ] Email verification sent (if enabled)

#### 6. Protected Routes
- [ ] Sign out first
- [ ] Try to access `/admin`, `/teacher`, or `/student`
- [ ] Redirected to login page
- [ ] After login, redirected back to original page

#### 7. Deep Link Registration
```bash
# Check if deep link is registered (macOS/Linux)
# Try opening: school-management://test
# App should open (may show error, but app opens)
```

## Production Build Testing

### Build the App
```bash
bun run tauri:build
```

### Installation Test

#### Windows
- [ ] Locate installer: `src-tauri/target/release/bundle/nsis/*.exe`
- [ ] Run installer
- [ ] App installs successfully
- [ ] Launch app from Start Menu
- [ ] Deep link registered (check registry)

#### macOS
- [ ] Locate app: `src-tauri/target/release/bundle/macos/*.app`
- [ ] Open DMG or run app directly
- [ ] App opens successfully
- [ ] Deep link registered (check URL schemes)

#### Linux
- [ ] Locate package: `src-tauri/target/release/bundle/deb/*.deb` or `.AppImage`
- [ ] Install package
- [ ] Launch from applications menu
- [ ] Deep link registered (check .desktop file)

### Post-Install Tests

#### 1. Fresh Install Authentication
- [ ] Launch installed app
- [ ] Sign in with credentials
- [ ] Authentication successful
- [ ] Dashboard loads

#### 2. Session Persistence (Production)
- [ ] Sign in successfully
- [ ] Close the app completely
- [ ] Reopen the app
- [ ] Still signed in (session persisted)
- [ ] No need to sign in again

#### 3. Deep Link Callback (if OAuth enabled)
- [ ] Click social sign-in button
- [ ] System browser opens
- [ ] Authorize on OAuth provider
- [ ] Deep link callback triggers
- [ ] App comes to foreground
- [ ] Authentication completes
- [ ] Redirect to dashboard

#### 4. Multiple Launches
- [ ] Launch app
- [ ] Try to launch app again
- [ ] Should focus existing window (not open duplicate)

## OAuth Testing (If Configured)

### Prerequisites
- OAuth providers configured in Better Auth
- Redirect URLs added to provider settings
- Production API accessible

### Social Sign-In Flow
- [ ] Click "Sign in with Google" (or other provider)
- [ ] System browser opens to provider
- [ ] OAuth authorization page loads
- [ ] Click "Authorize" or "Allow"
- [ ] Browser redirects to callback URL
- [ ] Deep link opens the app
- [ ] Console shows: "✅ Auth success, redirecting to: /"
- [ ] User signed in successfully
- [ ] User data displayed in app

## Platform-Specific Tests

### macOS Only
- [ ] Cookie handling works (uses Tauri HTTP plugin)
- [ ] Check console for "Using Tauri fetch for macOS"
- [ ] Session persists properly
- [ ] No cookie-related errors

### Windows Only
- [ ] Standard cookie handling works
- [ ] No platform-specific errors
- [ ] Deep links work after first install

### Linux Only
- [ ] Deep link handler registered
- [ ] May need to manually set default handler
- [ ] Check `~/.local/share/applications/*.desktop`

## Troubleshooting

### Issue: "Failed to setup Better Auth Tauri"
**Check:**
1. All dependencies installed: `bun install`
2. `@daveyplate/better-auth-tauri` in package.json
3. Check browser console for detailed error

### Issue: Deep links don't work
**Fix:**
1. Restart app after first installation
2. On macOS, check URL schemes in app bundle
3. On Linux, verify .desktop file

### Issue: Sessions not persisting
**Check:**
1. Cookies are enabled
2. Production API is accessible
3. On macOS, verify Tauri HTTP plugin is used
4. Check for cookie expiration settings

### Issue: OAuth redirects but app doesn't open
**Check:**
1. Deep link scheme registered correctly
2. Try opening `school-management://test` manually
3. Restart after first install
4. Check system logs for deep link errors

## Success Criteria

✅ **Development Mode:**
- App launches without errors
- Email/password authentication works
- Sessions persist on page reload
- Sign out works properly
- Console logs show correct environment

✅ **Production Build:**
- App installs successfully
- Authentication works in installed app
- Sessions persist across app restarts
- Deep links registered with OS
- No console errors

✅ **Overall:**
- All authentication flows work as expected
- No TypeScript compilation errors
- No runtime errors in production
- User experience is smooth

## Notes

- **API Connection**: Desktop app connects to `https://sms.sudharshans.me`
- **Database**: Shared with web version
- **Sessions**: 7-day expiration, 1-day refresh
- **Deep Link**: `school-management://` scheme

## Next Steps After Testing

If all tests pass:
1. Generate proper app icons: `bun run tauri:icon path/to/icon.png`
2. Update app metadata in `src-tauri/tauri.conf.json`
3. Consider code signing for distribution
4. Set up auto-update mechanism (optional)
5. Create distribution packages for all platforms
