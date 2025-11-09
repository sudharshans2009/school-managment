"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Monitor, Smartphone, Apple, Check, Clock, Zap, Bell, Cloud, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function AppDownloadBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isTauri, setIsTauri] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [platform, setPlatform] = useState<{
    os: string;
    icon: React.ReactNode;
    downloadUrl: string;
    supported: boolean;
    comingSoon: boolean;
    features: string[];
  } | null>(null);

  useEffect(() => {
    // Check if running in Tauri
    const checkTauri = async () => {
      try {
        // @ts-expect-error - Tauri API check
        if (window.__TAURI__) {
          setIsTauri(true);
          return;
        }
      } catch {
        // Not in Tauri
      }

      // Check if user has dismissed the banner
      const dismissed = localStorage.getItem("appDownloadBannerDismissed");
      if (dismissed === "true") {
        return;
      }

      // Detect platform
      const userAgent = navigator.userAgent.toLowerCase();
      const platform = navigator.platform.toLowerCase();

      let detectedPlatform: {
        os: string;
        icon: React.ReactNode;
        downloadUrl: string;
        supported: boolean;
        comingSoon: boolean;
        features: string[];
      } | null = null;

      // Windows
      if (platform.includes("win") || userAgent.includes("windows")) {
        detectedPlatform = {
          os: "Windows",
          icon: <Monitor className="h-5 w-5" />,
          downloadUrl: "/downloads/amrita-school-management_windows.msi",
          supported: true,
          comingSoon: false,
          features: [
            "Native desktop performance",
            "Offline access to schedules & data",
            "System tray notifications",
            "Auto-updates",
            "File system integration",
            "Keyboard shortcuts"
          ],
        };
      }
      // Android
      else if (userAgent.includes("android")) {
        detectedPlatform = {
          os: "Android",
          icon: <Smartphone className="h-5 w-5" />,
          downloadUrl: "/downloads/amrita-school-management_android.apk",
          supported: true,
          comingSoon: false,
          features: [
            "Mobile-optimized interface",
            "Push notifications",
            "Offline mode",
            "Biometric authentication",
            "Quick actions from home screen",
            "Battery optimized"
          ],
        };
      }
      // macOS
      else if (platform.includes("mac") || userAgent.includes("mac")) {
        detectedPlatform = {
          os: "macOS",
          icon: <Apple className="h-5 w-5" />,
          downloadUrl: "/downloads/amrita-school-management_macos.dmg",
          supported: false,
          comingSoon: true,
          features: [
            "Apple Silicon optimized",
            "TouchBar support",
            "iCloud integration",
            "Handoff support",
            "Spotlight search",
            "Native macOS design"
          ],
        };
      }
      // iOS
      else if (
        userAgent.includes("iphone") ||
        userAgent.includes("ipad") ||
        userAgent.includes("ipod")
      ) {
        detectedPlatform = {
          os: "iOS",
          icon: <Apple className="h-5 w-5" />,
          downloadUrl: "/downloads/amrita-school-management_ios.ipa",
          supported: false,
          comingSoon: true,
          features: [
            "Native iOS experience",
            "Face ID / Touch ID",
            "Widgets support",
            "Apple Pencil support",
            "Siri shortcuts",
            "iCloud sync"
          ],
        };
      }
      // Linux
      else if (platform.includes("linux") || userAgent.includes("linux")) {
        detectedPlatform = {
          os: "Linux",
          icon: <Monitor className="h-5 w-5" />,
          downloadUrl: "/downloads/amrita-school-management_linux.AppImage",
          supported: false,
          comingSoon: true,
          features: [
            "AppImage format",
            "Cross-distribution support",
            "Wayland & X11 compatible",
            "Native notifications",
            "System tray integration",
            "Open source friendly"
          ],
        };
      }

      setPlatform(detectedPlatform);
      setIsVisible(true);
    };

    checkTauri();
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("appDownloadBannerDismissed", "true");
    setIsVisible(false);
  };

  const handleDownload = () => {
    if (platform?.supported && platform?.downloadUrl) {
      // Track download event
      console.log(`Downloading ${platform.os} app`);
      // In production, this would trigger the actual download
      window.location.href = platform.downloadUrl;
    }
  };

  // Don't show if in Tauri or dismissed or no platform detected
  if (isTauri || !isVisible || !platform) {
    return null;
  }

  return (
    <div className="sticky top-0 z-30 w-full border-b bg-linear-to-r from-primary/5 via-background to-primary/5 backdrop-blur-md supports-backdrop-filter:bg-background/80">
      <div className="container mx-auto px-4">
        <div className="flex min-h-16 items-center justify-between gap-4 py-2">
          {/* Left side - Icon and Message */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 bg-linear-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
              <div className="text-primary-foreground">
                {platform.icon}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold truncate">
                  {platform.supported ? (
                    <>
                      Get the <span className="text-primary">{platform.os}</span> App
                    </>
                  ) : (
                    <>
                      <span className="text-primary">{platform.os}</span> App Coming Soon
                    </>
                  )}
                </p>
                {platform.comingSoon && (
                  <Badge
                    variant="secondary"
                    className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Soon
                  </Badge>
                )}
                {platform.supported && (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Available
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {platform.supported && (
                  <>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3" />
                      <span className="hidden sm:inline">Fast</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Cloud className="h-3 w-3" />
                      <span className="hidden sm:inline">Offline</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Bell className="h-3 w-3" />
                      <span className="hidden sm:inline">Notifications</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Shield className="h-3 w-3" />
                      <span className="hidden sm:inline">Secure</span>
                    </div>
                  </>
                )}
                {platform.comingSoon && (
                  <p className="text-xs text-muted-foreground">
                    Available: Windows & Android
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {platform.supported ? (
              <>
                <Button
                  onClick={handleDownload}
                  size="sm"
                  className="rounded-lg bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={() => setShowFeatures(!showFeatures)}
                  size="sm"
                  variant="ghost"
                  className="rounded-lg hidden lg:flex"
                >
                  {showFeatures ? "Hide" : "Features"}
                </Button>
              </>
            ) : (
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="secondary"
                className="rounded-lg"
              >
                Notify Me
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="rounded-lg shrink-0 hover:bg-destructive/10"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Expandable Features Section */}
        {showFeatures && platform.supported && (
          <div className="pb-4 animate-in slide-in-from-top-2">
            <Card className="p-4 bg-linear-to-br from-primary/5 to-background border-primary/20">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                App Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {platform.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs">
                    <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Version 1.0.0 • Released {new Date().toLocaleDateString()}
                </p>
                <Button
                  onClick={handleDownload}
                  size="sm"
                  variant="default"
                  className="rounded-lg"
                >
                  <Download className="h-3 w-3 mr-2" />
                  Download Now
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
