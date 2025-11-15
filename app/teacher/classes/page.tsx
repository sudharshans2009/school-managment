"use client";

import { useSession } from "@/lib/auth/client";
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
import { CheckCircle, XCircle, Loader2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { TeacherQuickActions } from "@/components/teacher-quick-actions";
import { TeacherHeader } from "@/components/teacher/teacher-header";
import {
  getTeacherAssignments,
  getClassroomStudents,
  type TeacherAssignment,
} from "@/actions/teacher";

interface Student {
  id: string;
  rollNumber: string;
  user: {
    name: string;
    email: string;
  };
}

export default function TeacherClassesPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedClass, setSelectedClass] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, "present" | "absent" | "late" | "excused">
  >({});

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

  // Fetch students for selected class
  const { data: students } = useQuery<Student[]>({
    queryKey: ["students", selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      return await getClassroomStudents(selectedClass);
    },
    enabled: !!selectedClass,
  });

  // Submit attendance mutation
  const attendanceMutation = useMutation({
    mutationFn: async (data: {
      records: {
        studentId: string;
        classroomId: string;
        status: "present" | "absent" | "late" | "excused";
        date: Date;
      }[];
      markedBy: string;
    }) => {
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

  const handleMarkAttendance = () => {
    if (!selectedClass || !students) {
      toast.error("Please select a class first");
      return;
    }

    const records = Object.entries(attendanceRecords).map(
      ([studentId, status]) => ({
        studentId,
        classroomId: selectedClass,
        status,
        date: new Date(attendanceDate),
      }),
    );

    if (records.length === 0) {
      toast.error("Please mark attendance for at least one student");
      return;
    }

    attendanceMutation.mutate({
      records,
      markedBy: session?.user?.id || "",
    });
  };

  const markAllStudents = (
    status: "present" | "absent" | "late" | "excused",
  ) => {
    if (!students) return;
    const newRecords: Record<string, typeof status> = {};
    students.forEach((student) => {
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

  return (
    <DashboardLayout
      title="My Classes & Attendance"
      description="Teacher Portal"
    >
      <div className="space-y-6">
        <TeacherHeader
          icon={Users}
          title="My Classes & Attendance"
          description="View your assigned classes and mark student attendance"
        />

        <TeacherQuickActions currentPage="classes" />

        <Tabs defaultValue="classes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="classes" className="rounded-lg">
              My Classes
            </TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-lg">
              Mark Attendance
            </TabsTrigger>
          </TabsList>

          {/* My Classes Tab */}
          <TabsContent value="classes">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>My Assigned Classes</CardTitle>
                <CardDescription>
                  Classes and subjects you teach
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignments?.map((assignment) => (
                    <Card
                      key={assignment.id}
                      className="shadow-sm hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-lg">
                            {assignment.classroom.name}
                          </h3>
                          {assignment.isPrimary && (
                            <Badge variant="default" className="rounded-lg">
                              Class Teacher
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {assignment.subject.name}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Students:
                          </span>
                          <span className="font-medium">
                            {assignment.classroom.currentStrength}
                          </span>
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
                <CardDescription>
                  Record student attendance for your classes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Select Class</Label>
                    <Select
                      value={selectedClass}
                      onValueChange={setSelectedClass}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignments?.map((assignment) => (
                          <SelectItem
                            key={assignment.classroomId}
                            value={assignment.classroomId}
                          >
                            {assignment.classroom.name} -{" "}
                            {assignment.subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                    />
                  </div>
                </div>

                {selectedClass && students && students.length > 0 && (
                  <>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAllStudents("present")}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Mark All
                        Present
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAllStudents("absent")}
                      >
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
                            <TableCell className="font-medium">
                              {student.rollNumber}
                            </TableCell>
                            <TableCell>{student.user.name}</TableCell>
                            <TableCell>
                              <Select
                                value={attendanceRecords[student.id] || ""}
                                onValueChange={(value) => {
                                  setAttendanceRecords((prev) => ({
                                    ...prev,
                                    [student.id]: value as
                                      | "present"
                                      | "absent"
                                      | "late"
                                      | "excused",
                                  }));
                                }}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="present">
                                    Present
                                  </SelectItem>
                                  <SelectItem value="absent">Absent</SelectItem>
                                  <SelectItem value="late">Late</SelectItem>
                                  <SelectItem value="excused">
                                    Excused
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <Button
                      onClick={handleMarkAttendance}
                      disabled={
                        attendanceMutation.isPending ||
                        Object.keys(attendanceRecords).length === 0
                      }
                    >
                      {attendanceMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Submit Attendance
                    </Button>
                  </>
                )}

                {selectedClass && (!students || students.length === 0) && (
                  <p className="text-center py-8 text-muted-foreground">
                    No students found in this class
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
