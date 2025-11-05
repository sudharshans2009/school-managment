"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { isTauriApp } from "@/lib/tauri-utils";
import { authClient } from "@/lib/auth-client";

interface TauriContextType {
  isTauri: boolean;
  isReady: boolean;
}

const TauriContext = createContext<TauriContextType>({
  isTauri: false,
  isReady: false,
});

export function useTauri() {
  return useContext(TauriContext);
}

export function TauriProvider({ children }: { children: React.ReactNode }) {
  const [isTauri, setIsTauri] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkTauri = async () => {
      const result = isTauriApp();
      setIsTauri(result);

      if (result) {
        const isLocalhost = window.location.hostname === "localhost" || 
                           window.location.hostname === "127.0.0.1";
        
        if (isLocalhost) {
          console.log("%c🦀 TAURI DEVELOPMENT MODE", "color: #00ff00; font-size: 20px; font-weight: bold; background: #000; padding: 10px;");
          console.log("%c🌐 Using local API (localhost:3000)", "color: #00ff00; font-size: 14px;");
          console.log("%cℹ️ This is the Tauri dev window with hot reload", "color: #00ff00; font-size: 12px;");
        } else {
          console.log("%c🦀 TAURI DESKTOP APP", "color: #00ff00; font-size: 20px; font-weight: bold; background: #000; padding: 10px;");
          console.log("%c📡 API Base: https://sms.sudharshans.me", "color: #00ff00; font-size: 14px;");
          console.log("%c✅ This is the DESKTOP APPLICATION window", "color: #00ff00; font-size: 14px;");
        }

        // Setup Better Auth for Tauri
        try {
          const { setupBetterAuthTauri } = await import(
            "@daveyplate/better-auth-tauri"
          );

          setupBetterAuthTauri({
            authClient,
            scheme: "school-management",
            debugLogs: false,
            onSuccess: (callbackURL) => {
              console.log("✅ Auth success, redirecting to:", callbackURL);
              if (callbackURL) {
                window.location.href = callbackURL;
              } else {
                window.location.href = "/";
              }
            },
            onError: (error) => {
              console.error("❌ Auth error:", error);
            },
          });

          console.log("✅ Better Auth Tauri setup complete");
        } catch (error) {
          console.error("❌ Failed to setup Better Auth Tauri:", error);
        }
      } else {
        console.log("%c🌐 BROWSER ENVIRONMENT", "color: #ff9900; font-size: 16px; font-weight: bold;");
        console.log("%cℹ️ This is the browser tab (not the desktop app)", "color: #ff9900; font-size: 12px;");
        console.log("%cℹ️ Look for a separate 'School Management System' window", "color: #ff9900; font-size: 12px;");
      }

      setIsReady(true);
    };

    checkTauri();
  }, []);

  return (
    <TauriContext.Provider value={{ isTauri, isReady }}>
      {children}
    </TauriContext.Provider>
  );
}
