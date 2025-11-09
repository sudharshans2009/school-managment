"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserPlus,
  Trash2,
  Star,
  Calendar,
  Settings,
  BookOpen,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { getAllTeachers } from "@/actions/admin";

interface Classroom {
  id: string;
  name: string;
  grade: string;
  section: string;
  currentStrength: number;
  classroomCode: string;
  classroomKey: string;
  academicYear: string;
  teacherAssignments: Array<{
    id: string;
    isPrimary: boolean;
    teacher: { id: string; name: string };
    subject: { id: string; name: string };
  }>;
  students: Array<{
    id: string;
    rollNumber: string;
    userId: string;
    user: { id: string; name: string; email: string };
  }>;
}

interface Teacher {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Student {
  id: string;
  rollNumber: string;
  user: { id: string; name: string; email: string };
  classroomId: string | null;
}

interface TimetableEntry {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  roomNumber: string;
  subject: { id: string; name: string };
  teacher: { id: string; name: string };
}

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
];

const PERIODS = [
  { period: 1, startTime: "08:45", endTime: "09:25", label: "Period I" },
  { period: 2, startTime: "09:25", endTime: "10:05", label: "Period II" },
  {
    period: "BREAK1",
    startTime: "10:05",
    endTime: "10:15",
    label: "BREAK",
    isBreak: true,
  },
  { period: 3, startTime: "10:15", endTime: "10:55", label: "Period III" },
  { period: 4, startTime: "10:55", endTime: "11:35", label: "Period IV" },
  { period: 5, startTime: "11:35", endTime: "12:15", label: "Period V" },
  {
    period: "LUNCH",
    startTime: "12:15",
    endTime: "12:55",
    label: "LUNCH",
    isBreak: true,
  },
  { period: 6, startTime: "12:55", endTime: "13:35", label: "Period VI" },
  { period: 7, startTime: "13:35", endTime: "14:15", label: "Period VII" },
  {
    period: "BREAK2",
    startTime: "14:15",
    endTime: "14:25",
    label: "BREAK",
    isBreak: true,
  },
  { period: 8, startTime: "14:25", endTime: "15:05", label: "Period VIII" },
  { period: 9, startTime: "15:05", endTime: "15:45", label: "Period IX" },
];

