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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bell,
  AlertCircle,
  Info,
  CheckCircle,
  Calendar,
  User,
} from "lucide-react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useRouter } from "next/navigation";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: "low" | "normal" | "high" | "urgent";
  classroomId: string | null;
  createdBy: string;
  createdAt: string;
  classroomName: string | null;
  createdByName: string;
}

export default function NotificationsPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();

  const {
    data: announcements,
    isLoading,
    error,
  } = useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: async () => {
      const response = await fetch("/api/announcements");
      if (!response.ok) {
        throw new Error("Failed to fetch announcements");
      }
      return response.json();
    },
    enabled: !!session,
  });

  if (sessionPending || isLoading) {
    return (
      <DashboardLayout
        title="Notifications"
        description="View announcements and updates"
      >
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    router.push("/auth/signin");
    return null;
  }

  if (error) {
    return (
      <DashboardLayout
        title="Notifications"
        description="View announcements and updates"
      >
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load notifications. Please try again later.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "high":
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case "normal":
        return <Info className="h-5 w-5 text-blue-600" />;
      case "low":
        return <CheckCircle className="h-5 w-5 text-gray-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityBadgeVariant = (
    priority: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      case "normal":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <DashboardLayout
      title="Notifications"
      description="View announcements and updates"
    >
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6 sm:h-8 sm:w-8" />
              Notifications
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Stay updated with the latest announcements
            </p>
          </div>
          {announcements && announcements.length > 0 && (
            <Badge variant="secondary" className="text-sm">
              {announcements.length} notification
              {announcements.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {announcements && announcements.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                No notifications yet
              </p>
              <p className="text-sm text-muted-foreground">
                You&apos;ll see announcements and updates here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {announcements?.map((announcement) => (
              <Card
                key={announcement.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {getPriorityIcon(announcement.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg sm:text-xl break-words">
                          {announcement.title}
                        </CardTitle>
                        <CardDescription className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {announcement.createdByName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(announcement.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={getPriorityBadgeVariant(announcement.priority)}
                      >
                        {announcement.priority.toUpperCase()}
                      </Badge>
                      {announcement.classroomName && (
                        <Badge variant="outline">
                          {announcement.classroomName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap break-words">
                    {announcement.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
