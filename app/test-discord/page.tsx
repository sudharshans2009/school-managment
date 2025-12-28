"use client";

import { useEffect } from "react";
import { useDiscordRPC } from "@/hooks/use-discord-rpc";
import { SchoolActivity } from "@/types/discord-rpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Discord RPC Test Page
 * Use this page to test Discord Rich Presence functionality
 */
export default function DiscordRPCTestPage() {
  const {
    isConnected,
    isInitializing,
    error,
    init,
    disconnect,
    updateActivityPreset,
    clearPresence,
    checkConnection,
  } = useDiscordRPC({
    autoInit: false,
    enableLogging: true,
  });

  useEffect(() => {
    console.log("Discord RPC Status:", {
      isConnected,
      isInitializing,
      error,
    });
  }, [isConnected, isInitializing, error]);

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Discord RPC Test Page</h1>

      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Connected:</strong> {isConnected ? "✅ Yes" : "❌ No"}
            </div>
            <div>
              <strong>Initializing:</strong> {isInitializing ? "⏳ Yes" : "No"}
            </div>
          </div>
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={init} disabled={isConnected || isInitializing}>
              Initialize Discord RPC
            </Button>
            <Button
              onClick={disconnect}
              disabled={!isConnected}
              variant="destructive"
            >
              Disconnect
            </Button>
            <Button onClick={checkConnection} variant="outline">
              Check Connection
            </Button>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Test Activity Updates</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => updateActivityPreset(SchoolActivity.VIEWING_DASHBOARD)}
                disabled={!isConnected}
                variant="secondary"
              >
                Dashboard
              </Button>
              <Button
                onClick={() => updateActivityPreset(SchoolActivity.VIEWING_ATTENDANCE)}
                disabled={!isConnected}
                variant="secondary"
              >
                Attendance
              </Button>
              <Button
                onClick={() => updateActivityPreset(SchoolActivity.VIEWING_TIMETABLE)}
                disabled={!isConnected}
                variant="secondary"
              >
                Timetable
              </Button>
              <Button
                onClick={() => updateActivityPreset(SchoolActivity.VIEWING_GRADES)}
                disabled={!isConnected}
                variant="secondary"
              >
                Grades
              </Button>
              <Button
                onClick={clearPresence}
                disabled={!isConnected}
                variant="outline"
              >
                Clear Presence
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 list-disc list-inside">
            <li>✅ Discord desktop app is running</li>
            <li>✅ Discord Application ID is set in src-tauri/src/discord_rpc.rs</li>
            <li>✅ Application is built and running in Tauri</li>
            <li>✅ Check browser console for errors (F12)</li>
            <li>✅ Verify you're logged into Discord</li>
            <li>✅ Check if Activity Status is enabled in Discord Settings</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. Make sure Discord is running on your computer</p>
          <p>2. Click "Initialize Discord RPC" button</p>
          <p>3. If connected, try clicking any activity button</p>
          <p>4. Check your Discord profile - you should see the activity</p>
          <p>5. Check the browser console (F12) for detailed logs</p>
        </CardContent>
      </Card>
    </div>
  );
}
