"use client";

import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

export function OfflineIndicator() {
  // Initialize with current online status
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window !== "undefined") {
      return navigator.onLine;
    }
    return true;
  });

  // Check if running in Tauri once
  const isTauri = useMemo(() => {
    try {
      // @ts-expect-error - Tauri API check
      return !!window.__TAURI__;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Only show in Tauri app or when offline in browser
  if (!isTauri && isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
      <Badge
        variant={isOnline ? "secondary" : "destructive"}
        className={`
          px-3 py-2 text-xs font-medium shadow-lg
          ${
            isOnline
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800"
          }
        `}
      >
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3 mr-2" />
            {isTauri ? "App Mode • Online" : "Online"}
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 mr-2" />
            {isTauri ? "App Mode • Offline" : "Offline Mode"}
          </>
        )}
      </Badge>
    </div>
  );
}
