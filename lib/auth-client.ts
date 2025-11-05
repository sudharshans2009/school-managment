import { createAuthClient } from "better-auth/react";
import type { Session } from "./auth";

// Check if running in Tauri - only works client-side
const isTauri = () => {
  if (typeof window === "undefined") return false;
  return "__TAURI__" in window;
};

// Check if we should use production API
// Only use production API in actual Tauri production builds, not dev mode
const shouldUseProductionAPI = () => {
  if (!isTauri()) return false;

  // In Tauri dev mode, window loads from localhost, so we should use local API
  // In Tauri production, window loads from tauri:// protocol
  if (typeof window !== "undefined") {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    // Only use production API if we're in Tauri AND not on localhost
    return !isLocalhost;
  }

  return false;
};

// Helper to get base URL for auth - called at runtime, not module load time
const getAuthBaseURL = () => {
  // Only use production URL in actual Tauri production builds
  if (shouldUseProductionAPI()) {
    console.log(
      "🦀 Auth client using production API: https://sms.sudharshans.me",
    );
    return "https://sms.sudharshans.me";
  }

  // In browser or Tauri dev mode, use relative URLs
  console.log("🌐 Auth client using relative URLs (local API)");
  return ""; // Empty string = relative URLs
};

// Get custom fetch implementation for macOS cookie handling
const getCustomFetch = async () => {
  if (!isTauri()) return undefined;

  try {
    // Dynamically import Tauri modules
    const { platform } = await import("@tauri-apps/plugin-os");
    const { fetch: tauriFetch } = await import("@tauri-apps/plugin-http");

    const currentPlatform = platform();

    // Use Tauri HTTP plugin on macOS for proper cookie support
    if (currentPlatform === "macos" && window.location.protocol === "tauri:") {
      return (...params: Parameters<typeof fetch>) => tauriFetch(...params);
    }
  } catch (error) {
    console.warn("Failed to load Tauri HTTP plugin:", error);
  }

  return undefined;
};

// Lazy-initialized auth client
let _authClient: ReturnType<typeof createAuthClient> | null = null;

// Get or create auth client with proper runtime environment detection
const getOrCreateAuthClient = () => {
  if (!_authClient) {
    const baseURL = getAuthBaseURL();
    const credentials = isTauri() ? "include" : "same-origin";

    console.log("Creating auth client with:", { baseURL, credentials });

    _authClient = createAuthClient({
      baseURL,
      credentials,
    });
  }
  return _authClient;
};

// Export lazy-evaluated auth client
export const authClient = new Proxy({} as ReturnType<typeof createAuthClient>, {
  get(_target, prop) {
    const client = getOrCreateAuthClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (client as any)[prop];
  },
});

// Export auth methods
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signIn = new Proxy({} as any, {
  get(_target, prop) {
    const client = getOrCreateAuthClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (client.signIn as any)[prop];
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signUp = new Proxy({} as any, {
  get(_target, prop) {
    const client = getOrCreateAuthClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (client.signUp as any)[prop];
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signOut = new Proxy({} as any, {
  get() {
    const client = getOrCreateAuthClient();
    const method = client.signOut;
    if (typeof method === "function") {
      return method.bind(client);
    }
    return method;
  },
});

export const useSession = () => {
  return getOrCreateAuthClient().useSession();
};

// For advanced usage
export const getAuthClient = async () => {
  const customFetch = await getCustomFetch();

  if (customFetch) {
    // Recreate with custom fetch for macOS
    _authClient = createAuthClient({
      baseURL: getAuthBaseURL(),
      credentials: isTauri() ? "include" : "same-origin",
      fetchOptions: {
        customFetchImpl: customFetch,
      },
    });
  }

  return getOrCreateAuthClient();
};

// Extended session type with role
export type ExtendedSession = Session & {
  user: Session["user"] & {
    role: string;
  };
};
