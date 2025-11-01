"use client";

import { ReactNode } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SharedLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showAuth?: boolean;
}

export function SharedLayout({
  children,
  title = "Amrita School Management",
  description,
  showAuth = true,
}: SharedLayoutProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

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
            <Link
              href="/"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl shadow-sm">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">{title}</h1>
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
              </div>
            </Link>

            <div className="flex items-center space-x-3">
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
              {showAuth && session && (
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-medium">
                      {session.user?.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {session.user?.email}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="rounded-xl"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              )}

              {showAuth && !session && (
                <div className="flex items-center space-x-2">
                  <Link href="/auth/signin">
                    <Button variant="ghost" size="sm" className="rounded-xl">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm" className="rounded-xl">
                      Sign Up
                    </Button>
                  </Link>
                </div>
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
            © {new Date().getFullYear()} Amrita School Management System. Built
            with Next.js & ShadCN UI.
          </p>
        </div>
      </footer>
    </div>
  );
}
