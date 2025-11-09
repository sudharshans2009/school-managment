"use client";

import { useSession } from "@/lib/auth/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  User2,
  Edit,
  Save,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { PageHeader } from "@/components/layouts/header";
import { ExtendedUser } from "@/types/better-auth";
import {
  getUserProfile,
  updateUserProfile,
} from "@/actions/user";
import { useState } from "react";

export default function ProfilePage() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const getDashboardUrl = () => {
    const userRole = (session?.user as ExtendedUser)?.role;
    if (!userRole) return "/dashboard";
    const role = userRole.toLowerCase();
    if (role === "admin") return "/admin";
    if (role === "teacher") return "/teacher";
    if (role === "student") return "/student";
    return "/dashboard";
  };

  const {
    data: profileResult,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["profile", session?.user?.id],
    queryFn: async () => {
      return await getUserProfile();
    },
    enabled: !!session?.user?.id,
  });

  const profile = profileResult?.success ? profileResult.data : null;

  const updateProfileMutation = useMutation({
    mutationFn: async (data: {
      name?: string;
      phone?: string;
      address?: string;
    }) => {
      return await updateUserProfile(data);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Profile updated successfully");
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        setIsEditing(false);
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (profile) {
      setFormData({
        name: profile.name || "",
        phone: profile.phone || "",
        address: profile.address || "",
      });
    }
  };

  // Initialize form data when profile loads
  if (profile && !isEditing && formData.name === "") {
    setFormData({
      name: profile.name || "",
      phone: profile.phone || "",
      address: profile.address || "",
    });
  }

  if (sessionPending || isLoading) {
    return (
      <DashboardLayout
        title="Profile"
        description="View your account information"
        icon={User}
      >
        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 sm:h-8 w-40 sm:w-48" />
              <Skeleton className="h-4 w-48 sm:w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
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

  if (error || !profile) {
    return (
      <DashboardLayout
        title="Profile"
        description="View your account information"
        icon={User}
      >
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load profile. Please try again later.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "teacher":
        return "secondary";
      case "student":
        return "outline";
      default:
        return "outline";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DashboardLayout
      title="Profile"
      description="View your account information"
      icon={User}
    >
      <PageHeader
        icon={User2}
        title="Profile"
        description="View your account information"
        backHref={getDashboardUrl()}
      />
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-3 sm:space-y-0">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                <AvatarImage src={profile.profileImage || undefined} />
                <AvatarFallback className="text-lg sm:text-xl">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <CardTitle className="text-xl sm:text-2xl">
                  {profile.name}
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                  <Badge variant={getRoleBadgeVariant(profile.role)}>
                    {profile.role.charAt(0).toUpperCase() +
                      profile.role.slice(1)}
                  </Badge>
                  {profile.isActive ? (
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-600"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-red-600 border-red-600"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </CardDescription>
              </div>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  disabled={updateProfileMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </div>
              <p className="text-sm font-medium flex flex-wrap items-center gap-2">
                <span className="break-all">{profile.email}</span>
                {profile.emailVerified ? (
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-600 text-xs"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-orange-600 border-orange-600 text-xs"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Verified
                  </Badge>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="h-4 w-4 mr-2" />
                Phone
              </div>
              <p className="text-sm font-medium">
                {profile.phone || "Not provided"}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Shield className="h-4 w-4 mr-2" />
                User ID
              </div>
              <p className="text-sm font-medium font-mono">{profile.id}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="h-4 w-4 mr-2" />
                Role
              </div>
              <p className="text-sm font-medium">
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2" />
                Address
              </div>
              <p className="text-sm font-medium">
                {profile.address || "Not provided"}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                Member Since
              </div>
              <p className="text-sm font-medium">
                {new Date(profile.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                Last Updated
              </div>
              <p className="text-sm font-medium">
                {new Date(profile.updatedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          )}

          {!profile.emailVerified && (
            <Alert>
              <AlertDescription>
                Your email is not verified. Please check your inbox for a
                verification email.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