export default function EditClassroomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [openTeacher, setOpenTeacher] = useState(false);
  const [openStudent, setOpenStudent] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [editingPeriod, setEditingPeriod] = useState<{
    period: number;
    startTime: string;
    endTime: string;
    existingEntry?: TimetableEntry;
  } | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: classroom, isLoading } = useQuery<Classroom>({
    queryKey: ["classroom", resolvedParams.id],
    queryFn: async () => {
      const response = await fetch(`/api/classrooms/${resolvedParams.id}`);
      if (!response.ok) throw new Error("Failed to fetch classroom");
      return response.json();
    },
  });

  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ["teachers"],
    queryFn: async () => {
      const data = await getAllTeachers();
      return data.map((t) => ({ id: t.id, name: t.name }));
    },
  });

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: async () => {
      const response = await fetch("/api/subjects");
      if (!response.ok) throw new Error("Failed to fetch subjects");
      return response.json();
    },
  });

  const { data: allStudents } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: async () => {
      const response = await fetch("/api/students");
      if (!response.ok) throw new Error("Failed to fetch students");
      return response.json();
    },
  });

  const { data: timetable } = useQuery<TimetableEntry[]>({
    queryKey: ["timetable", resolvedParams.id],
    queryFn: async () => {
      const response = await fetch(
        `/api/timetable?classroomId=${resolvedParams.id}`,
      );
      if (!response.ok) throw new Error("Failed to fetch timetable");
      return response.json();
    },
  });

  const updateClassroomMutation = useMutation({
    mutationFn: async (data: {
      name?: string;
      grade?: string;
      section?: string;
      academicYear?: string;
    }) => {
      const response = await fetch(`/api/classrooms/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update classroom");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["classroom", resolvedParams.id],
      });
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      setOpenSettings(false);
    },
  });

  const assignTeacherMutation = useMutation({
    mutationFn: async (data: {
      teacherId: string;
      subjectId: string;
      isPrimary: boolean;
    }) => {
      const response = await fetch(
        `/api/classrooms/${resolvedParams.id}/assign-teacher`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign teacher");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["classroom", resolvedParams.id],
      });
      setOpenTeacher(false);
    },
  });

  const removeTeacherMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await fetch(
        `/api/classrooms/${resolvedParams.id}/assign-teacher?assignmentId=${assignmentId}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("Failed to remove teacher");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["classroom", resolvedParams.id],
      });
    },
  });

  const assignStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const response = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classroomId: resolvedParams.id }),
      });
      if (!response.ok) throw new Error("Failed to assign student");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["classroom", resolvedParams.id],
      });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      setOpenStudent(false);
    },
  });

  const removeStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const response = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classroomId: null }),
      });
      if (!response.ok) throw new Error("Failed to remove student");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["classroom", resolvedParams.id],
      });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
    },
  });

  const saveTimetableMutation = useMutation({
    mutationFn: async (data: {
      subjectId: string;
      teacherId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      roomNumber: string;
      id?: string;
    }) => {
      if (data.id) {
        const { id, ...body } = data;
        const response = await fetch(`/api/timetable/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error("Failed to update timetable");
        return response.json();
      } else {
        const response = await fetch("/api/timetable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, classroomId: resolvedParams.id }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to save timetable");
        }
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["timetable", resolvedParams.id],
      });
      setEditingPeriod(null);
    },
  });

  const deleteTimetableMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/timetable/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete timetable entry");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["timetable", resolvedParams.id],
      });
    },
  });

  const handleAssignTeacher = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    assignTeacherMutation.mutate({
      teacherId: formData.get("teacherId") as string,
      subjectId: formData.get("subjectId") as string,
      isPrimary: formData.get("isPrimary") === "true",
    });
  };

  const handleAssignStudent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    assignStudentMutation.mutate(formData.get("studentId") as string);
  };

  const handleUpdateClassroom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateClassroomMutation.mutate({
      name: formData.get("name") as string,
      grade: formData.get("grade") as string,
      section: formData.get("section") as string,
      academicYear: formData.get("academicYear") as string,
    });
  };

  const handleSaveTimetable = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPeriod) return;

    const formData = new FormData(e.currentTarget);
    saveTimetableMutation.mutate({
      subjectId: formData.get("subjectId") as string,
      teacherId: formData.get("teacherId") as string,
      dayOfWeek: selectedDay,
      startTime: editingPeriod.startTime,
      endTime: editingPeriod.endTime,
      roomNumber: formData.get("roomNumber") as string,
      id: editingPeriod.existingEntry?.id,
    });
  };

  const getTimetableEntry = (dayOfWeek: number, startTime: string) => {
    return timetable?.find(
      (entry) => entry.dayOfWeek === dayOfWeek && entry.startTime === startTime,
    );
  };

  const unassignedStudents = allStudents?.filter(
    (student) => !student.classroomId,
  );

  if (isLoading) {
    return (
      <DashboardLayout title="Classroom Settings" description="Admin Portal">
        <div className="text-center">Loading classroom...</div>
      </DashboardLayout>
    );
  }

  if (!classroom) {
    return (
      <DashboardLayout title="Classroom Settings" description="Admin Portal">
        <Alert variant="destructive">
          <AlertDescription>Classroom not found</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Classroom Settings" description="Admin Portal">
      <div className="mb-6 flex justify-between items-center">
        <Button variant="outline" onClick={() => router.back()}>
          ← Back
        </Button>
        <Dialog open={openSettings} onOpenChange={setOpenSettings}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Classroom Settings
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Classroom Settings</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateClassroom} className="space-y-4">
              <div>
                <Label htmlFor="name">Classroom Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={classroom.name}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="grade">Grade *</Label>
                  <Input
                    id="grade"
                    name="grade"
                    defaultValue={classroom.grade}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="section">Section *</Label>
                  <Input
                    id="section"
                    name="section"
                    defaultValue={classroom.section}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="academicYear">Academic Year *</Label>
                <Input
                  id="academicYear"
                  name="academicYear"
                  defaultValue={classroom.academicYear}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenSettings(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateClassroomMutation.isPending}
                >
                  {updateClassroomMutation.isPending ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Classroom Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{classroom.name}</span>
            <div className="flex gap-2">
              <Badge variant="secondary">{classroom.classroomCode}</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Grade</p>
              <p className="font-semibold">{classroom.grade}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Section</p>
              <p className="font-semibold">{classroom.section}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Enrolled Students</p>
              <p className="font-semibold">{classroom.students.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Academic Year</p>
              <p className="font-semibold">{classroom.academicYear}</p>
            </div>
          </div>

          {/* Smartboard Access Credentials */}
          <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center text-lg">
              <BookOpen className="h-5 w-5 mr-2" />
              Smartboard Access Credentials
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700 font-medium mb-1">
                  Classroom ID
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-white rounded border border-blue-300 font-mono text-sm text-blue-900 break-all">
                    {classroom.id}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(classroom.id);
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium mb-1">
                  Classroom Key
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-white rounded border border-blue-300 font-mono text-sm text-blue-900">
                    {classroom.classroomKey}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(classroom.classroomKey);
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-3">
              📺 Use these credentials to log into the smartboard at{" "}
              <strong>/smartboard/login</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="teachers" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
        </TabsList>

        {/* Teachers Tab */}
        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Assigned Teachers</CardTitle>
                <Dialog open={openTeacher} onOpenChange={setOpenTeacher}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign Teacher
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Teacher to Classroom</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAssignTeacher} className="space-y-4">
                      <div>
                        <Label htmlFor="teacherId">Teacher *</Label>
                        <Select name="teacherId" required>
                          <SelectTrigger id="teacherId">
                            <SelectValue placeholder="Select teacher" />
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
                        <Label htmlFor="subjectId">Subject *</Label>
                        <Select name="subjectId" required>
                          <SelectTrigger id="subjectId">
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects?.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="isPrimary">Set as Class Teacher?</Label>
                        <Select name="isPrimary" defaultValue="false">
                          <SelectTrigger id="isPrimary">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">No</SelectItem>
                            <SelectItem value="true">Yes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {assignTeacherMutation.error && (
                        <Alert variant="destructive">
                          <AlertDescription>
                            {assignTeacherMutation.error.message}
                          </AlertDescription>
                        </Alert>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setOpenTeacher(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={assignTeacherMutation.isPending}
                        >
                          {assignTeacherMutation.isPending
                            ? "Assigning..."
                            : "Assign"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {classroom.teacherAssignments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No teachers assigned yet
                </p>
              ) : (
                <div className="space-y-2">
                  {classroom.teacherAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div className="flex items-center gap-3">
                        {assignment.isPrimary && (
                          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        )}
                        <div>
                          <p className="font-semibold">
                            {assignment.teacher.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {assignment.subject.name}
                          </p>
                        </div>
                        {assignment.isPrimary && (
                          <Badge variant="default">Class Teacher</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          removeTeacherMutation.mutate(assignment.id)
                        }
                        disabled={removeTeacherMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  Enrolled Students ({classroom.students.length})
                </CardTitle>
                <Dialog open={openStudent} onOpenChange={setOpenStudent}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Student
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Student to Classroom</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAssignStudent} className="space-y-4">
                      <div>
                        <Label htmlFor="studentId">Select Student *</Label>
                        <Select name="studentId" required>
                          <SelectTrigger id="studentId">
                            <SelectValue placeholder="Choose a student" />
                          </SelectTrigger>
                          <SelectContent>
                            {unassignedStudents?.map((student) => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.user.name} - Roll: {student.rollNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {unassignedStudents?.length === 0 && (
                          <p className="text-sm text-gray-500 mt-2">
                            All students are already assigned to classrooms
                          </p>
                        )}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setOpenStudent(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={
                            assignStudentMutation.isPending ||
                            unassignedStudents?.length === 0
                          }
                        >
                          {assignStudentMutation.isPending
                            ? "Adding..."
                            : "Add Student"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {classroom.students.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No students enrolled yet
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {classroom.students.map((student) => (
                    <div
                      key={student.id}
                      className="p-3 border rounded flex justify-between items-start"
                    >
                      <div>
                        <p className="font-semibold">{student.user.name}</p>
                        <p className="text-sm text-gray-600">
                          Roll: {student.rollNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {student.user.email}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (
                            confirm("Remove this student from the classroom?")
                          ) {
                            removeStudentMutation.mutate(student.id);
                          }
                        }}
                        disabled={removeStudentMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timetable Tab */}
        <TabsContent value="timetable">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Timetable (9 Periods/Day)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Day selector */}
              <div className="mb-4">
                <Label>Select Day</Label>
                <Select
                  value={selectedDay.toString()}
                  onValueChange={(value) => setSelectedDay(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Timetable Grid */}
              <div className="space-y-2">
                {PERIODS.map((period) =>
                  period.isBreak ? (
                    <div
                      key={period.period}
                      className="p-3 bg-gray-100 dark:bg-gray-800 rounded text-center font-semibold"
                    >
                      {period.label} ({period.startTime} - {period.endTime})
                    </div>
                  ) : (
                    <div key={period.period} className="p-3 border rounded">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <span className="font-semibold">
                              {period.label}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {period.startTime} - {period.endTime}
                            </Badge>
                          </div>
                          {(() => {
                            const entry = getTimetableEntry(
                              selectedDay,
                              period.startTime,
                            );
                            return entry ? (
                              <div className="ml-6">
                                <p className="font-medium text-blue-600">
                                  {entry.subject.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {entry.teacher.name} • Room {entry.roomNumber}
                                </p>
                              </div>
                            ) : (
                              <p className="ml-6 text-sm text-gray-400">
                                Not scheduled
                              </p>
                            );
                          })()}
                        </div>
                        <div className="flex gap-1">
                          {(() => {
                            const entry = getTimetableEntry(
                              selectedDay,
                              period.startTime,
                            );
                            return entry ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setEditingPeriod({
                                      period: period.period as number,
                                      startTime: period.startTime,
                                      endTime: period.endTime,
                                      existingEntry: entry,
                                    })
                                  }
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (
                                      confirm("Delete this timetable entry?")
                                    ) {
                                      deleteTimetableMutation.mutate(entry.id);
                                    }
                                  }}
                                  disabled={deleteTimetableMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setEditingPeriod({
                                    period: period.period as number,
                                    startTime: period.startTime,
                                    endTime: period.endTime,
                                  })
                                }
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Timetable Edit Dialog */}
      <Dialog
        open={!!editingPeriod}
        onOpenChange={() => setEditingPeriod(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPeriod?.existingEntry ? "Edit" : "Add"} Period{" "}
              {editingPeriod?.period} -{" "}
              {DAYS.find((d) => d.value === selectedDay)?.label}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveTimetable} className="space-y-4">
            <div>
              <Label>Time Slot</Label>
              <Input
                value={`${editingPeriod?.startTime} - ${editingPeriod?.endTime}`}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="subjectId">Subject *</Label>
              <Select
                name="subjectId"
                required
                defaultValue={editingPeriod?.existingEntry?.subject.id}
              >
                <SelectTrigger id="subjectId">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects?.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="teacherId">Teacher *</Label>
              <Select
                name="teacherId"
                required
                defaultValue={editingPeriod?.existingEntry?.teacher.id}
              >
                <SelectTrigger id="teacherId">
                  <SelectValue placeholder="Select teacher" />
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
              <Label htmlFor="roomNumber">Room Number *</Label>
              <Input
                id="roomNumber"
                name="roomNumber"
                placeholder="e.g., 101"
                required
                defaultValue={editingPeriod?.existingEntry?.roomNumber}
              />
            </div>
            {saveTimetableMutation.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {saveTimetableMutation.error.message}
                </AlertDescription>
              </Alert>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingPeriod(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveTimetableMutation.isPending}>
                {saveTimetableMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
