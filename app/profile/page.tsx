"use client";

import { useSession } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
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
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  address: string | null;
  profileImage: string | null;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await fetch("/api/user/profile");
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      return response.json();
    },
    enabled: !!session,
  });

  if (sessionPending || isLoading) {
    return (
      <DashboardLayout
        title="Profile"
        description="View your account information"
        showBackButton={true}
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
        showBackButton={true}
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
      showBackButton={true}
      icon={User}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-3 sm:space-y-0">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
              <AvatarImage src={profile.profileImage || undefined} />
              <AvatarFallback className="text-lg sm:text-xl">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <CardTitle className="text-xl sm:text-2xl">{profile.name}</CardTitle>
              <CardDescription className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                <Badge variant={getRoleBadgeVariant(profile.role)}>
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
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
        </CardHeader>
        <CardContent className="space-y-6">
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
