"use client";

/**
 * Utility functions for Tauri integration
 * Provides helpers for detecting Tauri environment and accessing Tauri APIs
 */

export const isTauriApp = (): boolean => {
  if (typeof window === "undefined") return false;
  return "__TAURI__" in window;
};

export const getTauriAPI = async () => {
  if (!isTauriApp()) return null;

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const { getCurrentWindow } = await import("@tauri-apps/api/window");

    return {
      invoke,
      getCurrentWindow,
    };
  } catch (error) {
    console.error("Failed to load Tauri API:", error);
    return null;
  }
};

export const showNotification = async (title: string, body: string) => {
  if (!isTauriApp()) {
    // Fallback to browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
    return;
  }

  // For Tauri, we can use browser notifications for now
  // Or implement a custom notification system
  try {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        new Notification(title, { body });
      }
    }
  } catch (error) {
    console.error("Failed to show notification:", error);
  }
};

export const openExternal = async (url: string) => {
  if (!isTauriApp()) {
    window.open(url, "_blank");
    return;
  }

  try {
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    await openUrl(url);
  } catch (error) {
    console.error("Failed to open external link:", error);
    // Fallback to window.open
    window.open(url, "_blank");
  }
};

export const saveFile = async (filename: string, content: string) => {
  // Fallback to browser download for all cases
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const openFile = async (
  filters?: Array<{ name: string; extensions: string[] }>
): Promise<string | null> => {
  // Use browser file input for all cases
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    if (filters && filters.length > 0) {
      input.accept = filters
        .flatMap((f) => f.extensions.map((ext) => `.${ext}`))
        .join(",");
    }
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        resolve(text);
      } else {
        resolve(null);
      }
    };
    input.click();
  });
};

/**
 * Get the base API URL depending on environment
 * In Tauri, always use production API
 * In browser, use relative URLs
 */
export const getApiBaseURL = (): string => {
  if (isTauriApp()) {
    console.log("🦀 Using production API for Tauri");
    return "https://sms.sudharshans.me";
  }
  console.log("🌐 Using relative URLs for browser");
  return ""; // Use relative URLs in browser
};

/**
 * Make an API request with proper URL handling
 */
export const apiRequest = async (
  endpoint: string,
  options?: RequestInit
): Promise<Response> => {
  const baseURL = getApiBaseURL();
  const url = `${baseURL}${endpoint}`;

  return fetch(url, {
    ...options,
    credentials: isTauriApp() ? "include" : "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
};
