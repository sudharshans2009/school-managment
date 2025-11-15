"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, Plus, Edit2, Trash2, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { AdminHeader } from "@/components/admin/admin-header";

interface Announcement {
  id: string;
  title: string;
  content: string;
  // priority may be null from the server, normalize in UI where needed
  priority: string | null;
  classroomId: string | null;
  classroomName: string | null;
  createdBy: string;
  // creator name may be null for system announcements
  createdByName: string | null;
  // createdAt can be a string or Date (or null) depending on source
  createdAt: string | Date | null;
}

export default function AdminAnnouncementsPage() {
  const { data: session } = useSession();
  const [openCreate, setOpenCreate] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);
  const [error, setError] = useState("");
  const [filterClassroom, setFilterClassroom] = useState<string>("");
  const queryClient = useQueryClient();

  // Fetch classrooms
  const { data: classroomsResult } = useQuery({
    queryKey: ["classrooms"],
    queryFn: async () => {
      const { getClassrooms } = await import("@/actions/announcements");
      return await getClassrooms();
    },
  });

  const classrooms = classroomsResult?.success ? classroomsResult.data : [];

  // Fetch announcements
  const { data: announcementsResult, isLoading } = useQuery({
    queryKey: ["announcements", filterClassroom],
    queryFn: async () => {
      const { getAnnouncements } = await import("@/actions/announcements");
      return await getAnnouncements(filterClassroom || undefined);
    },
  });

  const announcements = announcementsResult?.success
    ? announcementsResult.data
    : [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      priority: string;
      classroomId: string | null;
    }) => {
      const { createAnnouncement } = await import("@/actions/announcements");
      return await createAnnouncement({
        ...data,
        createdBy: session?.user?.id || "",
      });
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["announcements"] });
        setOpenCreate(false);
        setError("");
      } else {
        setError(result.error || "Failed to create announcement");
      }
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      title: string;
      content: string;
      priority: string;
      classroomId: string | null;
    }) => {
      const { updateAnnouncement } = await import("@/actions/announcements");
      const { id, ...updateData } = data;
      return await updateAnnouncement(id, updateData);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["announcements"] });
        setEditingAnnouncement(null);
        setError("");
      } else {
        setError(result.error || "Failed to update announcement");
      }
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { deleteAnnouncement } = await import("@/actions/announcements");
      return await deleteAnnouncement(id);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["announcements"] });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const classroomIdValue = formData.get("classroomId") as string;
    const data = {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      priority: formData.get("priority") as string,
      classroomId: classroomIdValue === "all" ? null : classroomIdValue,
    };

    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    const actualPriority = priority || "normal";
    const variants: Record<
      string,
      "default" | "destructive" | "secondary" | "outline"
    > = {
      low: "outline",
      normal: "secondary",
      high: "default",
      urgent: "destructive",
    };

    const colors: Record<string, string> = {
      low: "text-gray-600",
      normal: "text-blue-600",
      high: "text-orange-600",
      urgent: "text-red-600",
    };

    return (
      <Badge
        variant={variants[actualPriority] || "secondary"}
        className={colors[actualPriority]}
      >
        {actualPriority.charAt(0).toUpperCase() + actualPriority.slice(1)}
      </Badge>
    );
  };

  return (
    <DashboardLayout title="Admin Portal" description="Manage Announcements">
      <div className="space-y-4 sm:space-y-6">
        <AdminHeader
          icon={Bell}
          title="Announcements"
          description="Create and manage announcements"
        >
          <Dialog
            open={openCreate || !!editingAnnouncement}
            onOpenChange={(open) => {
              setOpenCreate(open);
              if (!open) setEditingAnnouncement(null);
              setError("");
            }}
          >
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  {editingAnnouncement
                    ? "Edit Announcement"
                    : "Create New Announcement"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Mid-term Examination Schedule"
                    required
                    defaultValue={editingAnnouncement?.title}
                  />
                </div>
                <div>
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    name="content"
                    placeholder="Enter announcement details..."
                    rows={6}
                    required
                    defaultValue={editingAnnouncement?.content}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority *</Label>
                    <Select
                      name="priority"
                      defaultValue={editingAnnouncement?.priority || "normal"}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="classroomId">Target Classroom</Label>
                    <Select
                      name="classroomId"
                      defaultValue={editingAnnouncement?.classroomId || "all"}
                    >
                      <SelectTrigger id="classroomId">
                        <SelectValue placeholder="All Classrooms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classrooms</SelectItem>
                        {classrooms?.map((classroom) => (
                          <SelectItem key={classroom.id} value={classroom.id}>
                            {classroom.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpenCreate(false);
                      setEditingAnnouncement(null);
                      setError("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : editingAnnouncement ? (
                      "Update"
                    ) : (
                      "Create"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </AdminHeader>

        {/* Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <Select
            value={filterClassroom || "all"}
            onValueChange={(val) =>
              setFilterClassroom(val === "all" ? "" : val)
            }
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="All Classrooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classrooms</SelectItem>
              {classrooms?.map((classroom) => (
                <SelectItem key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filterClassroom && (
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setFilterClassroom("")}
            >
              Clear Filter
            </Button>
          )}
        </div>

        {/* Announcements List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : announcements && announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Card
                key={announcement.id}
                className="rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <CardTitle className="text-lg sm:text-xl wrap-break-word">
                          {announcement.title}
                        </CardTitle>
                        {getPriorityBadge(announcement.priority)}
                        {announcement.priority === "urgent" && (
                          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 animate-pulse" />
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span>
                          <strong>Target:</strong>{" "}
                          {announcement.classroomName || "All Classrooms"}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>
                          <strong>Posted by:</strong>{" "}
                          {announcement.createdByName}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>
                          {announcement.createdAt
                            ? format(new Date(announcement.createdAt), "PPp")
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl"
                        onClick={() => setEditingAnnouncement(announcement)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl"
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to delete this announcement?",
                            )
                          ) {
                            deleteMutation.mutate(announcement.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap wrap-break-word">
                    {announcement.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-8 text-center text-muted-foreground">
              No announcements found. Click &quot;New Announcement&quot; to
              create one.
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
