"use client";

import { useSession } from "@/lib/auth-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Calendar,
  User,
  Check,
  Trash2,
  BookOpen,
  FileText,
  UserCheck,
  MessageSquare,
  CalendarDays,
  AlertTriangle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  recipientId: string;
  senderId: string | null;
  relatedId: string | null;
  relatedType: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  isRead: boolean;
  actionUrl: string | null;
  metadata: string | null;
  createdAt: string;
  readAt: string | null;
  sender: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export default function NotificationsPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");

  const {
    data: notifications,
    isLoading,
    error,
  } = useQuery<Notification[]>({
    queryKey: ["notifications", activeTab],
    queryFn: async () => {
      const unreadOnly = activeTab === "unread";
      const response = await fetch(
        `/api/notifications?unreadOnly=${unreadOnly}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      return response.json();
    },
    enabled: !!session,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      if (!response.ok) throw new Error("Failed to mark as read");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-count"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (!response.ok) throw new Error("Failed to mark all as read");
      return response.json();
    },
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-count"] });
    },
    onError: () => {
      toast.error("Failed to mark all as read");
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(
        `/api/notifications?id=${notificationId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("Failed to delete notification");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Notification deleted");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-count"] });
    },
    onError: () => {
      toast.error("Failed to delete notification");
    },
  });

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsReadMutation.mutateAsync(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  if (sessionPending || isLoading) {
    return (
      <DashboardLayout
        title="Notifications"
        description="View your notifications and updates"
        showBackButton={true}
        icon={Bell}
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
        description="View your notifications and updates"
        showBackButton={true}
        icon={Bell}
      >
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load notifications. Please try again later.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "homework_assigned":
      case "homework_graded":
        return <BookOpen className="h-5 w-5 text-blue-600" />;
      case "exam_scheduled":
      case "exam_graded":
        return <FileText className="h-5 w-5 text-purple-600" />;
      case "leave_requested":
      case "leave_approved":
      case "leave_rejected":
        return <UserCheck className="h-5 w-5 text-orange-600" />;
      case "announcement_posted":
        return <MessageSquare className="h-5 w-5 text-green-600" />;
      case "event_created":
        return <CalendarDays className="h-5 w-5 text-indigo-600" />;
      case "substitute_assigned":
        return <UserCheck className="h-5 w-5 text-yellow-600" />;
      case "system_alert":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityBadgeVariant = (
    priority: string
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

  const unreadCount =
    notifications?.filter((n) => !n.isRead).length || 0;

  const filteredNotifications =
    activeTab === "read"
      ? notifications?.filter((n) => n.isRead)
      : activeTab === "unread"
        ? notifications?.filter((n) => !n.isRead)
        : notifications;

  return (
    <DashboardLayout
      title="Notifications"
      description="View your notifications and updates"
      showBackButton={true}
      icon={Bell}
    >
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6 sm:h-8 sm:w-8" />
              Notifications
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Stay updated with the latest notifications
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <Check className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              All {notifications && `(${notifications.length})`}
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="read">
              Read{" "}
              {notifications &&
                `(${notifications.length - unreadCount})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredNotifications && filteredNotifications.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    No notifications
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === "unread"
                      ? "You're all caught up!"
                      : "You'll see notifications here"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredNotifications?.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`hover:shadow-md transition-all cursor-pointer ${
                      !notification.isRead
                        ? "border-l-4 border-l-primary bg-primary/5"
                        : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg sm:text-xl wrap-break-word flex items-start gap-2">
                              {notification.title}
                              {!notification.isRead && (
                                <Badge
                                  variant="default"
                                  className="text-xs"
                                >
                                  NEW
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                              {notification.sender && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {notification.sender.name}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(
                                  notification.createdAt
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant={getPriorityBadgeVariant(
                              notification.priority
                            )}
                          >
                            {notification.priority.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap wrap-break-word mb-4">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsReadMutation.mutate(notification.id);
                            }}
                            disabled={markAsReadMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Mark as read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotificationMutation.mutate(
                              notification.id
                            );
                          }}
                          disabled={deleteNotificationMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
