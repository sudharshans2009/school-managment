"use client";

import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  BookOpen, Calendar, Send, Clock, CheckCircle2, 
  AlertCircle, Loader2, Users, School 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

interface Student {
  id: string;
  userId: string;
  classroomId: string;
  rollNumber: string;
  admissionNumber: string;
  classroom: {
    id: string;
    name: string;
    grade: string;
    section: string;
  };
}

interface Homework {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  className: string;
  subjectName: string;
  status: string;
  assignedDate: string;
}

interface TimetableEntry {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  subject: {
    name: string;
    code: string;
  };
  teacher: {
    name: string;
  };
}

interface ClassroomMessage {
  id: string;
  content: string;
  messageType: string;
  date: string;
  teacherName: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface WorkDone {
  id: string;
  classroomId: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  date: string;
  periodNumber: number;
  topicsCovered: string;
  homeworkAssigned?: string;
  remarks?: string;
  isSubstitute: boolean;
  createdAt: string;
}

export default function StudentPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [messageForm, setMessageForm] = useState({
    receiverId: "",
    subject: "",
    message: "",
    messageType: "general" as 'absence' | 'query' | 'request' | 'general',
  });

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/signin");
    }
  }, [session, isPending, router]);

  // Fetch student profile
  const { data: studentProfile } = useQuery<Student>({
    queryKey: ["student-profile", session?.user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/students?userId=${session?.user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch student profile");
      const data = await res.json();
      return data[0]; // Assuming single student per user
    },
    enabled: !!session?.user?.id,
  });

  // Fetch homework for student's classroom
  const { data: homework } = useQuery<Homework[]>({
    queryKey: ["homework", studentProfile?.classroomId],
    queryFn: async () => {
      const res = await fetch(`/api/homework?classroomId=${studentProfile?.classroomId}`);
      if (!res.ok) throw new Error("Failed to fetch homework");
      return res.json();
    },
    enabled: !!studentProfile?.classroomId,
  });

  // Fetch timetable
  const { data: timetable } = useQuery<TimetableEntry[]>({
    queryKey: ["timetable", studentProfile?.classroomId],
    queryFn: async () => {
      const res = await fetch(`/api/timetable?classroomId=${studentProfile?.classroomId}`);
      if (!res.ok) throw new Error("Failed to fetch timetable");
      return res.json();
    },
    enabled: !!studentProfile?.classroomId,
  });

  // Fetch classroom messages (quotes, announcements)
  const { data: classroomMessages } = useQuery<ClassroomMessage[]>({
    queryKey: ["classroom-messages", studentProfile?.classroomId],
    queryFn: async () => {
      const res = await fetch(`/api/classroom-messages?classroomId=${studentProfile?.classroomId}`);
      if (!res.ok) throw new Error("Failed to fetch classroom messages");
      return res.json();
    },
    enabled: !!studentProfile?.classroomId,
  });

  // Fetch teachers for the student's classroom
  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ["teachers", studentProfile?.classroomId],
    queryFn: async () => {
      const res = await fetch(`/api/classrooms/${studentProfile?.classroomId}/teachers`);
      if (!res.ok) throw new Error("Failed to fetch teachers");
      return res.json();
    },
    enabled: !!studentProfile?.classroomId,
  });

  // Fetch work done records for classroom
  const { data: workDoneRecords } = useQuery<WorkDone[]>({
    queryKey: ["work-done", studentProfile?.classroomId],
    queryFn: async () => {
      const res = await fetch(`/api/work-done?classroomId=${studentProfile?.classroomId}`);
      if (!res.ok) throw new Error("Failed to fetch work done records");
      return res.json();
    },
    enabled: !!studentProfile?.classroomId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: typeof messageForm & { senderId: string }) => {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
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
    onError: () => {
      toast.error("Failed to send message");
    },
  });

  const handleSendMessage = () => {
    if (!messageForm.receiverId || !messageForm.subject || !messageForm.message) {
      toast.error("Please fill in all fields");
      return;
    }

    sendMessageMutation.mutate({
      ...messageForm,
      senderId: session?.user?.id || "",
    });
  };

  const getDayName = (dayNum: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dayNum];
  };

  const getHomeworkStatus = (homework: Homework) => {
    const dueDate = new Date(homework.dueDate);
    const today = new Date();
    
    if (homework.status === "submitted") {
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

  const todayTimetable = timetable?.filter(entry => entry.dayOfWeek === new Date().getDay()) || [];
  const pendingHomework = homework?.filter(hw => hw.status === "assigned").length || 0;
  const todayQuote = classroomMessages?.find(msg => msg.messageType === "quote");

  return (
    <DashboardLayout title="Student Portal" description={`Welcome back, ${session.user?.name}`}>
      <div className="space-y-6">
        {/* Student Info Badge */}
        {studentProfile && (
          <div className="flex justify-between items-center">
            <Badge variant="outline" className="text-base px-4 py-2 rounded-xl">
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
                  <p className="text-sm font-medium text-muted-foreground">Pending Homework</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Today&apos;s Classes</p>
                  <p className="text-3xl font-bold mt-2">{todayTimetable.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Roll Number</p>
                  <p className="text-2xl font-bold mt-2">{studentProfile?.rollNumber}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today</p>
                  <p className="text-sm font-bold mt-2">{new Date().toLocaleDateString()}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Quote */}
        {todayQuote && (
          <Card className="rounded-2xl shadow-sm bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <School className="h-6 w-6 text-primary mt-1" />
                <div className="flex-1">
                  <p className="text-lg font-medium italic">&quot;{todayQuote.content}&quot;</p>
                  <p className="text-sm text-muted-foreground mt-2">- {todayQuote.teacherName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="homework" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 rounded-xl">
            <TabsTrigger value="homework" className="rounded-lg">Homework</TabsTrigger>
            <TabsTrigger value="timetable" className="rounded-lg">Timetable</TabsTrigger>
            <TabsTrigger value="classroom" className="rounded-lg">Classroom</TabsTrigger>
            <TabsTrigger value="message" className="rounded-lg">Message Teacher</TabsTrigger>
            <TabsTrigger value="work-done" className="rounded-lg">Work Done</TabsTrigger>
          </TabsList>

          {/* Homework Tab */}
          <TabsContent value="homework">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>My Homework</CardTitle>
                <CardDescription>Track and submit your assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {homework?.map((hw) => {
                    const status = getHomeworkStatus(hw);
                    return (
                      <Card key={hw.id} className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={status.variant} className="rounded-lg">{status.text}</Badge>
                                <span className="text-sm font-medium text-muted-foreground">{hw.subjectName}</span>
                              </div>
                              <h4 className="font-semibold text-lg">{hw.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{hw.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="text-muted-foreground">
                                  <Calendar className="h-3 w-3 inline mr-1" />
                                  Assigned: {new Date(hw.assignedDate).toLocaleDateString()}
                                </span>
                                <span className="text-muted-foreground">
                                  <AlertCircle className="h-3 w-3 inline mr-1" />
                                  Due: {new Date(hw.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Button size="sm" variant={hw.status === "submitted" ? "outline" : "default"} className="rounded-xl">
                              {hw.status === "submitted" ? "View" : "Submit"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {(!homework || homework.length === 0) && (
                    <div className="text-center py-12">
                      <CheckCircle2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No homework assigned yet</p>
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
                <CardDescription>Your class schedule for the week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[1, 2, 3, 4, 5].map((day) => {
                    const dayEntries = timetable?.filter(entry => entry.dayOfWeek === day) || [];
                    if (dayEntries.length === 0) return null;
                    
                    return (
                      <div key={day} className="space-y-2">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          {getDayName(day)}
                        </h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Time</TableHead>
                              <TableHead>Subject</TableHead>
                              <TableHead>Teacher</TableHead>
                              <TableHead>Room</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dayEntries.map((entry) => (
                              <TableRow key={entry.id}>
                                <TableCell className="font-medium">
                                  {entry.startTime} - {entry.endTime}
                                </TableCell>
                                <TableCell>{entry.subject.name}</TableCell>
                                <TableCell>{entry.teacher.name}</TableCell>
                                <TableCell>{entry.room || "TBA"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  })}
                  {(!timetable || timetable.length === 0) && (
                    <div className="text-center py-12">
                      <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Timetable not available yet</p>
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
                        <span className="font-medium">{studentProfile.classroom.name}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Grade</span>
                        <span className="font-medium">{studentProfile.classroom.grade}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Section</span>
                        <span className="font-medium">{studentProfile.classroom.section}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Roll Number</span>
                        <span className="font-medium">{studentProfile.rollNumber}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">Admission Number</span>
                        <span className="font-medium">{studentProfile.admissionNumber}</span>
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
                    {classroomMessages?.filter(msg => msg.messageType !== "quote").map((msg) => (
                      <div key={msg.id} className="p-3 bg-secondary rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="rounded-lg">{msg.messageType}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">- {msg.teacherName}</p>
                      </div>
                    ))}
                    {(!classroomMessages || classroomMessages.filter(msg => msg.messageType !== "quote").length === 0) && (
                      <p className="text-center py-8 text-muted-foreground">No announcements yet</p>
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
                <CardDescription>Contact your teachers for queries, absence notifications, or requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Teacher</Label>
                  <Select value={messageForm.receiverId} onValueChange={(value) => setMessageForm(prev => ({ ...prev, receiverId: value }))}>
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
                  <Select value={messageForm.messageType} onValueChange={(value) => setMessageForm(prev => ({ ...prev, messageType: value as typeof messageForm.messageType }))}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="absence">Absence Notification</SelectItem>
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
                    onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Message</Label>
                  <Textarea
                    className="rounded-xl"
                    placeholder="Write your message..."
                    value={messageForm.message}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={6}
                  />
                </div>

                <Button onClick={handleSendMessage} disabled={sendMessageMutation.isPending} className="rounded-xl">
                  {sendMessageMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Work Done Tab */}
          <TabsContent value="work-done">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Work Done</CardTitle>
                <CardDescription>View what was taught in your class</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {workDoneRecords?.map((record) => (
                  <Card key={record.id} className="rounded-xl">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{record.subjectName}</h4>
                            <Badge variant="outline">Period {record.periodNumber}</Badge>
                            {record.isSubstitute && <Badge variant="secondary">Substitute</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            <strong>Teacher:</strong> {record.teacherName} | <strong>Date:</strong> {record.date}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium">Topics Covered:</p>
                          <p className="text-sm text-muted-foreground">{record.topicsCovered}</p>
                        </div>
                        {record.homeworkAssigned && (
                          <div>
                            <p className="text-sm font-medium">Homework Assigned:</p>
                            <p className="text-sm text-muted-foreground">{record.homeworkAssigned}</p>
                          </div>
                        )}
                        {record.remarks && (
                          <div>
                            <p className="text-sm font-medium">Remarks:</p>
                            <p className="text-sm text-muted-foreground">{record.remarks}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!workDoneRecords || workDoneRecords.length === 0) && (
                  <p className="text-center py-8 text-muted-foreground">
                    No work done records available for your class yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
