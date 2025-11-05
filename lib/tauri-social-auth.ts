/**
 * Tauri Social Authentication Utilities
 *
 * Provides helper functions for social sign-in in Tauri desktop app.
 * Uses Better Auth Tauri plugin for deep link handling.
 */

import { authClient } from "@/lib/auth-client";
import { isTauriApp } from "@/lib/tauri-utils";

/**
 * Initiate social sign-in flow
 * Opens system browser for OAuth and handles deep link callback
 *
 * @param provider - OAuth provider (e.g., "google", "github", "microsoft")
 */
export async function handleSocialSignIn(provider: string) {
  if (!isTauriApp()) {
    console.warn("Social sign-in helper called outside Tauri environment");
    // Fall back to regular Better Auth social sign-in
    // Note: This requires Better Auth social plugins to be configured
    return;
  }

  try {
    const { signInSocial } = await import("@daveyplate/better-auth-tauri");

    await signInSocial({
      authClient,
      provider,
    });

    console.log(`✅ Initiated ${provider} sign-in flow`);
  } catch (error) {
    console.error(`❌ Failed to initiate ${provider} sign-in:`, error);
    throw error;
  }
}

/**
 * Check if social authentication is available
 * Returns true if running in Tauri environment
 */
export function isSocialAuthAvailable(): boolean {
  return isTauriApp();
}

/**
 * Supported social providers
 * Add more providers as needed based on Better Auth configuration
 */
export const SUPPORTED_PROVIDERS = [
  { id: "google", name: "Google", icon: "🔍" },
  { id: "github", name: "GitHub", icon: "🐙" },
  { id: "microsoft", name: "Microsoft", icon: "Ⓜ️" },
] as const;

export type SocialProvider = (typeof SUPPORTED_PROVIDERS)[number]["id"];
