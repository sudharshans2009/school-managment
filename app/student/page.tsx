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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Calendar,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  School,
  BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import {
  getStudentProfile,
  getStudentHomework,
  getStudentTimetable,
  getClassroomMessages,
  getClassroomTeachers,
  sendMessage,
  type StudentProfile,
  type StudentHomework,
  type StudentTimetableEntry,
  type ClassroomMessage,
  type ClassroomTeacher,
} from "@/actions/student";

export default function StudentPage() {
  const { session, isPending } = useRoleRedirect(["student"]);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [messageForm, setMessageForm] = useState({
    receiverId: "",
    subject: "",
    message: "",
    messageType: "general" as "absence" | "query" | "request" | "general",
  });

  // Fetch student profile
  const { data: studentProfile } = useQuery<StudentProfile>({
    queryKey: ["student-profile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) throw new Error("No user ID");
      const profile = await getStudentProfile(session.user.id);
      if (!profile) throw new Error("Student profile not found");
      return profile;
    },
    enabled: !!session?.user?.id,
  });

  // Fetch homework for student's classroom
  const { data: homework } = useQuery<StudentHomework[]>({
    queryKey: ["homework", studentProfile?.classroomId, session?.user?.id],
    queryFn: async () => {
      if (!studentProfile?.classroomId || !session?.user?.id) return [];
      return await getStudentHomework(studentProfile.classroomId, session.user.id);
    },
    enabled: !!studentProfile?.classroomId && !!session?.user?.id,
  });

  // Fetch timetable
  const { data: timetable } = useQuery<StudentTimetableEntry[]>({
    queryKey: ["timetable", studentProfile?.classroomId],
    queryFn: async () => {
      if (!studentProfile?.classroomId) return [];
      return await getStudentTimetable(studentProfile.classroomId);
    },
    enabled: !!studentProfile?.classroomId,
  });

  // Fetch classroom messages (quotes, announcements)
  const { data: classroomMessages } = useQuery<ClassroomMessage[]>({
    queryKey: ["classroom-messages", studentProfile?.classroomId],
    queryFn: async () => {
      if (!studentProfile?.classroomId) return [];
      return await getClassroomMessages(studentProfile.classroomId);
    },
    enabled: !!studentProfile?.classroomId,
  });

  // Fetch teachers for the student's classroom
  const { data: teachers } = useQuery<ClassroomTeacher[]>({
    queryKey: ["teachers", studentProfile?.classroomId],
    queryFn: async () => {
      if (!studentProfile?.classroomId) return [];
      return await getClassroomTeachers(studentProfile.classroomId);
    },
    enabled: !!studentProfile?.classroomId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: typeof messageForm & { senderId: string }) => {
      const result = await sendMessage(data);
      if (!result.success) {
        throw new Error(result.error || "Failed to send message");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Message sent successfully");
      setMessageForm({
        receiverId: "",
        subject: "",
        message: "",
        messageType: "general",
      });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSendMessage = () => {
    if (
      !messageForm.receiverId ||
      !messageForm.subject ||
      !messageForm.message
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    sendMessageMutation.mutate({
      ...messageForm,
      senderId: session?.user?.id || "",
    });
  };

  const getDayName = (dayNum: number) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[dayNum];
  };

  const getHomeworkStatus = (homework: StudentHomework) => {
    const dueDate = new Date(homework.dueDate);
    const today = new Date();

    if (homework.submission?.status === "submitted" || homework.submission?.status === "graded") {
      return { variant: "default" as const, text: "Submitted" };
    } else if (dueDate < today) {
      return { variant: "destructive" as const, text: "Overdue" };
    } else {
      return { variant: "secondary" as const, text: "Pending" };
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  const todayTimetable =
    timetable?.filter((entry) => entry.dayOfWeek === new Date().getDay()) || [];
  const pendingHomework =
    homework?.filter((hw) => !hw.submission || hw.submission.status === "pending").length || 0;
  const todayQuote = classroomMessages?.find(
    (msg) => msg.messageType === "quote",
  );

  return (
    <DashboardLayout
      title="Student Portal"
      description={`Welcome back, ${session.user?.name}`}
    >
      <div className="space-y-6">
        {/* Student Info Badge */}
        {studentProfile && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <Badge
              variant="outline"
              className="text-sm sm:text-base px-3 sm:px-4 py-2 rounded-xl"
            >
              {studentProfile.classroom.name}
            </Badge>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Pending Homework
                  </p>
                  <p className="text-3xl font-bold mt-2">{pendingHomework}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Today&apos;s Classes
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {todayTimetable.length}
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
                    Roll Number
                  </p>
                  <p className="text-2xl font-bold mt-2">
                    {studentProfile?.rollNumber}
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
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Access your student tools and resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 justify-start hover:border-primary hover:bg-primary/5"
                onClick={() => router.push("/student/grades")}
              >
                <BookOpen className="h-5 w-5 mr-3 text-blue-500" />
                <div className="text-left">
                  <div className="font-semibold">My Grades</div>
                  <div className="text-sm text-muted-foreground">
                    View exam results
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 justify-start hover:border-primary hover:bg-primary/5"
                onClick={() => router.push("/student/analytics")}
              >
                <BarChart3 className="h-5 w-5 mr-3 text-indigo-500" />
                <div className="text-left">
                  <div className="font-semibold">Analytics</div>
                  <div className="text-sm text-muted-foreground">
                    View performance metrics
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 justify-start hover:border-primary hover:bg-primary/5"
                onClick={() => router.push("/student")}
              >
                <School className="h-5 w-5 mr-3 text-purple-500" />
                <div className="text-left">
                  <div className="font-semibold">Dashboard</div>
                  <div className="text-sm text-muted-foreground">
                    Back to main page
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Today's Quote */}
        {todayQuote && (
          <Card className="rounded-2xl shadow-sm bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <School className="h-6 w-6 text-primary mt-1" />
                <div className="flex-1">
                  <p className="text-lg font-medium italic">
                    &quot;{todayQuote.message}&quot;
                  </p>
                  <p className="text-sm mt-2 text-right text-muted-foreground">
                    - {todayQuote.postedByName}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="homework" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 rounded-xl text-xs sm:text-sm">
            <TabsTrigger value="homework" className="rounded-lg">
              Homework
            </TabsTrigger>
            <TabsTrigger value="timetable" className="rounded-lg">
              Timetable
            </TabsTrigger>
            <TabsTrigger value="classroom" className="rounded-lg">
              Classroom
            </TabsTrigger>
            <TabsTrigger value="message" className="rounded-lg">
              Message Teacher
            </TabsTrigger>
          </TabsList>

          {/* Homework Tab */}
          <TabsContent value="homework">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>My Homework</CardTitle>
                <CardDescription>
                  Track and submit your assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {homework?.map((hw) => {
                    const status = getHomeworkStatus(hw);
                    return (
                      <Card
                        key={hw.id}
                        className="rounded-xl shadow-sm hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge
                                  variant={status.variant}
                                  className="rounded-lg"
                                >
                                  {status.text}
                                </Badge>
                                <span className="text-sm font-medium text-muted-foreground">
                                  {hw.subject.name}
                                </span>
                              </div>
                              <h4 className="font-semibold text-lg">
                                {hw.title}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {hw.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="text-muted-foreground">
                                  <Calendar className="h-3 w-3 inline mr-1" />
                                  Assigned:{" "}
                                  {new Date(
                                    hw.assignedDate,
                                  ).toLocaleDateString()}
                                </span>
                                <span className="text-muted-foreground">
                                  <AlertCircle className="h-3 w-3 inline mr-1" />
                                  Due:{" "}
                                  {new Date(hw.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant={
                                hw.submission?.status === "submitted" || hw.submission?.status === "graded"
                                  ? "outline"
                                  : "default"
                              }
                              className="rounded-xl"
                            >
                              {hw.submission?.status === "submitted" || hw.submission?.status === "graded" ? "View" : "Submit"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {(!homework || homework.length === 0) && (
                    <div className="text-center py-12">
                      <CheckCircle2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No homework assigned yet
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timetable Tab */}
          <TabsContent value="timetable">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Weekly Timetable</CardTitle>
                <CardDescription>
                  Your class schedule for the week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[1, 2, 3, 4, 5].map((day) => {
                    const dayEntries =
                      timetable?.filter((entry) => entry.dayOfWeek === day) ||
                      [];
                    if (dayEntries.length === 0) return null;

                    return (
                      <div key={day} className="space-y-2">
                        <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                          {getDayName(day)}
                        </h3>
                        <div className="overflow-x-auto rounded-lg border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs sm:text-sm">
                                  Time
                                </TableHead>
                                <TableHead className="text-xs sm:text-sm">
                                  Subject
                                </TableHead>
                                <TableHead className="text-xs sm:text-sm">
                                  Teacher
                                </TableHead>
                                <TableHead className="text-xs sm:text-sm">
                                  Room
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {dayEntries.map((entry) => (
                                <TableRow key={entry.id}>
                                  <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">
                                    {entry.startTime} - {entry.endTime}
                                  </TableCell>
                                  <TableCell className="text-xs sm:text-sm">
                                    {entry.subject.name}
                                  </TableCell>
                                  <TableCell className="text-xs sm:text-sm">
                                    {entry.teacher.name}
                                  </TableCell>
                                  <TableCell className="text-xs sm:text-sm">
                                    {entry.room || "TBA"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    );
                  })}
                  {(!timetable || timetable.length === 0) && (
                    <div className="text-center py-12">
                      <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Timetable not available yet
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Classroom Tab */}
          <TabsContent value="classroom">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle>Classroom Information</CardTitle>
                  <CardDescription>Your class details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {studentProfile && (
                    <>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Class</span>
                        <span className="font-medium">
                          {studentProfile.classroom.name}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Grade</span>
                        <span className="font-medium">
                          {studentProfile.classroom.grade}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Section</span>
                        <span className="font-medium">
                          {studentProfile.classroom.section}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">
                          Roll Number
                        </span>
                        <span className="font-medium">
                          {studentProfile.rollNumber}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">
                          Admission Number
                        </span>
                        <span className="font-medium">
                          {studentProfile.admissionNumber}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle>Class Announcements</CardTitle>
                  <CardDescription>Messages from your teachers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {classroomMessages
                      ?.filter((msg) => msg.messageType !== "quote")
                      .map((msg) => (
                        <div
                          key={msg.id}
                          className="p-3 bg-secondary rounded-xl"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="rounded-lg">
                              {msg.messageType}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            - {msg.postedByName}
                          </p>
                        </div>
                      ))}
                    {(!classroomMessages ||
                      classroomMessages.filter(
                        (msg) => msg.messageType !== "quote",
                      ).length === 0) && (
                      <p className="text-center py-8 text-muted-foreground">
                        No announcements yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Message Teacher Tab */}
          <TabsContent value="message">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Send Message to Teacher</CardTitle>
                <CardDescription>
                  Contact your teachers for queries, absence notifications, or
                  requests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Teacher</Label>
                  <Select
                    value={messageForm.receiverId}
                    onValueChange={(value) =>
                      setMessageForm((prev) => ({ ...prev, receiverId: value }))
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Choose a teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers?.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Message Type</Label>
                  <Select
                    value={messageForm.messageType}
                    onValueChange={(value) =>
                      setMessageForm((prev) => ({
                        ...prev,
                        messageType: value as typeof messageForm.messageType,
                      }))
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="absence">
                        Absence Notification
                      </SelectItem>
                      <SelectItem value="query">Query</SelectItem>
                      <SelectItem value="request">Request</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Subject</Label>
                  <Input
                    className="rounded-xl"
                    placeholder="Enter message subject"
                    value={messageForm.subject}
                    onChange={(e) =>
                      setMessageForm((prev) => ({
                        ...prev,
                        subject: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label>Message</Label>
                  <Textarea
                    className="rounded-xl"
                    placeholder="Write your message..."
                    value={messageForm.message}
                    onChange={(e) =>
                      setMessageForm((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    rows={6}
                  />
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={sendMessageMutation.isPending}
                  className="rounded-xl"
                >
                  {sendMessageMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
