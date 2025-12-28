"use client";

import { useSession } from "@/lib/auth/client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Lock, Mail, Loader2, Eye, EyeOff, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { updateUserSettings } from "@/actions/user";
import { DiscordRPCSettingsCard } from "@/components/settings/discord-rpc-settings-card";

export default function SettingsPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: {
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    }) => {
      return await updateUserSettings(data);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Settings updated successfully");

        // Clear password fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        // Invalidate profile query to refetch
        queryClient.invalidateQueries({ queryKey: ["profile"] });

        // If email changed, show verification message
        if (result.emailChanged) {
          toast.info("Please check your new email for a verification link.");
        }
      } else {
        toast.error(result.error || "Failed to update settings");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleUpdateEmail = () => {
    if (!email) {
      toast.error("Please enter a new email address");
      return;
    }

    updateSettingsMutation.mutate({ email });
  };

  const handleUpdatePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    updateSettingsMutation.mutate({ currentPassword, newPassword });
  };

  if (sessionPending) {
    return (
      <DashboardLayout
        title="Settings"
        description="Manage your account settings"
        icon={Settings}
      >
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    router.push("/auth/signin");
    return null;
  }

  return (
    <DashboardLayout
      title="Settings"
      description="Manage your account settings"
      icon={Settings}
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Update Email */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
              Email Address
            </CardTitle>
            <CardDescription className="text-sm">
              Update your email address. You will need to verify the new email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">
                New Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter new email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={updateSettingsMutation.isPending}
              />
            </div>
            <Button
              onClick={handleUpdateEmail}
              disabled={updateSettingsMutation.isPending || !email}
              className="w-full sm:w-auto"
            >
              {updateSettingsMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Email
            </Button>
          </CardContent>
        </Card>

        {/* Update Password */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
              Password
            </CardTitle>
            <CardDescription className="text-sm">
              Change your password. Make sure it&apos;s at least 8 characters
              long.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm">
                Current Password
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={updateSettingsMutation.isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={updateSettingsMutation.isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm">
                Confirm New Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={updateSettingsMutation.isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {newPassword &&
              confirmPassword &&
              newPassword !== confirmPassword && (
                <Alert variant="destructive">
                  <AlertDescription>Passwords do not match</AlertDescription>
                </Alert>
              )}

            <Button
              onClick={handleUpdatePassword}
              disabled={
                updateSettingsMutation.isPending ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword
              }
              className="w-full sm:w-auto"
            >
              {updateSettingsMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Password
            </Button>
          </CardContent>
        </Card>

        <Alert className="rounded-2xl">
          <AlertDescription className="text-sm">
            <strong>Note:</strong> If you change your email, you will need to
            verify it before you can log in again.
          </AlertDescription>
        </Alert>

        {/* Discord Rich Presence Settings */}
        <DiscordRPCSettingsCard />
      </div>
    </DashboardLayout>
  );
}
