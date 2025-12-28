/**
 * Enhanced Features Showcase Component
 * Displays the new Tauri app features with visual cards
 */

import { 
  Bell, 
  Download, 
  Zap, 
  FolderOpen, 
  Keyboard, 
  Monitor,
  Check 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function EnhancedFeaturesShowcase() {
  const features = [
    {
      icon: <Monitor className="h-6 w-6" />,
      title: "System Tray",
      description: "Run in the background with quick access from your system tray",
      benefits: [
        "Click to show/hide",
        "Context menu actions",
        "Persistent notifications",
        "Never lose your work"
      ],
      badge: "New",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
    },
    {
      icon: <Bell className="h-6 w-6" />,
      title: "Native Notifications",
      description: "System-level alerts for attendance, events, and announcements",
      benefits: [
        "Attendance reminders",
        "Event notifications",
        "Announcement alerts",
        "Custom sounds"
      ],
      badge: "New",
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400"
    },
    {
      icon: <Download className="h-6 w-6" />,
      title: "Auto-Updater",
      description: "Stay current with automatic updates and security patches",
      benefits: [
        "Automatic checking",
        "One-click install",
        "Background downloads",
        "Always secure"
      ],
      badge: "New",
      color: "bg-green-500/10 text-green-600 dark:text-green-400"
    },
    {
      icon: <FolderOpen className="h-6 w-6" />,
      title: "File System Integration",
      description: "Powerful file operations with native dialogs and exports",
      benefits: [
        "Save/Open dialogs",
        "Drag & drop",
        "CSV exports",
        "Custom directories"
      ],
      badge: "New",
      color: "bg-orange-500/10 text-orange-600 dark:text-orange-400"
    },
    {
      icon: <Keyboard className="h-6 w-6" />,
      title: "Global Shortcuts",
      description: "Quick access with system-wide keyboard shortcuts",
      benefits: [
        "Cmd/Ctrl+Shift+S: Search",
        "Cmd/Ctrl+Shift+A: Attendance",
        "Cmd/Ctrl+Shift+T: Toggle",
        "Customizable"
      ],
      badge: "New",
      color: "bg-pink-500/10 text-pink-600 dark:text-pink-400"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Performance",
      description: "Native speed and efficiency on all platforms",
      benefits: [
        "Faster than web",
        "Offline capable",
        "Battery friendly",
        "Instant startup"
      ],
      badge: "Enhanced",
      color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge className="mb-2 bg-linear-to-r from-primary to-primary/70">
          December 2025 Update
        </Badge>
        <h2 className="text-3xl font-bold">Enhanced Native Features</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Experience powerful new capabilities designed specifically for native apps
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card 
            key={index}
            className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-primary/5 to-transparent rounded-bl-full" />
            
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <div className={`p-3 rounded-lg ${feature.color}`}>
                  {feature.icon}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {feature.badge}
                </Badge>
              </div>
              <CardTitle className="text-xl">{feature.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </CardHeader>

            <CardContent>
              <ul className="space-y-2">
                {feature.benefits.map((benefit, idx) => (
                  <li 
                    key={idx}
                    className="flex items-start gap-2 text-sm"
                  >
                    <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Platform Availability */}
      <Card className="bg-linear-to-r from-primary/5 via-background to-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">Available on All Platforms</h3>
              <p className="text-sm text-muted-foreground">
                Windows, macOS, iOS, and Android - with more coming soon
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <Check className="h-3 w-3 mr-1" />
                Windows
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <Check className="h-3 w-3 mr-1" />
                macOS
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <Check className="h-3 w-3 mr-1" />
                iOS
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <Check className="h-3 w-3 mr-1" />
                Android
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
