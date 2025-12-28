"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { useDiscordRPC } from "@/hooks/use-discord-rpc";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function DiscordRPCSettingsCard() {
  const {
    isConnected,
    isInitializing,
    error,
    init,
    disconnect,
  } = useDiscordRPC({
    autoInit: false,
    autoDisconnectOnUnmount: false,
    enableLogging: true,
  });

  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sync enabled state with actual connection status
  useEffect(() => {
    setEnabled(isConnected);
  }, [isConnected]);

  // Load saved preference from localStorage on mount
  useEffect(() => {
    const savedPreference = localStorage.getItem("discord-rpc-enabled");
    if (savedPreference === "true" && !isConnected && !isInitializing) {
      // Auto-init if previously enabled
      init().catch(err => console.error("Failed to auto-init:", err));
    }
  }, []); // Only run once on mount

  const handleToggle = async (newValue: boolean) => {
    if (isLoading || isInitializing) return; // Prevent multiple simultaneous toggles
    
    setIsLoading(true);
    
    try {
      if (newValue) {
        await init();
        localStorage.setItem("discord-rpc-enabled", "true");
      } else {
        await disconnect();
        localStorage.setItem("discord-rpc-enabled", "false");
      }
    } catch (err) {
      console.error("Failed to toggle Discord RPC:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (isInitializing || isLoading) {
      return (
        <Badge variant="secondary" className="ml-2">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Connecting...
        </Badge>
      );
    }

    if (isConnected) {
      return (
        <Badge variant="default" className="ml-2 bg-green-500">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="ml-2">
        Disconnected
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Discord Rich Presence
              {getStatusBadge()}
            </CardTitle>
            <CardDescription className="mt-2">
              Show what you&apos;re doing in the School Management System on Discord
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="discord-rpc">Enable Discord Rich Presence</Label>
            <p className="text-sm text-muted-foreground">
              Display your current activity in Discord
            </p>
          </div>
          <Switch
            id="discord-rpc"
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={isInitializing || isLoading}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {enabled && isConnected && (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription>
              Discord Rich Presence is active. Your current activity will be displayed on your Discord profile.
            </AlertDescription>
          </Alert>
        )}

        {enabled && !isConnected && !isInitializing && !error && (
          <Alert>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription>
              Make sure Discord is running and try toggling the setting again.
            </AlertDescription>
          </Alert>
        )}

        <div className="pt-2 border-t">
          <h4 className="text-sm font-medium mb-2">How it works:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Your activity will be displayed on your Discord profile</li>
            <li>Shows what section of the app you&apos;re currently using</li>
            <li>Updates automatically as you navigate</li>
            <li>Requires Discord to be running on your computer</li>
          </ul>
        </div>

        <div className="pt-2">
          <p className="text-xs text-muted-foreground">
            Note: You need to have Discord installed and running for this feature to work.
            Privacy: Only your current activity type is shared, no personal data.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
