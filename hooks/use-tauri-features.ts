/**
 * Tauri Enhanced Features Hook
 * 
 * This hook provides access to enhanced Tauri app features including:
 * - System notifications
 * - File system operations
 * - Auto-updates
 * - System tray
 * - Global shortcuts
 */

import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  modified: number;
}

export interface UpdateInfo {
  version: string;
  current_version: string;
  available: boolean;
  download_url?: string;
}

export function useTauriFeatures() {
  const [isTauri, setIsTauri] = useState(false);
  const [appVersion, setAppVersion] = useState<string | null>(null);

  // Get App Version Function (defined before useEffect)
  const getAppVersion = async (): Promise<string | null> => {
    try {
      // @ts-expect-error - Tauri global
      const tauri = window.__TAURI__;
      if (!tauri) return null;
      return await invoke<string>("get_app_version");
    } catch (error) {
      console.error("Failed to get app version:", error);
      return null;
    }
  };

  useEffect(() => {
    // Check if running in Tauri
    const checkTauri = async () => {
      try {
        // @ts-expect-error - Tauri global
        const tauri = window.__TAURI__;
        setIsTauri(!!tauri);
        
        if (tauri) {
          const version = await getAppVersion();
          setAppVersion(version);
        }
      } catch {
        setIsTauri(false);
      }
    };

    checkTauri();
  }, []);

  // Notification Functions
  const sendNotification = async (title: string, body: string): Promise<void> => {
    if (!isTauri) return;
    try {
      await invoke("send_notification", { title, body });
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  };

  const sendNotificationWithIcon = async (
    title: string,
    body: string,
    icon: string
  ): Promise<void> => {
    if (!isTauri) return;
    try {
      await invoke("send_notification_with_icon", { title, body, icon });
    } catch (error) {
      console.error("Failed to send notification with icon:", error);
    }
  };

  const requestNotificationPermission = async (): Promise<string | null> => {
    if (!isTauri) return null;
    try {
      return await invoke<string>("request_notification_permission");
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      return null;
    }
  };

  // File System Functions
  const saveFile = async (filename: string, content: string): Promise<string | null> => {
    if (!isTauri) return null;
    try {
      return await invoke<string>("save_file", { filename, content });
    } catch (error) {
      console.error("Failed to save file:", error);
      return null;
    }
  };

  const readFile = async (filePath: string): Promise<string | null> => {
    if (!isTauri) return null;
    try {
      return await invoke<string>("read_file", { filePath });
    } catch (error) {
      console.error("Failed to read file:", error);
      return null;
    }
  };

  const getFileInfo = async (filePath: string): Promise<FileInfo | null> => {
    if (!isTauri) return null;
    try {
      return await invoke<FileInfo>("get_file_info", { filePath });
    } catch (error) {
      console.error("Failed to get file info:", error);
      return null;
    }
  };

  const selectFileDialog = async (): Promise<string | null> => {
    if (!isTauri) return null;
    try {
      return await invoke<string | null>("select_file_dialog");
    } catch (error) {
      console.error("Failed to show file dialog:", error);
      return null;
    }
  };

  const selectFolderDialog = async (): Promise<string | null> => {
    if (!isTauri) return null;
    try {
      return await invoke<string | null>("select_folder_dialog");
    } catch (error) {
      console.error("Failed to show folder dialog:", error);
      return null;
    }
  };

  // Updater Functions
  const checkForUpdates = async (): Promise<UpdateInfo | null> => {
    if (!isTauri) return null;
    try {
      return await invoke<UpdateInfo>("check_for_updates");
    } catch (error) {
      console.error("Failed to check for updates:", error);
      return null;
    }
  };

  const installUpdate = async (): Promise<void> => {
    if (!isTauri) return;
    try {
      await invoke("install_update");
    } catch (error) {
      console.error("Failed to install update:", error);
    }
  };

  // Window Functions
  const toggleWindow = async (): Promise<void> => {
    if (!isTauri) return;
    try {
      await invoke("toggle_window");
    } catch (error) {
      console.error("Failed to toggle window:", error);
    }
  };

  const quickSearch = async (): Promise<void> => {
    if (!isTauri) return;
    try {
      await invoke("quick_search");
    } catch (error) {
      console.error("Failed to trigger quick search:", error);
    }
  };

  const quickAttendance = async (): Promise<void> => {
    if (!isTauri) return;
    try {
      await invoke("quick_attendance");
    } catch (error) {
      console.error("Failed to trigger quick attendance:", error);
    }
  };

  return {
    isTauri,
    appVersion,
    // Notifications
    sendNotification,
    sendNotificationWithIcon,
    requestNotificationPermission,
    // File System
    saveFile,
    readFile,
    getFileInfo,
    selectFileDialog,
    selectFolderDialog,
    // Updater
    checkForUpdates,
    installUpdate,
    getAppVersion,
    // Window
    toggleWindow,
    quickSearch,
    quickAttendance,
  };
}
