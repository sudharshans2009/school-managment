"use client";

import { ReactNode } from "react";
import { useSession } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { X, GraduationCap, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import Image from "next/image";
import { useTauri } from "@/components/providers/tauri-provider";
import { AppDownloadBanner } from "@/components/app-download-banner";
import { AppQuickActions } from "@/components/app-quick-actions";
import { OfflineIndicator } from "@/components/offline-indicator";

interface HomeLayoutProps {
  children: ReactNode;
}

export function HomeLayout({ children }: HomeLayoutProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { isTauri } = useTauri();

  // Determine dashboard route based on user role
  const getDashboardRoute = () => {
    if (!session?.user) return "/dashboard";

    // Type assertion for the role field from Better Auth
    const user = session.user as { role?: string };
    const role = user.role;

    switch (role) {
      case "admin":
        return "/admin";
      case "teacher":
        return "/teacher";
      case "student":
        return "/student";
      default:
        return "/dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* App Download Banner */}
      <AppDownloadBanner />
      
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo + Website Name */}
            <Link
              href="/"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl shadow-sm">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <h1 className="text-lg font-semibold">
                    Amrita School Management
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Modern School Management System
                  </p>
                </div>
                {isTauri && (
                  <>
                    <X />
                    <div className="flex items-center ml-2">
                      <Image
                        src={
                          theme === "dark"
                            ? "/tauri-dark.svg"
                            : "/tauri-light.svg"
                        }
                        alt="Tauri Desktop App"
                        width={80}
                        height={25}
                        priority
                      />
                    </div>
                  </>
                )}
              </div>
            </Link>

            <div className="flex items-center space-x-3">
              {/* Quick Actions for Tauri */}
              <AppQuickActions />
              
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-xl"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              {/* Auth Buttons */}
              {session ? (
                <Link href={getDashboardRoute()}>
                  <Button className="rounded-xl">Go to Dashboard</Button>
                </Link>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/auth/signin">
                    <Button size="sm" className="rounded-xl">
                      Sign In
                    </Button>
                  </Link>
                  {/* <Link href="/auth/signup">
                    <Button size="sm" className="rounded-xl">
                      Sign Up
                    </Button>
                  </Link> */}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
      
      {/* Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}
