/**
 * Example: Enhanced Features Integration
 * 
 * This component demonstrates how to use the new Tauri features
 * in your React components.
 */

"use client";

import { useEffect, useState } from "react";
import { useTauriFeatures } from "@/hooks/use-tauri-features";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Save, Keyboard, CheckCircle2 } from "lucide-react";

export function EnhancedFeaturesExample() {
  const {
    isTauri,
    appVersion,
    sendNotification,
    checkForUpdates,
    saveFile,
    quickSearch,
    quickAttendance,
  } = useTauriFeatures();

  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  // Check for updates on mount
  useEffect(() => {
    if (isTauri) {
      checkForUpdates().then((update) => {
        if (update?.available) {
          setUpdateStatus(`Update available: ${update.version}`);
        } else {
          setUpdateStatus("Up to date");
        }
      });
    }
  }, [isTauri, checkForUpdates]);

  // Example: Send a notification
  const handleTestNotification = async () => {
    await sendNotification(
      "Test Notification",
      "This is a test notification from the School Management System!"
    );
  };

  // Example: Export data to CSV
  const handleExportData = async () => {
    const sampleData = `Name,Grade,Attendance
John Doe,A,95%
Jane Smith,B+,88%
Bob Johnson,A-,92%`;

    const path = await saveFile("sample-report.csv", sampleData);
    if (path) {
      await sendNotification("Export Successful", `Saved to: ${path}`);
    }
  };

  // Example: Trigger quick search
  const handleQuickSearch = async () => {
    await quickSearch();
  };

  // Example: Trigger quick attendance
  const handleQuickAttendance = async () => {
    await quickAttendance();
  };

  if (!isTauri) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Features</CardTitle>
          <CardDescription>
            These features are only available in the native app.
            <Button className="ml-2" size="sm" asChild>
              <a href="/downloads">Download App</a>
            </Button>
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* App Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Native App Features
            <Badge variant="secondary">v{appVersion}</Badge>
          </CardTitle>
          <CardDescription>
            Running in Tauri - All enhanced features are available
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Update Status */}
      {updateStatus && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm">{updateStatus}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Send system notifications for important events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleTestNotification} className="w-full">
              Test Notification
            </Button>
          </CardContent>
        </Card>

        {/* File Export */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Save className="h-5 w-5" />
              File Export
            </CardTitle>
            <CardDescription>
              Export data to CSV files with native dialogs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExportData} className="w-full">
              Export Sample Data
            </Button>
          </CardContent>
        </Card>

        {/* Quick Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Quick Search
            </CardTitle>
            <CardDescription>
              Use Cmd/Ctrl + Shift + S or click below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleQuickSearch} variant="outline" className="w-full">
              Trigger Quick Search
            </Button>
          </CardContent>
        </Card>

        {/* Quick Attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Quick Attendance
            </CardTitle>
            <CardDescription>
              Use Cmd/Ctrl + Shift + A or click below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleQuickAttendance} variant="outline" className="w-full">
              Trigger Quick Attendance
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Keyboard Shortcuts Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Keyboard Shortcuts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span>Quick Search</span>
              <Badge variant="outline">Cmd/Ctrl + Shift + S</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Quick Attendance</span>
              <Badge variant="outline">Cmd/Ctrl + Shift + A</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Toggle Window</span>
              <Badge variant="outline">Cmd/Ctrl + Shift + T</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * import { EnhancedFeaturesExample } from "@/components/examples/enhanced-features-example";
 * 
 * export default function MyPage() {
 *   return (
 *     <div className="container mx-auto p-6">
 *       <h1>My Page</h1>
 *       <EnhancedFeaturesExample />
 *     </div>
 *   );
 * }
 */
