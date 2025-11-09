# Tauri Setup Guide

## Overview

This school management system is now configured to work as both a web application and a desktop application using Tauri 2.0 with Better Auth integration.

## Architecture

- **Web Version**: Traditional Next.js app running on https://sms.sudharshans.me
- **Desktop Version**: Tauri app bundling Next.js as a static export
- **API Server**: Shared backend at https://sms.sudharshans.me/api
- **Authentication**: Better Auth with Tauri plugin for seamless desktop auth

## Configuration

### URLs

- **Production Web**: https://sms.sudharshans.me
- **Production API**: https://sms.sudharshans.me/api
- **Dev Server**: http://localhost:3000
- **Deep Link Scheme**: school-management://

### Authentication

The desktop app uses the Better Auth Tauri plugin for seamless authentication:

- **Deep Link Support**: Handles OAuth callbacks via `school-management://` scheme
- **Cookie Management**: Proper session handling across platforms (including macOS)
- **Social Sign-In**: Supports OAuth providers (Google, GitHub, Microsoft, etc.)
- **Session Persistence**: Maintains login state across app restarts

**Better Auth Tauri Plugin Features:**
- Automatic deep link registration and handling
- System browser for OAuth flows
- Secure session token storage
- Cross-platform cookie support (macOS uses Tauri HTTP plugin)

## Development

### Prerequisites

1. **Rust**: Required for Tauri
   ```bash
   # Windows
   winget install Rustlang.Rust.MSVC
   
   # macOS
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   
   # Linux
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Bun**: Already installed
   ```bash
   bun --version
   ```

### Running in Development

#### Option 1: Web Only (Recommended for development)
```bash
bun run dev
```
This runs Next.js normally with all API routes working.

#### Option 2: Tauri Desktop
```bash
# Windows
.\scripts\tauri-dev.ps1

# macOS/Linux
./scripts/tauri-dev.sh

# Or directly
bun run tauri:dev
```

This will:
1. Start Next.js dev server on localhost:3000
2. Open Tauri window
3. Enable hot reload
4. Connect to production API for auth

### Building for Production

#### Web Build
```bash
bun run build
```

#### Desktop Build
```bash
# Windows
.\scripts\tauri-build.ps1

# macOS/Linux  
./scripts/tauri-build.sh

# Or directly
bun run tauri:build
```

This creates platform-specific installers in `src-tauri/target/release/bundle/`:
- **Windows**: `.msi` and `.exe` installers
- **macOS**: `.dmg` and `.app` bundle
- **Linux**: `.deb`, `.AppImage`, and `.rpm`

## File Structure

```
school-management/
├── app/                      # Next.js app router
├── components/               # React components
│   └── providers/
│       └── tauri-provider.tsx  # Tauri detection provider
├── lib/
│   ├── auth-client.ts       # Better Auth client (Tauri-aware)
│   ├── tauri-utils.ts       # Tauri utility functions
│   └── tauri-auth.ts        # Tauri auth configuration
├── src-tauri/               # Tauri source
│   ├── src/
│   │   └── main.rs         # Rust main file
│   ├── icons/              # App icons
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── scripts/
│   ├── tauri-dev.ps1       # Dev script (Windows)
│   ├── tauri-dev.sh        # Dev script (Unix)
│   ├── tauri-build.ps1     # Build script (Windows)
│   └── tauri-build.sh      # Build script (Unix)
├── out/                     # Next.js build output (generated)
├── .env.development         # Dev environment vars
├── .env.production          # Production environment vars
├── next.config.ts           # Next.js config (Tauri-aware)
└── package.json             # Tauri scripts added
```

## How It Works

### Development Mode

1. **Web Development** (`bun run dev`):
   - Next.js runs normally
   - API routes work directly
   - Use for most development work

2. **Tauri Development** (`bun run tauri:dev`):
   - Next.js dev server starts
   - Tauri window opens showing localhost:3000
   - Auth connects to production API
   - Hot reload enabled
   - Use to test desktop-specific features

### Production Mode

1. **Static Export**:
   - Next.js builds to static files in `/out`
   - No API routes (they don't work in static export)
   - All data fetching goes to https://sms.sudharshans.me/api

2. **Tauri Bundle**:
   - Bundles static files into desktop app
   - Creates platform-specific installers
   - App connects to production API

## Environment Detection

The app automatically detects if it's running in Tauri:

```typescript
import { useTauri } from '@/components/providers/tauri-provider';

