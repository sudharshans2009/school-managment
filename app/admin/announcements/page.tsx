"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
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
import Link from "next/link";
import { format } from "date-fns";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

interface Classroom {
  id: string;
  name: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  classroomId: string | null;
  classroomName: string | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
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
  const { data: classrooms } = useQuery<Classroom[]>({
    queryKey: ["classrooms"],
    queryFn: async () => {
      const response = await fetch("/api/classrooms");
      if (!response.ok) throw new Error("Failed to fetch classrooms");
      return response.json();
    },
  });

  // Fetch announcements
  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["announcements", filterClassroom],
    queryFn: async () => {
      const params = filterClassroom ? `?classroomId=${filterClassroom}` : "";
      const response = await fetch(`/api/announcements${params}`);
      if (!response.ok) throw new Error("Failed to fetch announcements");
      return response.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      priority: string;
      classroomId: string | null;
    }) => {
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          createdBy: session?.user?.id,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create announcement");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setOpenCreate(false);
      setError("");
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
      const { id, ...body } = data;
      const response = await fetch(`/api/announcements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update announcement");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setEditingAnnouncement(null);
      setError("");
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/announcements/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete announcement");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
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

  const getPriorityBadge = (priority: string) => {
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
        variant={variants[priority] || "secondary"}
        className={colors[priority]}
      >
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  return (
    <DashboardLayout title="Admin Portal" description="Manage Announcements">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="rounded-xl">
                ← Back
              </Button>
            </Link>
            <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold">Announcements</h1>
          </div>
          <Dialog
            open={openCreate || !!editingAnnouncement}
            onOpenChange={(open) => {
              setOpenCreate(open);
              if (!open) setEditingAnnouncement(null);
              setError("");
            }}
          >
            <DialogTrigger asChild>
              <Button className="rounded-xl w-full sm:w-auto">
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
                    className="rounded-xl"
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
                    className="rounded-xl"
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
                      <SelectTrigger id="priority" className="rounded-xl">
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
                      <SelectTrigger id="classroomId" className="rounded-xl">
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
                  <Alert variant="destructive" className="rounded-xl">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
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
                    className="rounded-xl"
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
        </div>

        {/* Filter */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <Label className="text-sm sm:text-base">Filter by Classroom:</Label>
              <Select
                value={filterClassroom || "all"}
                onValueChange={(val) =>
                  setFilterClassroom(val === "all" ? "" : val)
                }
              >
                <SelectTrigger className="w-full sm:w-64 rounded-xl">
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
                  className="rounded-xl w-full sm:w-auto"
                  onClick={() => setFilterClassroom("")}
                >
                  Clear Filter
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

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
                          {format(new Date(announcement.createdAt), "PPp")}
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
