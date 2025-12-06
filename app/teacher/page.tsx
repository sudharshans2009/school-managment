"use client";

import { useRoleRedirect } from "@/hooks/use-role-redirect";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Users,
  Calendar,
  MessageSquare,
  Quote,
  Send,
  Loader2,
  FileText,
  UserCheck,
  ClipboardList,
  AlertCircle,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { TeacherQuickActions } from "@/components/teacher-quick-actions";
import {
  getTeacherAssignments,
  getTeacherMessages,
  getTeacherLeaves,
  getSubstituteAssignments,
  getWorkDoneByTeacher,
  getWorkDoneByClassroom,
  getClassroomMessages,
  createHomework,
  createClassroomMessage,
  createTeacherLeave,
  cancelTeacherLeave,
  createWorkDone,
  markMessageAsRead,
  type TeacherAssignment,
  type Message,
  type TeacherLeave,
  type SubstituteAssignment,
  type WorkDone,
  type ClassroomMessage,
} from "@/actions/teacher";

export default function TeacherPage() {
  const { session, isPending } = useRoleRedirect(["teacher"]);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [homeworkForm, setHomeworkForm] = useState({
    classroomId: "",
    subjectId: "",
    title: "",
    description: "",
    dueDate: "",
  });

  const [quoteForm, setQuoteForm] = useState({
    classroomId: "",
    content: "",
    messageType: "quote",
  });

  const [leaveForm, setLeaveForm] = useState<{
    leaveType: "casual" | "sick" | "earned" | "duty" | "emergency";
    startDate: string;
    endDate: string;
    reason: string;
  }>({
    leaveType: "casual",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [workDoneForm, setWorkDoneForm] = useState({
    classroomId: "",
    subjectId: "",
    date: new Date().toISOString().split("T")[0],
    periodNumber: 1,
    topicsCovered: "",
    homeworkAssigned: "",
    remarks: "",
  });

  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showWorkDoneDialog, setShowWorkDoneDialog] = useState(false);
  const [messageFilters, setMessageFilters] = useState<{
    status: "sent" | "read" | "all";
    messageType: "absence" | "query" | "request" | "general" | "all";
  }>({
    status: "all",
    messageType: "all",
  });

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/signin");
    }
  }, [session, isPending, router]);

  // Fetch teacher's assignments
  const { data: assignments } = useQuery<TeacherAssignment[]>({
    queryKey: ["teacher-assignments", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      return await getTeacherAssignments(session.user.id);
    },
    enabled: !!session?.user?.id,
  });

  // Calculate primary classes (class teacher assignments)
  const primaryClasses = assignments?.filter((a) => a.isPrimary) || [];

  // Fetch messages
  const { data: messages } = useQuery<Message[]>({
    queryKey: ["messages", session?.user?.id, messageFilters],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      return await getTeacherMessages(session.user.id, messageFilters);
    },
    enabled: !!session?.user?.id,
  });

  // Fetch teacher leaves
  const { data: leaves } = useQuery<TeacherLeave[]>({
    queryKey: ["teacher-leaves", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      return await getTeacherLeaves(session.user.id);
    },
    enabled: !!session?.user?.id,
  });

  // Fetch substitute assignments
  const { data: substituteAssignments } = useQuery<SubstituteAssignment[]>({
    queryKey: ["substitute-assignments", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      return await getSubstituteAssignments(session.user.id);
    },
    enabled: !!session?.user?.id,
  });

  // Fetch work done records - teacher's own records
  const { data: workDoneRecords } = useQuery<WorkDone[]>({
    queryKey: ["work-done", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      return await getWorkDoneByTeacher(session.user.id);
    },
    enabled: !!session?.user?.id,
  });

  // Fetch work done records for primary classes (class teacher view)
  const { data: classWorkDoneRecords } = useQuery<WorkDone[]>({
    queryKey: ["class-work-done", primaryClasses.map((c) => c.classroomId)],
    queryFn: async () => {
      // Fetch work done for all primary classes
      const promises = primaryClasses.map(async (assignment) => {
        return await getWorkDoneByClassroom(assignment.classroomId);
      });
      const results = await Promise.all(promises);
      return results.flat();
    },
    enabled: primaryClasses.length > 0,
  });

  // Fetch classroom messages (quotes) for primary classes
  const { data: classroomMessages } = useQuery<ClassroomMessage[]>({
    queryKey: ["classroom-messages", primaryClasses.map((c) => c.classroomId)],
    queryFn: async () => {
      if (primaryClasses.length === 0) return [];
      // Fetch messages for all primary classes
      const promises = primaryClasses.map(async (assignment) => {
        return await getClassroomMessages(assignment.classroomId);
      });
      const results = await Promise.all(promises);
      return results.flat();
    },
    enabled: primaryClasses.length > 0,
  });

  // Create homework mutation
  const homeworkMutation = useMutation({
    mutationFn: async (data: typeof homeworkForm & { teacherId: string }) => {
      const result = await createHomework(data);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success("Homework assigned successfully");
      setHomeworkForm({
        classroomId: "",
        subjectId: "",
        title: "",
        description: "",
        dueDate: "",
      });
      queryClient.invalidateQueries({ queryKey: ["homework"] });
    },
    onError: () => {
      toast.error("Failed to assign homework");
    },
  });

  // Create classroom message mutation
  const quoteMutation = useMutation({
    mutationFn: async (data: typeof quoteForm & { teacherId: string }) => {
      const result = await createClassroomMessage(data);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success("Message posted successfully");
      setQuoteForm({
        classroomId: "",
        content: "",
        messageType: "quote",
      });
      queryClient.invalidateQueries({ queryKey: ["classroom-messages"] });
    },
    onError: () => {
      toast.error("Failed to post message");
    },
  });

  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const result = await markMessageAsRead(messageId);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  // Create leave request mutation
  const leaveMutation = useMutation({
    mutationFn: async (data: typeof leaveForm & { teacherId: string }) => {
      const result = await createTeacherLeave(data);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success("Leave request submitted successfully");
      setLeaveForm({
        leaveType: "casual",
        startDate: "",
        endDate: "",
        reason: "",
      });
      setShowLeaveDialog(false);
      queryClient.invalidateQueries({ queryKey: ["teacher-leaves"] });
    },
    onError: () => {
      toast.error("Failed to submit leave request");
    },
  });

  // Create work done record mutation
  const workDoneMutation = useMutation({
    mutationFn: async (data: typeof workDoneForm & { teacherId: string }) => {
      const result = await createWorkDone(data);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success("Work done recorded successfully");
      setWorkDoneForm({
        classroomId: "",
        subjectId: "",
        date: new Date().toISOString().split("T")[0],
        periodNumber: 1,
        topicsCovered: "",
        homeworkAssigned: "",
        remarks: "",
      });
      setShowWorkDoneDialog(false);
      queryClient.invalidateQueries({ queryKey: ["work-done"] });
    },
    onError: () => {
      toast.error("Failed to record work done");
    },
  });

  // Cancel leave request mutation
  const cancelLeaveMutation = useMutation({
    mutationFn: async (leaveId: string) => {
      const result = await cancelTeacherLeave(leaveId);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success("Leave request cancelled");
      queryClient.invalidateQueries({ queryKey: ["teacher-leaves"] });
    },
    onError: () => {
      toast.error("Failed to cancel leave request");
    },
  });

  const handleCreateHomework = () => {
    if (
      !homeworkForm.classroomId ||
      !homeworkForm.subjectId ||
      !homeworkForm.title ||
      !homeworkForm.dueDate
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    homeworkMutation.mutate({
      ...homeworkForm,
      teacherId: session?.user?.id || "",
    });
  };

  const handlePostQuote = () => {
    if (!quoteForm.classroomId || !quoteForm.content) {
      toast.error("Please fill in all fields");
      return;
    }

    quoteMutation.mutate({
      ...quoteForm,
      teacherId: session?.user?.id || "",
    });
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  const unreadMessages =
    messages?.filter((m) => m.status === "sent").length || 0;

  return (
    <DashboardLayout
      title="Teacher Portal"
      description={`Welcome back, ${session.user?.name}`}
    >
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    My Classes
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {assignments?.length || 0}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Class Teacher
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {primaryClasses.length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Messages
                  </p>
                  <p className="text-3xl font-bold mt-2">{unreadMessages}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Today
                  </p>
                  <p className="text-sm font-bold mt-2">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <TeacherQuickActions
          unreadMessages={unreadMessages}
          isPrimaryTeacher={primaryClasses.length > 0}
          currentPage="work-done"
        />

        {/* Unread messages badge */}
        {unreadMessages > 0 && (
          <Badge variant="destructive" className="h-8 px-3">
            {unreadMessages} New Messages
          </Badge>
        )}

        <Tabs defaultValue="homework" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 text-xs sm:text-sm">
            <TabsTrigger value="homework" className="rounded-lg">
              Homework
            </TabsTrigger>
            <TabsTrigger value="messages" className="rounded-lg">
              Messages
            </TabsTrigger>
            <TabsTrigger value="classroom-msg" className="rounded-lg">
              Class Message
            </TabsTrigger>
            <TabsTrigger value="leaves" className="rounded-lg">
              My Leaves
            </TabsTrigger>
            <TabsTrigger value="substitutes" className="rounded-lg">
              Substitute Duties
            </TabsTrigger>
            <TabsTrigger value="work-done" className="rounded-lg">
              Work Done
            </TabsTrigger>
          </TabsList>

          {/* Homework Tab */}
          <TabsContent value="homework">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Assign Homework</CardTitle>
                <CardDescription>
                  Create and assign homework for your classes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Class</Label>
                    <Select
                      value={homeworkForm.classroomId}
                      onValueChange={(value) =>
                        setHomeworkForm((prev) => ({
                          ...prev,
                          classroomId: value,
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignments?.map((assignment) => (
                          <SelectItem
                            key={assignment.classroomId}
                            value={assignment.classroomId}
                          >
                            {assignment.classroom.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Subject</Label>
                    <Select
                      value={homeworkForm.subjectId}
                      onValueChange={(value) =>
                        setHomeworkForm((prev) => ({
                          ...prev,
                          subjectId: value,
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignments
                          ?.filter(
                            (a) => a.classroomId === homeworkForm.classroomId,
                          )
                          .map((assignment) => (
                            <SelectItem
                              key={assignment.subject.id}
                              value={assignment.subject.id}
                            >
                              {assignment.subject.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="Enter homework title"
                    value={homeworkForm.title}
                    onChange={(e) =>
                      setHomeworkForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe the homework assignment"
                    value={homeworkForm.description}
                    onChange={(e) =>
                      setHomeworkForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={4}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={homeworkForm.dueDate}
                    onChange={(e) =>
                      setHomeworkForm((prev) => ({
                        ...prev,
                        dueDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <Button
                  onClick={handleCreateHomework}
                  disabled={homeworkMutation.isPending}
                >
                  {homeworkMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Assign Homework
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Messages from Students</CardTitle>
                <CardDescription>
                  View and respond to student messages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filter Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50">
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-medium">
                      Filter by Status
                    </Label>
                    <Select
                      value={messageFilters.status}
                      onValueChange={(value: "sent" | "read" | "all") =>
                        setMessageFilters((prev) => ({
                          ...prev,
                          status: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Messages</SelectItem>
                        <SelectItem value="sent">Unread Only</SelectItem>
                        <SelectItem value="read">Read Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-medium">
                      Filter by Type
                    </Label>
                    <Select
                      value={messageFilters.messageType}
                      onValueChange={(
                        value:
                          | "absence"
                          | "query"
                          | "request"
                          | "general"
                          | "all",
                      ) =>
                        setMessageFilters((prev) => ({
                          ...prev,
                          messageType: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="absence">Absence</SelectItem>
                        <SelectItem value="query">Query</SelectItem>
                        <SelectItem value="request">Request</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Messages List */}
                <div className="space-y-3">
                  {messages?.map((message) => (
                    <Card
                      key={message.id}
                      className={
                        !message.readAt ? "border-l-4 border-l-primary" : ""
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h4 className="font-semibold">
                                {message.subject}
                              </h4>
                              <Badge
                                variant={
                                  message.messageType === "absence"
                                    ? "destructive"
                                    : message.messageType === "query"
                                      ? "default"
                                      : message.messageType === "request"
                                        ? "secondary"
                                        : "outline"
                                }
                              >
                                {message.messageType}
                              </Badge>
                              {!message.readAt && (
                                <Badge variant="destructive">New</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              From: {message.senderName}
                            </p>
                            <p className="text-sm">{message.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-muted-foreground">
                                {new Date(message.createdAt).toLocaleString()}
                              </p>
                              {message.readAt && (
                                <p className="text-xs text-muted-foreground">
                                  Read:{" "}
                                  {new Date(message.readAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                          {!message.readAt && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="ml-2"
                              onClick={() =>
                                markAsReadMutation.mutate(message.id)
                              }
                              disabled={markAsReadMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Mark Read
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(!messages || messages.length === 0) && (
                    <p className="text-center py-8 text-muted-foreground">
                      No messages found
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Classroom Message Tab */}
          <TabsContent value="classroom-msg">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Post Class Message</CardTitle>
                <CardDescription>
                  Share daily quotes and announcements with your class
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {primaryClasses.length > 0 ? (
                  <>
                    {/* Current Quote Display */}
                    {classroomMessages &&
                      classroomMessages.filter(
                        (msg) => msg.messageType === "quote",
                      ).length > 0 && (
                        <div className="mb-6 space-y-3">
                          <Label className="text-base font-semibold">
                            Current Class Quotes
                          </Label>
                          <div className="space-y-2">
                            {classroomMessages
                              .filter((msg) => msg.messageType === "quote")
                              .slice(0, 3)
                              .map((msg) => (
                                <div
                                  key={msg.id}
                                  className="p-4 bg-primary/5 border border-primary/20"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium italic">
                                        &ldquo;{msg.content}&rdquo;
                                      </p>
                                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                        <span>
                                          {msg.classroom?.name || "Class"}
                                        </span>
                                        <span>•</span>
                                        <span>
                                          {new Date(
                                            msg.date,
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                    <Quote className="h-5 w-5 text-primary/40 ml-3" />
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                    <div className="flex flex-col gap-2">
                      <Label>Select Your Class</Label>
                      <Select
                        value={quoteForm.classroomId}
                        onValueChange={(value) =>
                          setQuoteForm((prev) => ({
                            ...prev,
                            classroomId: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose class" />
                        </SelectTrigger>
                        <SelectContent>
                          {primaryClasses.map((assignment) => (
                            <SelectItem
                              key={assignment.classroomId}
                              value={assignment.classroomId}
                            >
                              {assignment.classroom.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label>Message Type</Label>
                      <Select
                        value={quoteForm.messageType}
                        onValueChange={(value) =>
                          setQuoteForm((prev) => ({
                            ...prev,
                            messageType: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quote">Daily Quote</SelectItem>
                          <SelectItem value="announcement">
                            Announcement
                          </SelectItem>
                          <SelectItem value="reminder">Reminder</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label>Message</Label>
                      <Textarea
                        placeholder="Enter your message..."
                        value={quoteForm.content}
                        onChange={(e) =>
                          setQuoteForm((prev) => ({
                            ...prev,
                            content: e.target.value,
                          }))
                        }
                        rows={4}
                      />
                    </div>

                    <Button
                      onClick={handlePostQuote}
                      disabled={quoteMutation.isPending}
                    >
                      {quoteMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      <Send className="h-4 w-4 mr-2" />
                      Post Message
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Quote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      This feature is only available for class teachers.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Leaves Tab */}
          <TabsContent value="leaves">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>My Leave Requests</CardTitle>
                <CardDescription>
                  View and manage your leave requests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog
                  open={showLeaveDialog}
                  onOpenChange={setShowLeaveDialog}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <FileText className="h-4 w-4 mr-2" />
                      Request Leave
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl">
                    <DialogHeader>
                      <DialogTitle>Request Leave</DialogTitle>
                      <DialogDescription>
                        Fill in the leave request form
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Leave Type</Label>
                        <Select
                          value={leaveForm.leaveType}
                          onValueChange={(value) =>
                            setLeaveForm((prev) => ({
                              ...prev,
                              leaveType: value as
                                | "casual"
                                | "sick"
                                | "earned"
                                | "duty"
                                | "emergency",
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sick">Sick Leave</SelectItem>
                            <SelectItem value="casual">Casual Leave</SelectItem>
                            <SelectItem value="earned">Earned Leave</SelectItem>
                            <SelectItem value="duty">Duty</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            value={leaveForm.startDate}
                            onChange={(e) =>
                              setLeaveForm((prev) => ({
                                ...prev,
                                startDate: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            value={leaveForm.endDate}
                            onChange={(e) =>
                              setLeaveForm((prev) => ({
                                ...prev,
                                endDate: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Reason</Label>
                        <Textarea
                          rows={3}
                          value={leaveForm.reason}
                          onChange={(e) =>
                            setLeaveForm((prev) => ({
                              ...prev,
                              reason: e.target.value,
                            }))
                          }
                          placeholder="Enter reason for leave..."
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={() =>
                          leaveMutation.mutate({
                            ...leaveForm,
                            teacherId: session?.user?.id || "",
                          })
                        }
                        disabled={leaveMutation.isPending}
                      >
                        {leaveMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Submit Request
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="space-y-3">
                  {leaves?.map((leave) => (
                    <Card key={leave.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold capitalize">
                                {leave.leaveType} Leave
                              </h4>
                              <Badge
                                variant={
                                  leave.status === "approved"
                                    ? "default"
                                    : leave.status === "rejected"
                                      ? "destructive"
                                      : leave.status === "cancelled"
                                        ? "secondary"
                                        : "outline"
                                }
                              >
                                {leave.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {leave.startDate} to {leave.endDate}
                            </p>
                            <p className="text-sm">{leave.reason}</p>
                            {leave.approvalNotes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                <strong>Admin Notes:</strong>{" "}
                                {leave.approvalNotes}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Requested on:{" "}
                              {new Date(leave.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {leave.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                cancelLeaveMutation.mutate(leave.id)
                              }
                              disabled={cancelLeaveMutation.isPending}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(!leaves || leaves.length === 0) && (
                    <p className="text-center py-8 text-muted-foreground">
                      No leave requests yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Substitute Duties Tab */}
          <TabsContent value="substitutes">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Substitute Duties</CardTitle>
                <CardDescription>
                  Your upcoming substitute assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {substituteAssignments?.map((assignment) => (
                    <Card
                      key={assignment.id}
                      className="border-l-4 border-l-orange-500"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">
                                {assignment.classroomName} -{" "}
                                {assignment.subjectName}
                              </h4>
                              <Badge variant="outline">
                                Period {assignment.periodNumber}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              <strong>Date:</strong> {assignment.date}
                            </p>
                            <p className="text-sm text-muted-foreground mb-1">
                              <strong>Time:</strong> {assignment.startTime} -{" "}
                              {assignment.endTime}
                            </p>
                            <p className="text-sm text-muted-foreground mb-1">
                              <strong>Original Teacher:</strong>{" "}
                              {assignment.originalTeacherName}
                            </p>
                            {assignment.reason && (
                              <p className="text-sm mb-2">
                                <strong>Reason:</strong> {assignment.reason}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(!substituteAssignments ||
                    substituteAssignments.length === 0) && (
                    <div className="text-center py-8">
                      <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No substitute duties assigned
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Work Done Tab */}
          <TabsContent value="work-done">
            <div className="space-y-6">
              {/* Record Work Done */}
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle>Work Done Records</CardTitle>
                  <CardDescription>
                    Record and view what was taught in each period
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Dialog
                    open={showWorkDoneDialog}
                    onOpenChange={setShowWorkDoneDialog}
                  >
                    <DialogTrigger asChild>
                      <Button>
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Record Work Done
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Record Work Done</DialogTitle>
                        <DialogDescription>
                          Document what was covered in the period
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Class</Label>
                            <Select
                              value={workDoneForm.classroomId}
                              onValueChange={(value) =>
                                setWorkDoneForm((prev) => ({
                                  ...prev,
                                  classroomId: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select class" />
                              </SelectTrigger>
                              <SelectContent>
                                {assignments?.map((assignment) => (
                                  <SelectItem
                                    key={assignment.classroomId}
                                    value={assignment.classroomId}
                                  >
                                    {assignment.classroom.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Subject</Label>
                            <Select
                              value={workDoneForm.subjectId}
                              onValueChange={(value) =>
                                setWorkDoneForm((prev) => ({
                                  ...prev,
                                  subjectId: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select subject" />
                              </SelectTrigger>
                              <SelectContent>
                                {assignments?.map((assignment) => (
                                  <SelectItem
                                    key={assignment.id}
                                    value={assignment.subject.id}
                                  >
                                    {assignment.subject.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Date</Label>
                            <Input
                              type="date"
                              value={workDoneForm.date}
                              onChange={(e) =>
                                setWorkDoneForm((prev) => ({
                                  ...prev,
                                  date: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div>
                            <Label>Period Number</Label>
                            <Select
                              value={workDoneForm.periodNumber.toString()}
                              onValueChange={(value) =>
                                setWorkDoneForm((prev) => ({
                                  ...prev,
                                  periodNumber: parseInt(value),
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => (
                                  <SelectItem key={p} value={p.toString()}>
                                    Period {p}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label>Topics Covered *</Label>
                          <Textarea
                            rows={3}
                            value={workDoneForm.topicsCovered}
                            onChange={(e) =>
                              setWorkDoneForm((prev) => ({
                                ...prev,
                                topicsCovered: e.target.value,
                              }))
                            }
                            placeholder="Enter topics covered in this period..."
                          />
                        </div>
                        <div>
                          <Label>Homework Assigned (Optional)</Label>
                          <Textarea
                            rows={2}
                            value={workDoneForm.homeworkAssigned}
                            onChange={(e) =>
                              setWorkDoneForm((prev) => ({
                                ...prev,
                                homeworkAssigned: e.target.value,
                              }))
                            }
                            placeholder="Enter homework assigned..."
                          />
                        </div>
                        <div>
                          <Label>Remarks (Optional)</Label>
                          <Textarea
                            rows={2}
                            value={workDoneForm.remarks}
                            onChange={(e) =>
                              setWorkDoneForm((prev) => ({
                                ...prev,
                                remarks: e.target.value,
                              }))
                            }
                            placeholder="Any additional remarks..."
                          />
                        </div>
                        <Button
                          className="w-full"
                          onClick={() =>
                            workDoneMutation.mutate({
                              ...workDoneForm,
                              teacherId: session?.user?.id || "",
                            })
                          }
                          disabled={
                            workDoneMutation.isPending ||
                            !workDoneForm.topicsCovered
                          }
                        >
                          {workDoneMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Submit
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* My Work Done Records */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">
                      My Work Done Records
                    </h3>
                    <div className="space-y-3">
                      {workDoneRecords?.map((record) => (
                        <Card key={record.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold">
                                  {record.classroomName} - {record.subjectName}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {record.date} | Period {record.periodNumber}
                                  {record.isSubstitute && (
                                    <Badge variant="outline" className="ml-2">
                                      Substitute
                                    </Badge>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm font-medium">
                                  Topics Covered:
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {record.topicsCovered}
                                </p>
                              </div>
                              {record.homeworkAssigned && (
                                <div>
                                  <p className="text-sm font-medium">
                                    Homework:
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {record.homeworkAssigned}
                                  </p>
                                </div>
                              )}
                              {record.remarks && (
                                <div>
                                  <p className="text-sm font-medium">
                                    Remarks:
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {record.remarks}
                                  </p>
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Recorded on:{" "}
                                {new Date(record.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {(!workDoneRecords || workDoneRecords.length === 0) && (
                        <div className="text-center py-8">
                          <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            No work done records yet
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Class Teacher - All Work Done for Primary Classes */}
              {primaryClasses.length > 0 && (
                <Card className="rounded-2xl shadow-sm border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Class Teacher View - All Work Done
                    </CardTitle>
                    <CardDescription>
                      View all work done records for your primary classes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {primaryClasses.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No primary class assignments found.
                      </p>
                    ) : (
                      <Tabs
                        defaultValue={primaryClasses[0]?.classroomId}
                        className="space-y-4"
                      >
                        <TabsList
                          className="grid w-full"
                          style={{
                            gridTemplateColumns: `repeat(${primaryClasses.length}, 1fr)`,
                          }}
                        >
                          {primaryClasses.map((assignment) => (
                            <TabsTrigger
                              key={assignment.classroomId}
                              value={assignment.classroomId}
                              className="rounded-lg"
                            >
                              {assignment.classroom.name}
                            </TabsTrigger>
                          ))}
                        </TabsList>

                        {primaryClasses.map((assignment) => (
                          <TabsContent
                            key={assignment.classroomId}
                            value={assignment.classroomId}
                          >
                          <div className="space-y-3">
                            {classWorkDoneRecords
                              ?.filter(
                                (record) =>
                                  record.classroomId === assignment.classroomId,
                              )
                              .sort(
                                (a, b) =>
                                  new Date(b.date).getTime() -
                                  new Date(a.date).getTime(),
                              )
                              .map((record) => (
                                <Card key={record.id}>
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h4 className="font-semibold">
                                            {record.subjectName}
                                          </h4>
                                          <Badge
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            Period {record.periodNumber}
                                          </Badge>
                                          {record.isSubstitute && (
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              Substitute
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-2">
                                          {new Date(
                                            record.date,
                                          ).toLocaleDateString()}{" "}
                                          • Teacher:{" "}
                                          {record.teacherName || "Unknown"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <div>
                                        <p className="text-sm font-medium text-blue-600">
                                          Topics Covered:
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          {record.topicsCovered}
                                        </p>
                                      </div>
                                      {record.homeworkAssigned && (
                                        <div>
                                          <p className="text-sm font-medium text-green-600">
                                            Homework Assigned:
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            {record.homeworkAssigned}
                                          </p>
                                        </div>
                                      )}
                                      {record.remarks && (
                                        <div>
                                          <p className="text-sm font-medium text-orange-600">
                                            Remarks:
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            {record.remarks}
                                          </p>
                                        </div>
                                      )}
                                      <p className="text-xs text-muted-foreground">
                                        Recorded:{" "}
                                        {new Date(
                                          record.createdAt,
                                        ).toLocaleString()}
                                      </p>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            {!classWorkDoneRecords?.some(
                              (r) => r.classroomId === assignment.classroomId,
                            ) && (
                              <div className="text-center py-8">
                                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">
                                  No work done records for this class yet
                                </p>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
