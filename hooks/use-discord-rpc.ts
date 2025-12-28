"use client";

import { useEffect, useCallback, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  DiscordPresenceData,
  SchoolActivity,
  ACTIVITY_PRESETS,
  ActivityPresenceConfig,
} from "@/types/discord-rpc";

interface UseDiscordRPCOptions {
  autoInit?: boolean;
  autoDisconnectOnUnmount?: boolean;
  enableLogging?: boolean;
}

interface UseDiscordRPCReturn {
  isConnected: boolean;
  isInitializing: boolean;
  error: string | null;
  init: () => Promise<void>;
  disconnect: () => Promise<void>;
  updatePresence: (data: DiscordPresenceData) => Promise<void>;
  updateActivityPreset: (activity: SchoolActivity, customDetails?: string) => Promise<void>;
  clearPresence: () => Promise<void>;
  checkConnection: () => Promise<void>;
}

/**
 * Custom hook for managing Discord Rich Presence in the School Management System
 * 
 * @param options Configuration options for the hook
 * @returns Discord RPC control functions and state
 * 
 * @example
 * ```tsx
 * const { isConnected, updateActivityPreset } = useDiscordRPC({ autoInit: true });
 * 
 * // Update presence when viewing a specific page
 * useEffect(() => {
 *   if (isConnected) {
 *     updateActivityPreset(SchoolActivity.VIEWING_DASHBOARD);
 *   }
 * }, [isConnected]);
 * ```
 */
export function useDiscordRPC(options: UseDiscordRPCOptions = {}): UseDiscordRPCReturn {
  const {
    autoInit = false,
    autoDisconnectOnUnmount = true,
    enableLogging = false,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const log = useCallback(
    (message: string, data?: any) => {
      if (enableLogging) {
        console.log(`[Discord RPC] ${message}`, data || "");
      }
    },
    [enableLogging]
  );

  /**
   * Check if Discord RPC is currently connected
   */
  const checkConnection = useCallback(async () => {
    try {
      const connected = await invoke<boolean>("is_discord_connected");
      setIsConnected(connected);
      log("Connection status checked", { connected });
      return connected;
    } catch (err) {
      log("Failed to check connection", err);
      setIsConnected(false);
      return false;
    }
  }, [log]);

  /**
   * Initialize Discord RPC connection
   */
  const init = useCallback(async () => {
    if (isInitializing) {
      log("Already initializing, skipping...");
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      const result = await invoke<string>("init_discord_rpc");
      log("Initialized", result);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      log("Failed to initialize", errorMessage);
      setError(errorMessage);
      setIsConnected(false);
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing, log]);

  /**
   * Disconnect Discord RPC
   */
  const disconnect = useCallback(async () => {
    try {
      // Clear presence first
      try {
        await invoke<string>("clear_discord_presence");
      } catch (e) {
        // Ignore errors if already disconnected
      }
      
      const result = await invoke<string>("disconnect_discord_rpc");
      log("Disconnected", result);
      setIsConnected(false);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      log("Failed to disconnect", errorMessage);
      // Still set as disconnected even if error occurs
      setIsConnected(false);
      setError(errorMessage);
    }
  }, [log]);

  /**
   * Update Discord presence with custom data
   */
  const updatePresence = useCallback(
    async (data: DiscordPresenceData) => {
      if (!isConnected) {
        log("Not connected, skipping presence update");
        return;
      }

      try {
        const result = await invoke<string>("update_discord_presence", {
          presenceData: data,
        });
        log("Presence updated", data);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        log("Failed to update presence", errorMessage);
        setError(errorMessage);
      }
    },
    [isConnected, log]
  );

  /**
   * Update presence using a predefined activity preset
   */
  const updateActivityPreset = useCallback(
    async (activity: SchoolActivity, customDetails?: string) => {
      if (!isConnected) {
        log("Not connected, skipping activity preset update");
        return;
      }

      const preset = ACTIVITY_PRESETS[activity];
      if (!preset) {
        log("Invalid activity preset", activity);
        return;
      }

      const presenceData: DiscordPresenceData = {
        state: preset.state,
        details: customDetails || preset.details,
        large_image_key: preset.largeImage,
        large_image_text: preset.largeText,
        small_image_key: preset.smallImage,
        small_image_text: preset.smallText,
        start_timestamp: Math.floor(Date.now() / 1000),
      };

      await updatePresence(presenceData);
    },
    [isConnected, updatePresence, log]
  );

  /**
   * Clear the current Discord presence
   */
  const clearPresence = useCallback(async () => {
    if (!isConnected) {
      log("Not connected, skipping clear presence");
      return;
    }

    try {
      const result = await invoke<string>("clear_discord_presence");
      log("Presence cleared", result);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      log("Failed to clear presence", errorMessage);
      setError(errorMessage);
    }
  }, [isConnected, log]);

  // Auto-initialize on mount if enabled
  useEffect(() => {
    if (autoInit) {
      checkConnection().then((connected) => {
        if (!connected) {
          init();
        }
      });
    }
  }, [autoInit, checkConnection, init]);

  // Auto-disconnect on unmount if enabled
  useEffect(() => {
    return () => {
      if (autoDisconnectOnUnmount && isConnected) {
        disconnect();
      }
    };
  }, [autoDisconnectOnUnmount, isConnected, disconnect]);

  return {
    isConnected,
    isInitializing,
    error,
    init,
    disconnect,
    updatePresence,
    updateActivityPreset,
    clearPresence,
    checkConnection,
  };
}
