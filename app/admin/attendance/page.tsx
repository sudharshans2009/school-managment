"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Loader2 
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

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
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
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
      const response = await fetch(`/api/students?classroomId=${selectedClassroom}`);
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
    mutationFn: async (data: { records: Array<{ studentId: string; classroomId: string; status: string; date: Date }>, markedBy: string }) => {
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
    
    const records = students?.map((student) => ({
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
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      present: "default",
      absent: "destructive",
      late: "secondary",
      excused: "outline",
    };
    
    return (
      <Badge variant={variants[status] || "default"} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Calculate attendance stats
  const attendanceStats = attendanceRecords ? {
    present: attendanceRecords.filter(r => r.status === "present").length,
    absent: attendanceRecords.filter(r => r.status === "absent").length,
    late: attendanceRecords.filter(r => r.status === "late").length,
    excused: attendanceRecords.filter(r => r.status === "excused").length,
    total: students?.length || 0,
  } : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  ← Back
                </Button>
              </Link>
              <UserCheck className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Attendance Management
              </h1>
            </div>
            {selectedClassroom && students && students.length > 0 && (
              <Button
                onClick={() => setViewMode(viewMode === "view" ? "mark" : "view")}
                disabled={!selectedDate}
              >
                {viewMode === "view" ? "Mark Attendance" : "View Records"}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Select Classroom</Label>
                <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
                  <SelectTrigger>
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
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Mode</Label>
                <div className="pt-2">
                  <Badge variant={viewMode === "view" ? "default" : "secondary"}>
                    {viewMode === "view" ? "Viewing Records" : "Marking Attendance"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!selectedClassroom ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Please select a classroom to view or mark attendance.
            </CardContent>
          </Card>
        ) : isLoading ? (
          <Card>
            <CardContent className="p-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : viewMode === "view" ? (
          <>
            {/* Stats */}
            {attendanceStats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {attendanceStats.total}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {attendanceStats.present}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Present</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {attendanceStats.absent}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Absent</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {attendanceStats.late}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Late</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {attendanceStats.excused}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Excused</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Records Table */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Records - {format(new Date(selectedDate), "PPP")}</CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceRecords && attendanceRecords.length > 0 ? (
                  <div className="space-y-2">
                    {attendanceRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="font-medium">{record.studentName}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
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
                    No attendance records found for this date. Click &quot;Mark Attendance&quot; to create records.
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          /* Mark Attendance Form */
          <Card>
            <CardHeader>
              <CardTitle>Mark Attendance - {format(new Date(selectedDate), "PPP")}</CardTitle>
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
                    <Select name={`status-${student.id}`} defaultValue="present">
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
                  <Button type="submit" disabled={markAttendanceMutation.isPending}>
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
      </main>
    </div>
  );
}
