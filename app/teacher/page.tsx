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
  GraduationCap, BookOpen, Users, Calendar, MessageSquare, Quote, 
  CheckCircle, XCircle, Send, Loader2 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SharedLayout } from "@/components/shared-layout";

interface TeacherAssignment {
  id: string;
  classroomId: string;
  isPrimary: boolean;
  classroom: {
    id: string;
    name: string;
    grade: string;
    section: string;
    currentStrength: number;
  };
  subject: {
    id: string;
    name: string;
    code: string;
  };
}

interface Student {
  id: string;
  userId: string;
  rollNumber: string;
  admissionNumber: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Message {
  id: string;
  subject: string;
  message: string;
  messageType: string;
  status: string;
  createdAt: string;
  senderName: string;
  senderEmail: string;
}

export default function TeacherPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'present' | 'absent' | 'late' | 'excused'>>({});
  
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

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/signin");
    }
  }, [session, isPending, router]);

  // Fetch teacher's assignments
  const { data: assignments } = useQuery<TeacherAssignment[]>({
    queryKey: ["teacher-assignments", session?.user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/teachers/${session?.user?.id}/assignments`);
      if (!res.ok) throw new Error("Failed to fetch assignments");
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  // Fetch students for selected class
  const { data: students } = useQuery<Student[]>({
    queryKey: ["students", selectedClass],
    queryFn: async () => {
      const res = await fetch(`/api/students?classroomId=${selectedClass}`);
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
    enabled: !!selectedClass,
  });

  // Fetch messages
  const { data: messages } = useQuery<Message[]>({
    queryKey: ["messages", session?.user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/messages?userId=${session?.user?.id}&type=received`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  // Submit attendance mutation
  const attendanceMutation = useMutation({
    mutationFn: async (data: { records: { studentId: string; classroomId: string; status: 'present' | 'absent' | 'late' | 'excused'; date: Date }[]; markedBy: string }) => {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to mark attendance");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Attendance marked successfully");
      setAttendanceRecords({});
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: () => {
      toast.error("Failed to mark attendance");
    },
  });

  // Create homework mutation
  const homeworkMutation = useMutation({
    mutationFn: async (data: typeof homeworkForm & { teacherId: string }) => {
      const res = await fetch("/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create homework");
      return res.json();
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
      const res = await fetch("/api/classroom-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create message");
      return res.json();
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

  const handleMarkAttendance = () => {
    if (!selectedClass || !students) {
      toast.error("Please select a class first");
      return;
    }

    const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
      studentId,
      classroomId: selectedClass,
      status,
      date: new Date(attendanceDate),
    }));

    if (records.length === 0) {
      toast.error("Please mark attendance for at least one student");
      return;
    }

    attendanceMutation.mutate({
      records,
      markedBy: session?.user?.id || "",
    });
  };

  const handleCreateHomework = () => {
    if (!homeworkForm.classroomId || !homeworkForm.subjectId || !homeworkForm.title || !homeworkForm.dueDate) {
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

  const markAllStudents = (status: 'present' | 'absent' | 'late' | 'excused') => {
    if (!students) return;
    const newRecords: Record<string, typeof status> = {};
    students.forEach(student => {
      newRecords[student.id] = status;
    });
    setAttendanceRecords(newRecords);
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  const primaryClasses = assignments?.filter(a => a.isPrimary) || [];
  const unreadMessages = messages?.filter(m => m.status === "sent").length || 0;

  return (
    <SharedLayout title="Teacher Portal" description={`Welcome back, ${session.user?.name}`}>
      <div className="space-y-6">
        {/* Unread messages badge */}
        {unreadMessages > 0 && (
          <Badge variant="destructive" className="h-8 px-3 rounded-xl">
            {unreadMessages} New Messages
          </Badge>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">My Classes</p>
                  <p className="text-3xl font-bold mt-2">{assignments?.length || 0}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Class Teacher</p>
                  <p className="text-3xl font-bold mt-2">{primaryClasses.length}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Messages</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Today</p>
                  <p className="text-sm font-bold mt-2">{new Date().toLocaleDateString()}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="classes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 rounded-xl">
            <TabsTrigger value="classes" className="rounded-lg">My Classes</TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-lg">Attendance</TabsTrigger>
            <TabsTrigger value="homework" className="rounded-lg">Homework</TabsTrigger>
            <TabsTrigger value="messages" className="rounded-lg">Messages</TabsTrigger>
            <TabsTrigger value="classroom-msg" className="rounded-lg">Class Message</TabsTrigger>
          </TabsList>

          {/* My Classes Tab */}
          <TabsContent value="classes">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>My Assigned Classes</CardTitle>
                <CardDescription>Classes and subjects you teach</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignments?.map((assignment) => (
                    <Card key={assignment.id} className="rounded-xl shadow-sm hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-lg">{assignment.classroom.name}</h3>
                          {assignment.isPrimary && (
                            <Badge variant="default" className="rounded-lg">Class Teacher</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{assignment.subject.name}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Students:</span>
                          <span className="font-medium">{assignment.classroom.currentStrength}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(!assignments || assignments.length === 0) && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No classes assigned yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Mark Attendance</CardTitle>
                <CardDescription>Record student attendance for your classes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Select Class</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Choose a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignments?.map((assignment) => (
                          <SelectItem key={assignment.classroomId} value={assignment.classroomId}>
                            {assignment.classroom.name} - {assignment.subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input className="rounded-xl"
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                    />
                  </div>
                </div>

                {selectedClass && students && students.length > 0 && (
                  <>
                    <div className="flex gap-2">
                      <Button className="rounded-xl" size="sm" variant="outline" onClick={() => markAllStudents('present')}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Mark All Present
                      </Button>
                      <Button className="rounded-xl" size="sm" variant="outline" onClick={() => markAllStudents('absent')}>
                        <XCircle className="h-4 w-4 mr-1" /> Mark All Absent
                      </Button>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Roll No</TableHead>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.rollNumber}</TableCell>
                            <TableCell>{student.user.name}</TableCell>
                            <TableCell>
                              <Select
                                value={attendanceRecords[student.id] || ""}
                                onValueChange={(value) => {
                                  setAttendanceRecords(prev => ({
                                    ...prev,
                                    [student.id]: value as 'present' | 'absent' | 'late' | 'excused',
                                  }));
                                }}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="present">Present</SelectItem>
                                  <SelectItem value="absent">Absent</SelectItem>
                                  <SelectItem value="late">Late</SelectItem>
                                  <SelectItem value="excused">Excused</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <Button
                      onClick={handleMarkAttendance}
                      disabled={attendanceMutation.isPending || Object.keys(attendanceRecords).length === 0}
                    >
                      {attendanceMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Submit Attendance
                    </Button>
                  </>
                )}

                {selectedClass && (!students || students.length === 0) && (
                  <p className="text-center py-8 text-muted-foreground">No students found in this class</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Homework Tab */}
          <TabsContent value="homework">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Assign Homework</CardTitle>
                <CardDescription>Create and assign homework for your classes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Class</Label>
                    <Select value={homeworkForm.classroomId} onValueChange={(value) => setHomeworkForm(prev => ({ ...prev, classroomId: value }))}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignments?.map((assignment) => (
                          <SelectItem key={assignment.classroomId} value={assignment.classroomId}>
                            {assignment.classroom.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <Select value={homeworkForm.subjectId} onValueChange={(value) => setHomeworkForm(prev => ({ ...prev, subjectId: value }))}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignments
                          ?.filter(a => a.classroomId === homeworkForm.classroomId)
                          .map((assignment) => (
                            <SelectItem key={assignment.subject.id} value={assignment.subject.id}>
                              {assignment.subject.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Title</Label>
                  <Input className="rounded-xl"
                    placeholder="Enter homework title"
                    value={homeworkForm.title}
                    onChange={(e) => setHomeworkForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea className="rounded-xl"
                    placeholder="Describe the homework assignment"
                    value={homeworkForm.description}
                    onChange={(e) => setHomeworkForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Due Date</Label>
                  <Input className="rounded-xl"
                    type="date"
                    value={homeworkForm.dueDate}
                    onChange={(e) => setHomeworkForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>

                <Button className="rounded-xl" onClick={handleCreateHomework} disabled={homeworkMutation.isPending}>
                  {homeworkMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
                <CardDescription>View and respond to student messages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {messages?.map((message) => (
                    <Card key={message.id} className={message.status === "sent" ? "border-l-4 border-l-primary" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{message.subject}</h4>
                              <Badge variant={message.status === "sent" ? "default" : "secondary"}>
                                {message.messageType}
                              </Badge>
                              {message.status === "sent" && <Badge variant="destructive">New</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">From: {message.senderName}</p>
                            <p className="text-sm">{message.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(message.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(!messages || messages.length === 0) && (
                    <p className="text-center py-8 text-muted-foreground">No messages yet</p>
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
                <CardDescription>Share daily quotes and announcements with your class</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {primaryClasses.length > 0 ? (
                  <>
                    <div>
                      <Label>Select Your Class</Label>
                      <Select value={quoteForm.classroomId} onValueChange={(value) => setQuoteForm(prev => ({ ...prev, classroomId: value }))}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Choose class" />
                        </SelectTrigger>
                        <SelectContent>
                          {primaryClasses.map((assignment) => (
                            <SelectItem key={assignment.classroomId} value={assignment.classroomId}>
                              {assignment.classroom.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Message Type</Label>
                      <Select value={quoteForm.messageType} onValueChange={(value) => setQuoteForm(prev => ({ ...prev, messageType: value }))}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quote">Daily Quote</SelectItem>
                          <SelectItem value="announcement">Announcement</SelectItem>
                          <SelectItem value="reminder">Reminder</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Message</Label>
                      <Textarea className="rounded-xl"
                        placeholder="Enter your message..."
                        value={quoteForm.content}
                        onChange={(e) => setQuoteForm(prev => ({ ...prev, content: e.target.value }))}
                        rows={4}
                      />
                    </div>

                    <Button className="rounded-xl" onClick={handlePostQuote} disabled={quoteMutation.isPending}>
                      {quoteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
        </Tabs>
      </div>
    </SharedLayout>
  );
}
