"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  UserCheck,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

interface Classroom {
  id: string;
  name: string;
}

interface Student {
  id: string;
  user: {
    name: string;
  };
  rollNumber: string;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentRollNumber: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  remarks: string | null;
  createdAt: string;
}

export default function AdminAttendancePage() {
  const [selectedClassroom, setSelectedClassroom] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [viewMode, setViewMode] = useState<"view" | "mark">("view");
  const [error, setError] = useState("");
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

  // Fetch students for selected classroom
  const { data: students } = useQuery<Student[]>({
    queryKey: ["students", selectedClassroom],
    queryFn: async () => {
      const response = await fetch(
        `/api/students?classroomId=${selectedClassroom}`,
      );
      if (!response.ok) throw new Error("Failed to fetch students");
      return response.json();
    },
    enabled: !!selectedClassroom,
  });

  // Fetch attendance records
  const { data: attendanceRecords, isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance", selectedClassroom, selectedDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        classroomId: selectedClassroom,
        startDate: selectedDate,
        endDate: selectedDate,
      });
      const response = await fetch(`/api/attendance?${params}`);
      if (!response.ok) throw new Error("Failed to fetch attendance");
      return response.json();
    },
    enabled: !!selectedClassroom && !!selectedDate,
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async (data: {
      records: Array<{
        studentId: string;
        classroomId: string;
        status: string;
        date: Date;
      }>;
      markedBy: string;
    }) => {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to mark attendance");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      setViewMode("view");
      setError("");
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleMarkAttendance = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const records =
      students?.map((student) => ({
        studentId: student.id,
        classroomId: selectedClassroom,
        status: formData.get(`status-${student.id}`) as string,
        date: new Date(selectedDate),
      })) || [];

    // Get current user ID (you'll need to get this from session)
    const markedBy = "current-user-id"; // Replace with actual session user ID

    markAttendanceMutation.mutate({ records, markedBy });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "absent":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "late":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "excused":
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "destructive" | "secondary" | "outline"
    > = {
      present: "default",
      absent: "destructive",
      late: "secondary",
      excused: "outline",
    };

    return (
      <Badge
        variant={variants[status] || "default"}
        className="flex items-center gap-1"
      >
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Calculate attendance stats
  const attendanceStats = attendanceRecords
    ? {
        present: attendanceRecords.filter((r) => r.status === "present").length,
        absent: attendanceRecords.filter((r) => r.status === "absent").length,
        late: attendanceRecords.filter((r) => r.status === "late").length,
        excused: attendanceRecords.filter((r) => r.status === "excused").length,
        total: students?.length || 0,
      }
    : null;

  return (
    <DashboardLayout title="Admin Portal" description="Attendance Management">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="rounded-xl">
                ← Back
              </Button>
            </Link>
            <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold">Attendance Management</h1>
          </div>
          {selectedClassroom && students && students.length > 0 && (
            <Button
              className="rounded-xl w-full sm:w-auto"
              onClick={() => setViewMode(viewMode === "view" ? "mark" : "view")}
              disabled={!selectedDate}
            >
              {viewMode === "view" ? "Mark Attendance" : "View Records"}
            </Button>
          )}
        </div>
        {/* Filters */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Select Classroom</Label>
                <Select
                  value={selectedClassroom}
                  onValueChange={setSelectedClassroom}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Choose a classroom" />
                  </SelectTrigger>
                  <SelectContent>
                    {classrooms?.map((classroom) => (
                      <SelectItem key={classroom.id} value={classroom.id}>
                        {classroom.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Select Date</Label>
                <Input
                  type="date"
                  className="rounded-xl"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Mode</Label>
                <div className="pt-2">
                  <Badge
                    variant={viewMode === "view" ? "default" : "secondary"}
                    className="rounded-lg"
                  >
                    {viewMode === "view"
                      ? "Viewing Records"
                      : "Marking Attendance"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!selectedClassroom ? (
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-8 text-center text-muted-foreground">
              Please select a classroom to view or mark attendance.
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : viewMode === "view" ? (
          <>
            {/* Stats */}
            {attendanceStats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="rounded-2xl shadow-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">
                      {attendanceStats.total}
                    </div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {attendanceStats.present}
                    </div>
                    <div className="text-sm text-muted-foreground">Present</div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {attendanceStats.absent}
                    </div>
                    <div className="text-sm text-muted-foreground">Absent</div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {attendanceStats.late}
                    </div>
                    <div className="text-sm text-muted-foreground">Late</div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {attendanceStats.excused}
                    </div>
                    <div className="text-sm text-muted-foreground">Excused</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Records Table */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>
                  Attendance Records - {format(new Date(selectedDate), "PPP")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceRecords && attendanceRecords.length > 0 ? (
                  <div className="space-y-2">
                    {attendanceRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted"
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="font-medium">
                              {record.studentName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Roll No: {record.studentRollNumber}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {record.remarks && (
                            <span className="text-sm text-gray-600 italic">
                              {record.remarks}
                            </span>
                          )}
                          {getStatusBadge(record.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No attendance records found for this date. Click &quot;Mark
                    Attendance&quot; to create records.
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          /* Mark Attendance Form */
          <Card>
            <CardHeader>
              <CardTitle>
                Mark Attendance - {format(new Date(selectedDate), "PPP")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMarkAttendance} className="space-y-4">
                {students?.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{student.user.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Roll No: {student.rollNumber}
                      </div>
                    </div>
                    <Select
                      name={`status-${student.id}`}
                      defaultValue="present"
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="excused">Excused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setViewMode("view")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={markAttendanceMutation.isPending}
                  >
                    {markAttendanceMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Attendance"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
