# Better Auth Tauri - Visual Architecture

## Component Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     Tauri Desktop App                             │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                 TauriProvider (Client)                      │  │
│  │  - Detects Tauri environment                               │  │
│  │  - Initializes Better Auth Tauri setup                     │  │
│  │  - Handles deep link callbacks                             │  │
│  └────────────────────────────────────────────────────────────┘  │
│                            │                                       │
│                            ▼                                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   Auth Client                               │  │
│  │  - baseURL: https://sms.sudharshans.me                     │  │
│  │  - credentials: "include"                                   │  │
│  │  - macOS: Uses Tauri HTTP plugin for cookies               │  │
│  └────────────────────────────────────────────────────────────┘  │
│                            │                                       │
│                            ▼ HTTPS                                │
└────────────────────────────┼───────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│              Production API Server                              │
│              https://sms.sudharshans.me                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Better Auth (Server)                           │  │
│  │  - Email/Password authentication                          │  │
│  │  - OAuth providers (Google, GitHub, etc.)                 │  │
│  │  - Session management                                     │  │
│  │  - Tauri plugin (deep link handling)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Neon PostgreSQL Database                        │  │
│  │  - users, sessions, accounts, verifications               │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

## Authentication Flow - Email/Password

```
┌─────────────┐                                    ┌─────────────┐
│   Tauri     │                                    │  Production │
│   Desktop   │                                    │  API Server │
│    App      │                                    │             │
└─────────────┘                                    └─────────────┘
      │                                                   │
      │ 1. User enters credentials                       │
      │                                                   │
      │ 2. POST /api/auth/sign-in                        │
      │    { email, password }                           │
      │─────────────────────────────────────────────────>│
      │                                                   │
      │                           3. Validate credentials│
      │                              4. Create session    │
      │                                                   │
      │ 5. Set-Cookie: session=...                       │
      │<─────────────────────────────────────────────────│
      │                                                   │
      │ 6. Store cookie (Tauri handles this)             │
      │    macOS: Uses Tauri HTTP plugin                 │
      │                                                   │
      │ 7. Redirect to dashboard                         │
      │    window.location.href = "/dashboard"           │
      │                                                   │
      │ 8. All future requests include cookie            │
      │    GET /api/...                                  │
      │    Cookie: session=...                           │
      │─────────────────────────────────────────────────>│
      │                                                   │
```

## OAuth Flow - Social Sign-In

```
┌───────────┐              ┌──────────┐              ┌─────────┐
│   Tauri   │              │  System  │              │  OAuth  │
│  Desktop  │              │ Browser  │              │Provider │
│    App    │              │          │              │(Google) │
└───────────┘              └──────────┘              └─────────┘
      │                          │                         │
      │ 1. Click "Sign in        │                         │
      │    with Google"          │                         │
      │                          │                         │
      │ 2. handleSocialSignIn()  │                         │
      │                          │                         │
      │ 3. Open system browser   │                         │
      │    with OAuth URL        │                         │
      │─────────────────────────>│                         │
      │                          │                         │
      │                          │ 4. Navigate to Google   │
      │                          │    OAuth page           │
      │                          │────────────────────────>│
      │                          │                         │
      │                          │ 5. User authorizes      │
      │                          │                         │
      │                          │ 6. Redirect to callback │
      │                          │<────────────────────────│
      │                          │                         │
      │                          │ 7. Server processes     │
      │                          │    OAuth callback       │
      │                          │                         │
      │                          │ 8. Redirect to deep link│
      │                          │    school-management:// │
      │<─────────────────────────│    callback?token=...   │
      │                          │                         │
      │ 9. Deep link triggers app│                         │
      │    Better Auth Tauri     │                         │
      │    handles callback      │                         │
      │                          │                         │
      │ 10. Session established  │                         │
      │     onSuccess callback   │                         │
      │                          │                         │
      │ 11. Redirect to dashboard│                         │
      │                          │                         │
```

## Plugin Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Tauri Core                               │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
│   Deep Link      │  │    HTTP      │  │      OS      │
│    Plugin        │  │   Plugin     │  │   Plugin     │
│                  │  │              │  │              │
│ • Register URL   │  │ • macOS      │  │ • Platform   │
│   scheme         │  │   cookie     │  │   detection  │
│ • Handle         │  │   support    │  │              │
│   callbacks      │  │ • Proper     │  │              │
│                  │  │   fetch      │  │              │
└──────────────────┘  └──────────────┘  └──────────────┘
            │                 │                 │
            └─────────────────┼─────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │    Better Auth Tauri Plugin            │
         │                                        │
         │  • Orchestrates all plugins            │
         │  • Handles auth flows                  │
         │  • Manages deep link callbacks         │
         │  • Provides setupBetterAuthTauri()     │
         │  • Provides signInSocial()             │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │       Better Auth Client               │
         │                                        │
         │  • signIn.email()                      │
         │  • signUp.email()                      │
         │  • signOut()                           │
         │  • useSession()                        │
         └────────────────────────────────────────┘
