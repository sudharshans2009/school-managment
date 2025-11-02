"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  BookOpen,
  MessageSquare,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SmartboardNotification {
  announcements: Array<{
    id: string;
    type: "announcement";
    title: string;
    content: string;
    priority: string;
    createdBy: string;
    createdAt: string;
    scope: "class" | "school";
    event: {
      title: string;
      startDate: string;
    } | null;
  }>;
  homework: Array<{
    id: string;
    type: "homework";
    title: string;
    subject: string;
    teacher: string;
    dueDate: string;
    createdAt: string;
  }>;
  messages: Array<{
    id: string;
    type: string;
    content: string;
    teacher: string;
    createdAt: string;
  }>;
  lastUpdated: string;
}

interface SmartboardNotificationsProps {
  classroomId: string;
}

export function SmartboardNotifications({
  classroomId,
}: SmartboardNotificationsProps) {
  const { data, isLoading } = useQuery<SmartboardNotification>({
    queryKey: ["smartboard-notifications", classroomId],
    queryFn: async () => {
      const res = await fetch(
        `/api/smartboard/${classroomId}/notifications`
      );
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Loading Notifications...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "normal":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const hasNotifications =
    data.announcements.length > 0 ||
    data.homework.length > 0 ||
    data.messages.length > 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Updates
          </span>
          <Badge variant="outline" className="text-xs">
            Last updated:{" "}
            {formatDistanceToNow(new Date(data.lastUpdated), {
              addSuffix: true,
            })}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasNotifications ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No recent updates in the last 24 hours
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {/* Announcements */}
              {data.announcements.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <MessageSquare className="h-4 w-4" />
                    Announcements
                  </div>
                  {data.announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="p-3 rounded-lg border bg-card space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm">
                          {announcement.title}
                        </h4>
                        <div className="flex gap-1 shrink-0">
                          <Badge
                            className={`text-xs ${getPriorityColor(announcement.priority)}`}
                          >
                            {announcement.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {announcement.scope === "school"
                              ? "School"
                              : "Class"}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {announcement.content}
                      </p>
                      {announcement.event && (
                        <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                          <Calendar className="h-3 w-3" />
                          {announcement.event.title} -{" "}
                          {new Date(
                            announcement.event.startDate
                          ).toLocaleDateString()}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        By {announcement.createdBy} •{" "}
                        {formatDistanceToNow(
                          new Date(announcement.createdAt),
                          {
                            addSuffix: true,
                          }
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {data.announcements.length > 0 && data.homework.length > 0 && (
                <Separator />
              )}

              {/* Homework */}
              {data.homework.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <BookOpen className="h-4 w-4" />
                    New Homework
                  </div>
                  {data.homework.map((hw) => (
                    <div
                      key={hw.id}
                      className="p-3 rounded-lg border bg-card space-y-1"
                    >
                      <h4 className="font-medium text-sm flex items-start justify-between gap-2">
                        <span>{hw.title}</span>
                        <Badge variant="secondary" className="text-xs">
                          {hw.subject}
                        </Badge>
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Teacher: {hw.teacher}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 text-orange-500" />
                          Due:{" "}
                          {new Date(hw.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(data.announcements.length > 0 || data.homework.length > 0) &&
                data.messages.length > 0 && <Separator />}

              {/* Messages/Quotes */}
              {data.messages.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <MessageSquare className="h-4 w-4" />
                    Class Messages
                  </div>
                  {data.messages.map((message) => (
                    <div
                      key={message.id}
                      className="p-3 rounded-lg border bg-card space-y-1"
                    >
                      <p className="text-sm italic">&ldquo;{message.content}&rdquo;</p>
                      <p className="text-xs text-muted-foreground">
                        - {message.teacher} •{" "}
                        {formatDistanceToNow(new Date(message.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
