"use client";

import { isTauriApp } from "./tauri-utils";

/**
 * Get the base URL for authentication
 * In Tauri: Use production API server
 * In Browser: Use relative URLs
 */
export const getAuthBaseURL = (): string => {
  if (isTauriApp()) {
    return "https://sms.sudharshans.me";
  }
  return ""; // Use relative URLs in browser
};

/**
 * Get the full auth endpoint URL
 */
export const getAuthEndpoint = (endpoint: string): string => {
  const baseURL = getAuthBaseURL();
  return `${baseURL}${endpoint}`;
};

/**
 * Configure auth for Tauri environment
 */
export const configureTauriAuth = () => {
  if (isTauriApp() && typeof window !== "undefined") {
    console.log("🔐 Configuring Tauri auth");
    console.log("📡 Auth API: https://sms.sudharshans.me/api/auth");
  }
};

/**
 * Make an authenticated API request
 */
export const authFetch = async (
  endpoint: string,
  options?: RequestInit
): Promise<Response> => {
  const baseURL = getAuthBaseURL();
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
