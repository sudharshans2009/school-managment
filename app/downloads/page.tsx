"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Monitor,
  Smartphone,
  Apple,
  Check,
  Clock,
  Info,
} from "lucide-react";
import { HomeLayout } from "@/components/layouts/home-layout";
import { EnhancedFeaturesShowcase } from "@/components/enhanced-features-showcase";
import Link from "next/link";

export default function DownloadsPage() {
  const platforms = [
    {
      name: "Windows",
      icon: <Monitor className="h-8 w-8" />,
      description: "Windows 10/11 (64-bit)",
      downloadUrl: "/downloads/amrita-school-management_windows.msi",
      fileSize: "~85 MB",
      version: "1.0.0",
      supported: true,
      comingSoon: false,
      features: [
        "Native performance",
        "Offline access",
        "System notifications",
        "Auto-updates",
      ],
    },
    {
      name: "Android",
      icon: <Smartphone className="h-8 w-8" />,
      description: "Android 8.0 and above",
      downloadUrl: "/downloads/amrita-school-management_android.apk",
      fileSize: "~45 MB",
      version: "1.0.0",
      supported: true,
      comingSoon: false,
      features: [
        "Mobile-optimized UI",
        "Push notifications",
        "Offline mode",
        "Biometric login",
      ],
    },
    {
      name: "macOS",
      icon: <Apple className="h-8 w-8" />,
      description: "macOS 11 (Big Sur) and above",
      downloadUrl: "/downloads/amrita-school-management_macos.dmg",
      fileSize: "~90 MB",
      version: "1.0.0",
      supported: true,
      comingSoon: false,
      features: [
        "Apple Silicon optimized",
        "TouchBar support",
        "iCloud integration",
        "Universal binary",
      ],
    },
    {
      name: "iOS",
      icon: <Apple className="h-8 w-8" />,
      description: "iOS 14.0 and above",
      downloadUrl: "/downloads/amrita-school-management_ios.ipa",
      fileSize: "~40 MB",
      version: "1.0.0",
      supported: true,
      comingSoon: false,
      features: [
        "Native iOS experience",
        "Face ID / Touch ID",
        "Widgets",
        "Apple Pencil support",
      ],
    },
    {
      name: "Linux",
      icon: <Monitor className="h-8 w-8" />,
      description: "Ubuntu 20.04+ / Fedora 35+",
      downloadUrl: "/downloads/amrita-school-management_linux.AppImage",
      fileSize: "~80 MB",
      version: "Coming Soon",
      supported: false,
      comingSoon: true,
      features: [
        "AppImage format",
        "Cross-distribution",
        "Wayland support",
        "Flatpak alternative",
      ],
    },
  ];

  return (
    <HomeLayout>
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Download Amrita Vidyalayam, Ettimadai
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get the native app for the best experience on your device. Fast,
              secure, and works offline.
            </p>
          </div>

          {/* Platform Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platforms.map((platform) => (
              <Card
                key={platform.name}
                className={`rounded-2xl ${
                  platform.supported
                    ? "border-2 border-primary/20 shadow-lg"
                    : "border-dashed"
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-16 h-16 flex items-center justify-center ${
                        platform.supported
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {platform.icon}
                    </div>
                    {platform.supported && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <Check className="h-3 w-3 mr-1" />
                        Available
                      </Badge>
                    )}
                    {platform.comingSoon && (
                      <Badge
                        variant="secondary"
                        className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl pt-4">
                    {platform.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {platform.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Version:</span>
                    <span className="font-medium">{platform.version}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Size:</span>
                    <span className="font-medium">{platform.fileSize}</span>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Features:</p>
                    <ul className="space-y-1">
                      {platform.features.map((feature, index) => (
                        <li
                          key={index}
                          className="text-sm text-muted-foreground flex items-center gap-2"
                        >
                          <Check className="h-3 w-3 text-primary shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2">
                    {platform.supported ? (
                      <Button
                        className="w-full"
                        onClick={() => {
                          // In production, this would trigger the actual download
                          window.location.href = platform.downloadUrl;
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download for {platform.name}
                      </Button>
                    ) : (
                      <Button className="w-full" variant="outline" disabled>
                        <Clock className="h-4 w-4 mr-2" />
                        Coming Soon
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Enhanced Features Showcase */}
          <EnhancedFeaturesShowcase />

          {/* Information Section */}
          <div className="space-y-6">
            <Card className="rounded-2xl border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                      System Requirements
                    </h3>
                    <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <p>
                        <strong>Windows:</strong> Windows 10/11 (64-bit), 4GB
                        RAM minimum, 200MB free disk space
                      </p>
                      <p>
                        <strong>Android:</strong> Android 8.0+, 2GB RAM minimum,
                        100MB free storage
                      </p>
                      <p>
                        <strong>macOS:</strong> macOS 11 (Big Sur) or
                        later, Apple Silicon or Intel processor
                      </p>
                      <p>
                        <strong>iOS:</strong> iOS 14.0 or later,
                        compatible with iPhone, iPad, and iPod touch
                      </p>
                      <p>
                        <strong>Linux (Soon):</strong> Ubuntu 20.04+, Fedora
                        35+, or equivalent distributions
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Why Download the App?</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-foreground">
                          Faster Performance:
                        </strong>{" "}
                        Native apps run significantly faster than web browsers
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-foreground">
                          Offline Access:
                        </strong>{" "}
                        View schedules and data even without internet connection
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-foreground">
                          System Integration:
                        </strong>{" "}
                        Native notifications and better file handling
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-foreground">
                          Auto Updates:
                        </strong>{" "}
                        Automatically stay up to date with the latest features
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Having trouble downloading or installing? We&apos;re here to
                    help!
                  </p>
                  <div className="space-y-2">
                    <Link href="/docs/installation">
                      <Button variant="outline" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Installation Guide
                      </Button>
                    </Link>
                    <Link href="/">
                      <Button variant="outline" className="w-full">
                        <Monitor className="h-4 w-4 mr-2" />
                        Use Web Version
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center text-sm text-muted-foreground pt-8">
            <p>
              All downloads are digitally signed and verified for your security.
            </p>
            <p className="mt-2">
              Prefer the web version?{" "}
              <Link href="/" className="text-primary hover:underline">
                Continue in browser
              </Link>
            </p>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
