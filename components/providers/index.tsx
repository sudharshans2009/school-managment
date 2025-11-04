"use client";

import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { type ReactNode } from "react";
import { TauriProvider } from "./tauri-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TauriProvider>
        <QueryProvider>
          {children}
          <Toaster richColors position="top-right" />
        </QueryProvider>
      </TauriProvider>
    </ThemeProvider>
  );
}