function MyComponent() {
  const { isTauri, isReady } = useTauri();
  
  if (isTauri) {
    // Running in Tauri desktop app
    // API calls go to https://sms.sudharshans.me
  } else {
    // Running in browser
    // API calls use relative URLs
  }
}
```

## Utilities

### Tauri-Specific Functions

```typescript
import { 
  isTauriApp,
  openExternal,
  saveFile,
  openFile,
  showNotification,
  getApiBaseURL 
} from '@/lib/tauri/utils';

// Check if running in Tauri
if (isTauriApp()) {
  // Desktop-specific code
}

// Open external link
await openExternal('https://example.com');

// Save file with native dialog
await saveFile('report.csv', csvData);

// Open file with native dialog
const content = await openFile([
  { name: 'CSV', extensions: ['csv'] }
]);

// Show system notification
await showNotification('Success', 'Data saved!');

// Get correct API base URL
const apiUrl = getApiBaseURL(); // Returns production URL in Tauri
```

## Authentication

Better Auth is configured with the Tauri plugin for seamless desktop authentication:

### How It Works

1. **Server Configuration** (`lib/auth.ts`):
   ```typescript
   import { tauri } from "@daveyplate/better-auth-tauri/plugin";
   
   plugins: [
     tauri({
       scheme: "school-management",
       callbackURL: "/",
       successText: "Authentication successful! You can close this window.",
       debugLogs: false,
     }),
   ]
   ```

2. **Client Setup** (`components/providers/tauri-provider.tsx`):
   - Automatically initializes Better Auth Tauri on app start
   - Registers deep link handler for OAuth callbacks
   - Handles authentication flow completion

3. **Deep Link Scheme** (`src-tauri/tauri.conf.json`):
   - Registered scheme: `school-management://`
   - OS registers the app as handler for this scheme
   - OAuth providers redirect to this scheme after authentication

### Authentication Flow

**Email/Password Sign-In:**
1. User enters credentials in Tauri app
2. Request sent to production API
3. Session cookie returned and stored
4. User redirected to dashboard

**Social Sign-In (OAuth):**
1. User clicks social provider button
2. System browser opens to provider's OAuth page
3. User authorizes the app
4. Provider redirects to `school-management://callback`
5. Deep link triggers app to handle callback
6. Session established, user logged in

**Session Persistence:**
- Cookies stored securely by Tauri
- macOS uses Tauri HTTP plugin for proper cookie handling
- Sessions persist across app restarts

### Using Social Authentication

```typescript
import { handleSocialSignIn } from '@/lib/tauri/social-auth';

// Initiate Google sign-in
await handleSocialSignIn('google');

// Other providers
await handleSocialSignIn('github');
await handleSocialSignIn('microsoft');
```

### Platform-Specific Notes

- **Windows/Linux**: Standard cookie handling works out of the box
- **macOS**: Uses Tauri HTTP plugin for proper cookie support
- **All platforms**: Deep links registered automatically during installation

## Important Notes

### API Routes

⚠️ **API routes don't work in Tauri** because it uses static export. All API calls must go to the production server.

### Database

The desktop app connects to the **same production database** as the web version. Consider:
- Using proper authentication
- Implementing rate limiting
- Caching frequently accessed data

### Offline Support

Currently, the app requires internet connection. To add offline support:
1. Implement local SQLite database
2. Add sync mechanism
3. Cache auth tokens securely

### Security

- Auth tokens are stored in browser storage
- HTTPS enforced for production API
- CORS configured on server

## Testing

### Test Web Version
```bash
bun run dev
# Visit http://localhost:3000
```

### Test Tauri Version
```bash
bun run tauri:dev
# Tauri window opens automatically
```

### Test Production Build
```bash
bun run tauri:build
# Install and run the generated installer
# Find it in: src-tauri/target/release/bundle/
```

## Troubleshooting

### Rust Not Found
Install Rust: https://www.rust-lang.org/tools/install

### Build Fails
1. Check Rust is installed: `rustc --version`
2. Check Tauri CLI: `bun run tauri --version`
3. Clean build: `cd src-tauri && cargo clean`

### Auth Not Working in Tauri
1. Check production API is running
2. Verify CORS is configured for Tauri
3. Check browser console for errors

### Icons Missing
Generate icons:
```bash
bun run tauri:icon path/to/icon.png
```

## Next Steps

1. ✅ Tauri is configured
2. ✅ Auth works with production API
3. ✅ Build scripts created
4. 🔄 Test in development mode
5. 🔄 Generate app icons
6. 🔄 Build and test production installer
7. 🔄 Configure code signing (for distribution)

## Resources

- [Tauri Documentation](https://tauri.app)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Better Auth Docs](https://better-auth.com)