```

## File Structure

```
school-management/
│
├── lib/
│   ├── auth.ts                    ✅ Server config with Tauri plugin
│   ├── auth-client.ts             ✅ Client config with macOS support
│   ├── tauri-auth.ts              ✅ Tauri auth helpers
│   └── tauri-social-auth.ts       ✅ Social sign-in helper
│
├── components/
│   └── providers/
│       └── tauri-provider.tsx     ✅ Better Auth Tauri setup
│
├── src-tauri/
│   ├── tauri.conf.json            ✅ Deep link registration
│   ├── Cargo.toml                 ✅ Rust dependencies
│   └── src/
│       └── lib.rs                 ✅ Plugin initialization
│
└── docs/
    ├── BETTER_AUTH_TAURI.md       ✅ Integration guide
    ├── AUTHENTICATION_TESTING.md  ✅ Test checklist
    └── BETTER_AUTH_IMPLEMENTATION_COMPLETE.md  ✅ Summary
```

## Session Management

```
┌─────────────────────────────────────────────────────────────┐
│                    Session Lifecycle                         │
└─────────────────────────────────────────────────────────────┘

1. Sign In
   │
   ▼
┌──────────────────┐
│  Create Session  │  • Duration: 7 days
│  on Server       │  • HTTP-only cookie
└──────────────────┘  • Secure flag
   │
   ▼
┌──────────────────┐
│  Send Cookie to  │  Set-Cookie: session=<token>
│  Client          │  Max-Age: 604800 (7 days)
└──────────────────┘
   │
   ▼
┌──────────────────┐
│  Tauri Stores    │  • Windows: Standard cookie jar
│  Cookie          │  • macOS: Tauri HTTP plugin
└──────────────────┘  • Linux: Standard cookie jar
   │
   ▼
┌──────────────────┐
│  App Requests    │  All API calls include:
│  Include Cookie  │  Cookie: session=<token>
└──────────────────┘
   │
   ▼
┌──────────────────┐
│  Session Valid?  │──────No──────> Redirect to Login
│  Check Age       │
└──────────────────┘
   │
  Yes
   │
   ▼
┌──────────────────┐
│  Refresh if      │  • Session > 1 day old
│  Needed          │  • Extends for another 7 days
└──────────────────┘
   │
   ▼
┌──────────────────┐
│  Grant Access    │  User can access protected routes
└──────────────────┘
```

## Platform-Specific Cookie Handling

```
┌─────────────────────────────────────────────────────────────┐
│                    Cookie Handling                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────┐
│  Platform?  │
└─────────────┘
      │
      ├─────────────────┬─────────────────┬─────────────────┐
      │                 │                 │                 │
      ▼                 ▼                 ▼                 ▼
┌──────────┐      ┌──────────┐    ┌──────────┐     ┌──────────┐
│ Windows  │      │  macOS   │    │  Linux   │     │ Browser  │
└──────────┘      └──────────┘    └──────────┘     └──────────┘
      │                 │                 │                 │
      ▼                 ▼                 ▼                 ▼
┌──────────┐      ┌──────────┐    ┌──────────┐     ┌──────────┐
│ Standard │      │  Tauri   │    │ Standard │     │ Standard │
│  fetch   │      │   HTTP   │    │  fetch   │     │  fetch   │
│          │      │  Plugin  │    │          │     │          │
└──────────┘      └──────────┘    └──────────┘     └──────────┘
      │                 │                 │                 │
      └─────────────────┴─────────────────┴─────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Cookies Stored  │
                    │    Properly      │
                    └──────────────────┘
```

## Deep Link Registration

```
┌─────────────────────────────────────────────────────────────┐
│              Deep Link Registration Process                  │
└─────────────────────────────────────────────────────────────┘

Installation
     │
     ▼
┌────────────────┐
│  OS Registers  │  school-management://
│  URL Scheme    │
└────────────────┘
     │
     ├─────────────────┬─────────────────┬─────────────────┐
     │                 │                 │                 │
     ▼                 ▼                 ▼                 ▼
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
│ Windows │      │  macOS  │      │  Linux  │      │  Web    │
└─────────┘      └─────────┘      └─────────┘      └─────────┘
     │                 │                 │                 │
     ▼                 ▼                 ▼                 ▼
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
│Registry │      │  Info   │      │.desktop │      │   N/A   │
│  Entry  │      │  .plist │      │  file   │      │         │
└─────────┘      └─────────┘      └─────────┘      └─────────┘

When deep link is triggered:
school-management://callback?token=xyz

     │
     ▼
┌────────────────┐
│  OS Routes to  │
│   Tauri App    │
└────────────────┘
     │
     ▼
┌────────────────┐
│  Deep Link     │
│  Plugin        │
│  Captures URL  │
└────────────────┘
     │
     ▼
┌────────────────┐
│  Better Auth   │
│  Tauri Plugin  │
│  Processes     │
└────────────────┘
     │
     ▼
┌────────────────┐
│  onSuccess()   │
│  Callback      │
│  Fires         │
└────────────────┘
     │
     ▼
┌────────────────┐
│  User          │
│  Redirected    │
└────────────────┘
```

## Summary

**Key Points:**
1. ✅ All authentication flows go through production API
2. ✅ Deep links handle OAuth callbacks seamlessly
3. ✅ Platform-specific cookie handling ensures compatibility
4. ✅ Session persistence across app restarts
5. ✅ Secure token storage using HTTP-only cookies

**Architecture Benefits:**
- Unified backend for web and desktop
- Secure authentication with system browser
- Proper session management
- Cross-platform compatibility
- Clear separation of concerns
