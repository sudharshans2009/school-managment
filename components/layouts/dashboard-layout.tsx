"use client";

import { ReactNode } from "react";
import { useSession, signOut } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  LogOut,
  Moon,
  Sun,
  Home,
  Bell,
  User,
  ArrowLeft,
  LucideIcon,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ExtendedUser } from "@/types/better-auth";
import { useTauri } from "@/components/providers/tauri-provider";
import Image from "next/image";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showBackButton?: boolean;
  icon?: LucideIcon;
}

export function DashboardLayout({
  children,
  title = "Dashboard",
  description,
  showBackButton = false,
  icon,
}: DashboardLayoutProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { isTauri } = useTauri();

  // Get role-based dashboard URL
  const getDashboardUrl = () => {
    const userRole = (session?.user as ExtendedUser)?.role;
    if (!userRole) return "/dashboard";
    const role = userRole.toLowerCase();
    if (role === "admin") return "/admin";
    if (role === "teacher") return "/teacher";
    if (role === "student") return "/student";
    return "/dashboard";
  };

  // Fetch announcements count for notification badge
  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      const response = await fetch("/api/notifications?countOnly=true");
      if (!response.ok) return { count: 0 };
      return response.json();
    },
    enabled: !!session,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time updates
    staleTime: 20 * 1000, // Consider data stale after 20 seconds
  });

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/signin");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="sr-only">Go back</span>
                </Button>
              )}
              <Link
                href={getDashboardUrl()}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-primary shadow-sm rounded-xl">
                  {(() => {
                    const Icon = icon || GraduationCap;
                    return <Icon className="w-6 h-6 text-primary-foreground" />;
                  })()}
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <h1 className="text-lg font-semibold">{title}</h1>
                    {description && (
                      <p className="text-xs text-muted-foreground">
                        {description}
                      </p>
                    )}
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
            </div>

            <div className="flex items-center gap-2">
              {/* Navigation Links */}
              <Link href={getDashboardUrl()}>
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </Link>

              <Link href="/notifications">
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Notifications</span>
                  {unreadCount && unreadCount.count > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadCount.count > 9 ? "9+" : unreadCount.count}
                    </Badge>
                  )}
                </Button>
              </Link>

              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
              </Link>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              {/* Sign Out */}
              {session && (
                <Button variant="destructive" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="container mx-auto px-6 py-6">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Amrita Vidyalayam, Ettimadai.
            Built with Next.js & ShadCN UI.
          </p>
        </div>
      </footer>
    </div>
  );
}
