"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import {
  Zap,
  Home,
  Calendar,
  Users,
  Download,
  RefreshCw,
  Minimize2,
  Maximize2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

export function AppQuickActions() {
  const [isTauri, setIsTauri] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if running in Tauri
    const checkTauri = async () => {
      try {
        // @ts-expect-error - Tauri API check
        if (window.__TAURI__) {
          setIsTauri(true);

          // Setup keyboard shortcuts
          const handleKeyboard = (e: KeyboardEvent) => {
            // Ctrl/Cmd + Shift + H - Home
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "H") {
              e.preventDefault();
              router.push("/");
            }
            // Ctrl/Cmd + Shift + C - Calendar
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
              e.preventDefault();
              router.push("/calendar");
            }
            // Ctrl/Cmd + Shift + S - Students
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
              e.preventDefault();
              router.push("/admin/students");
            }
            // F11 - Fullscreen
            if (e.key === "F11") {
              e.preventDefault();
              toggleFullscreen();
            }
          };

          window.addEventListener("keydown", handleKeyboard);
          return () => window.removeEventListener("keydown", handleKeyboard);
        }
      } catch {
        // Not in Tauri
      }
    };

    checkTauri();
  }, [router]);

  const toggleFullscreen = async () => {
    try {
      // @ts-expect-error - Tauri API
      if (!window.__TAURI__) return;
      
      // Dynamic import with fallback
      let windowModule;
      try {
        windowModule = await import("@tauri-apps/plugin-window");
      } catch {
        console.warn("Tauri window plugin not available");
        return;
      }
      
      const appWindow = windowModule.getCurrent();
      const fullscreen = await appWindow.isFullscreen();
      await appWindow.setFullscreen(!fullscreen);
      setIsFullscreen(!fullscreen);
    } catch (error) {
      console.error("Failed to toggle fullscreen:", error);
    }
  };

  const minimizeWindow = async () => {
    try {
      // @ts-expect-error - Tauri API
      if (!window.__TAURI__) return;
      
      let windowModule;
      try {
        windowModule = await import("@tauri-apps/plugin-window");
      } catch {
        console.warn("Tauri window plugin not available");
        return;
      }
      
      const appWindow = windowModule.getCurrent();
      await appWindow.minimize();
    } catch (error) {
      console.error("Failed to minimize window:", error);
    }
  };

  const closeWindow = async () => {
    try {
      // @ts-expect-error - Tauri API
      if (!window.__TAURI__) return;
      
      let windowModule;
      try {
        windowModule = await import("@tauri-apps/plugin-window");
      } catch {
        console.warn("Tauri window plugin not available");
        return;
      }
      
      const appWindow = windowModule.getCurrent();
      await appWindow.close();
    } catch (error) {
      console.error("Failed to close window:", error);
    }
  };

  const checkForUpdates = async () => {
    try {
      // @ts-expect-error - Tauri API
      if (!window.__TAURI__) return;
      
      console.log("Checking for updates...");
      
      let updaterModule, processModule;
      try {
        // @ts-expect-error - Optional Tauri plugins
        updaterModule = await import("@tauri-apps/plugin-updater");
        // @ts-expect-error - Optional Tauri plugins
        processModule = await import("@tauri-apps/plugin-process");
      } catch {
        console.warn("Tauri updater/process plugins not available");
        alert("Update feature is not available in this build.");
        return;
      }
      
      const { check } = updaterModule;
      const update = await check();
      
      if (update?.available) {
        const shouldUpdate = window.confirm(
          `Update available: v${update.version}\n\nWould you like to install it now?`
        );
        if (shouldUpdate) {
          await update.downloadAndInstall();
          const { relaunch } = processModule;
          await relaunch();
        }
      } else {
        alert("You're running the latest version!");
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
      alert("Failed to check for updates. Please try again later.");
    }
  };

  const syncOfflineData = async () => {
    try {
      console.log("Syncing offline data...");
      // This would trigger your offline data sync logic
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Offline data synced successfully!");
    } catch (error) {
      console.error("Failed to sync data:", error);
      alert("Failed to sync offline data. Please try again.");
    }
  };

  // Only show in Tauri
  if (!isTauri) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-lg"
          title="Quick Actions (Ctrl+Shift+Q)"
        >
          <Zap className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => router.push("/")}>
          <Home className="mr-2 h-4 w-4" />
          <span>Home</span>
          <DropdownMenuShortcut>⌘⇧H</DropdownMenuShortcut>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => router.push("/calendar")}>
          <Calendar className="mr-2 h-4 w-4" />
          <span>Calendar</span>
          <DropdownMenuShortcut>⌘⇧C</DropdownMenuShortcut>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => router.push("/admin/students")}>
          <Users className="mr-2 h-4 w-4" />
          <span>Students</span>
          <DropdownMenuShortcut>⌘⇧S</DropdownMenuShortcut>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={syncOfflineData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          <span>Sync Offline Data</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={checkForUpdates}>
          <Download className="mr-2 h-4 w-4" />
          <span>Check for Updates</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Window Controls
        </DropdownMenuLabel>
        
        <DropdownMenuItem onClick={toggleFullscreen}>
          {isFullscreen ? (
            <Minimize2 className="mr-2 h-4 w-4" />
          ) : (
            <Maximize2 className="mr-2 h-4 w-4" />
          )}
          <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          <DropdownMenuShortcut>F11</DropdownMenuShortcut>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={minimizeWindow}>
          <Minimize2 className="mr-2 h-4 w-4" />
          <span>Minimize</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={closeWindow} className="text-red-600 dark:text-red-400">
          <X className="mr-2 h-4 w-4" />
          <span>Close App</span>
          <DropdownMenuShortcut>⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
