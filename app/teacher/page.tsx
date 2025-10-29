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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  BookOpen, Users, Calendar, MessageSquare, Quote, 
  CheckCircle, XCircle, Send, Loader2, FileText, UserCheck, ClipboardList, AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

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

interface TeacherLeave {
  id: string;
  teacherId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  approvedBy?: string;
  approvalNotes?: string;
  approvedAt?: string;
  createdAt: string;
}

interface SubstituteAssignment {
  id: string;
  originalTeacherId: string;
  originalTeacherName: string;
  classroomId: string;
  classroomName: string;
  classroomGrade: string;
  classroomSection: string;
  subjectId: string;
  subjectName: string;
  date: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  reason?: string;
}

interface WorkDone {
  id: string;
  classroomId: string;
  classroomName: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  date: string;
  periodNumber: number;
  topicsCovered: string;
  homeworkAssigned?: string;
  remarks?: string;
  isSubstitute: boolean;
  createdAt: string;
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

  const [leaveForm, setLeaveForm] = useState({
    leaveType: "casual",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [workDoneForm, setWorkDoneForm] = useState({
    classroomId: "",
    subjectId: "",
    date: new Date().toISOString().split('T')[0],
    periodNumber: 1,
    topicsCovered: "",
    homeworkAssigned: "",
    remarks: "",
  });

  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showWorkDoneDialog, setShowWorkDoneDialog] = useState(false);

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

  // Fetch teacher leaves
  const { data: leaves } = useQuery<TeacherLeave[]>({
    queryKey: ["teacher-leaves", session?.user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/teacher-leaves?teacherId=${session?.user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch leaves");
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  // Fetch substitute assignments
  const { data: substituteAssignments } = useQuery<SubstituteAssignment[]>({
    queryKey: ["substitute-assignments", session?.user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/substitute-assignments?substituteTeacherId=${session?.user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch substitute assignments");
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  // Fetch work done records
  const { data: workDoneRecords } = useQuery<WorkDone[]>({
    queryKey: ["work-done", session?.user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/work-done?teacherId=${session?.user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch work done records");
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

  // Create leave request mutation
  const leaveMutation = useMutation({
    mutationFn: async (data: typeof leaveForm & { teacherId: string }) => {
      const res = await fetch("/api/teacher-leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create leave request");
      return res.json();
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
      const res = await fetch("/api/work-done", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create work done record");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Work done recorded successfully");
      setWorkDoneForm({
        classroomId: "",
        subjectId: "",
        date: new Date().toISOString().split('T')[0],
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
      const res = await fetch(`/api/teacher-leaves/${leaveId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!res.ok) throw new Error("Failed to cancel leave");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Leave request cancelled");
      queryClient.invalidateQueries({ queryKey: ["teacher-leaves"] });
    },
    onError: () => {
      toast.error("Failed to cancel leave request");
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
    <DashboardLayout title="Teacher Portal" description={`Welcome back, ${session.user?.name}`}>
      <div className="space-y-6">
        {/* Quick Actions */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={() => router.push("/teacher/homework")}
              >
                <BookOpen className="h-5 w-5 mr-3 text-primary" />
                <div className="text-left">
                  <div className="font-semibold">Homework Submissions</div>
                  <div className="text-sm text-muted-foreground">Mark & grade homework</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

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
          <TabsList className="grid w-full grid-cols-8 rounded-xl">
            <TabsTrigger value="classes" className="rounded-lg">My Classes</TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-lg">Attendance</TabsTrigger>
            <TabsTrigger value="homework" className="rounded-lg">Homework</TabsTrigger>
            <TabsTrigger value="messages" className="rounded-lg">Messages</TabsTrigger>
            <TabsTrigger value="classroom-msg" className="rounded-lg">Class Message</TabsTrigger>
            <TabsTrigger value="leaves" className="rounded-lg">My Leaves</TabsTrigger>
            <TabsTrigger value="substitutes" className="rounded-lg">Substitute Duties</TabsTrigger>
            <TabsTrigger value="work-done" className="rounded-lg">Work Done</TabsTrigger>
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

          {/* My Leaves Tab */}
          <TabsContent value="leaves">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>My Leave Requests</CardTitle>
                <CardDescription>View and manage your leave requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
                  <DialogTrigger asChild>
                    <Button className="rounded-xl">
                      <FileText className="h-4 w-4 mr-2" />
                      Request Leave
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl">
                    <DialogHeader>
                      <DialogTitle>Request Leave</DialogTitle>
                      <DialogDescription>Fill in the leave request form</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Leave Type</Label>
                        <Select value={leaveForm.leaveType} onValueChange={(value) => setLeaveForm(prev => ({ ...prev, leaveType: value }))}>
                          <SelectTrigger className="rounded-xl">
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
                            className="rounded-xl"
                            value={leaveForm.startDate}
                            onChange={(e) => setLeaveForm(prev => ({ ...prev, startDate: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            className="rounded-xl"
                            value={leaveForm.endDate}
                            onChange={(e) => setLeaveForm(prev => ({ ...prev, endDate: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Reason</Label>
                        <Textarea
                          className="rounded-xl"
                          rows={3}
                          value={leaveForm.reason}
                          onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                          placeholder="Enter reason for leave..."
                        />
                      </div>
                      <Button
                        className="w-full rounded-xl"
                        onClick={() => leaveMutation.mutate({ ...leaveForm, teacherId: session?.user?.id || "" })}
                        disabled={leaveMutation.isPending}
                      >
                        {leaveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                        Submit Request
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="space-y-3">
                  {leaves?.map((leave) => (
                    <Card key={leave.id} className="rounded-xl">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold capitalize">{leave.leaveType} Leave</h4>
                              <Badge variant={
                                leave.status === 'approved' ? 'default' :
                                leave.status === 'rejected' ? 'destructive' :
                                leave.status === 'cancelled' ? 'secondary' : 'outline'
                              }>
                                {leave.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {leave.startDate} to {leave.endDate}
                            </p>
                            <p className="text-sm">{leave.reason}</p>
                            {leave.approvalNotes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                <strong>Admin Notes:</strong> {leave.approvalNotes}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Requested on: {new Date(leave.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {leave.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl"
                              onClick={() => cancelLeaveMutation.mutate(leave.id)}
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
                    <p className="text-center py-8 text-muted-foreground">No leave requests yet</p>
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
                <CardDescription>Your upcoming substitute assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {substituteAssignments?.map((assignment) => (
                    <Card key={assignment.id} className="rounded-xl border-l-4 border-l-orange-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">
                                {assignment.classroomName} - {assignment.subjectName}
                              </h4>
                              <Badge variant="outline">Period {assignment.periodNumber}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              <strong>Date:</strong> {assignment.date}
                            </p>
                            <p className="text-sm text-muted-foreground mb-1">
                              <strong>Time:</strong> {assignment.startTime} - {assignment.endTime}
                            </p>
                            <p className="text-sm text-muted-foreground mb-1">
                              <strong>Original Teacher:</strong> {assignment.originalTeacherName}
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
                  {(!substituteAssignments || substituteAssignments.length === 0) && (
                    <div className="text-center py-8">
                      <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No substitute duties assigned</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Work Done Tab */}
          <TabsContent value="work-done">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Work Done Records</CardTitle>
                <CardDescription>Record and view what was taught in each period</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog open={showWorkDoneDialog} onOpenChange={setShowWorkDoneDialog}>
                  <DialogTrigger asChild>
                    <Button className="rounded-xl">
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Record Work Done
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Record Work Done</DialogTitle>
                      <DialogDescription>Document what was covered in the period</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Class</Label>
                          <Select value={workDoneForm.classroomId} onValueChange={(value) => setWorkDoneForm(prev => ({ ...prev, classroomId: value }))}>
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
                          <Select value={workDoneForm.subjectId} onValueChange={(value) => setWorkDoneForm(prev => ({ ...prev, subjectId: value }))}>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {assignments?.map((assignment) => (
                                <SelectItem key={assignment.id} value={assignment.subject.id}>
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
                            className="rounded-xl"
                            value={workDoneForm.date}
                            onChange={(e) => setWorkDoneForm(prev => ({ ...prev, date: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Period Number</Label>
                          <Select value={workDoneForm.periodNumber.toString()} onValueChange={(value) => setWorkDoneForm(prev => ({ ...prev, periodNumber: parseInt(value) }))}>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => (
                                <SelectItem key={p} value={p.toString()}>Period {p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label>Topics Covered *</Label>
                        <Textarea
                          className="rounded-xl"
                          rows={3}
                          value={workDoneForm.topicsCovered}
                          onChange={(e) => setWorkDoneForm(prev => ({ ...prev, topicsCovered: e.target.value }))}
                          placeholder="Enter topics covered in this period..."
                        />
                      </div>
                      <div>
                        <Label>Homework Assigned (Optional)</Label>
                        <Textarea
                          className="rounded-xl"
                          rows={2}
                          value={workDoneForm.homeworkAssigned}
                          onChange={(e) => setWorkDoneForm(prev => ({ ...prev, homeworkAssigned: e.target.value }))}
                          placeholder="Enter homework assigned..."
                        />
                      </div>
                      <div>
                        <Label>Remarks (Optional)</Label>
                        <Textarea
                          className="rounded-xl"
                          rows={2}
                          value={workDoneForm.remarks}
                          onChange={(e) => setWorkDoneForm(prev => ({ ...prev, remarks: e.target.value }))}
                          placeholder="Any additional remarks..."
                        />
                      </div>
                      <Button
                        className="w-full rounded-xl"
                        onClick={() => workDoneMutation.mutate({ ...workDoneForm, teacherId: session?.user?.id || "" })}
                        disabled={workDoneMutation.isPending || !workDoneForm.topicsCovered}
                      >
                        {workDoneMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                        Submit
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="space-y-3">
                  {workDoneRecords?.map((record) => (
                    <Card key={record.id} className="rounded-xl">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">
                              {record.classroomName} - {record.subjectName}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {record.date} | Period {record.periodNumber}
                              {record.isSubstitute && <Badge variant="outline" className="ml-2">Substitute</Badge>}
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
                              <p className="text-sm font-medium">Homework:</p>
                              <p className="text-sm text-muted-foreground">{record.homeworkAssigned}</p>
                            </div>
                          )}
                          {record.remarks && (
                            <div>
                              <p className="text-sm font-medium">Remarks:</p>
                              <p className="text-sm text-muted-foreground">{record.remarks}</p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Recorded on: {new Date(record.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(!workDoneRecords || workDoneRecords.length === 0) && (
                    <div className="text-center py-8">
                      <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No work done records yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
