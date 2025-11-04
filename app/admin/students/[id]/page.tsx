"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Heart,
  GraduationCap,
  UserCheck,
  Home,
  Users,
} from "lucide-react";

interface StudentDetail {
  id: string;
  rollNumber: string;
  admissionNumber: string;
  dateOfBirth: string;
  bloodGroup: string | null;
  medicalInfo: string | null;
  user: {
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
  };
  classroom: {
    name: string;
    grade: string;
    section: string;
  } | null;
  parent: {
    name: string;
    email: string;
    phone: string | null;
  } | null;
}

interface AttendanceStats {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}

interface ExamResult {
  id: string;
  examName: string;
  subjectName: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  date: string;
}

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.id as string;

  const { data: student, isLoading } = useQuery<StudentDetail>({
    queryKey: ["student", studentId],
    queryFn: async () => {
      const response = await fetch(`/api/students/${studentId}`);
      if (!response.ok) throw new Error("Failed to fetch student");
      return response.json();
    },
  });

  const { data: attendanceStats } = useQuery<AttendanceStats>({
    queryKey: ["student-attendance", studentId],
    queryFn: async () => {
      const response = await fetch(
        `/api/students/${studentId}/attendance-stats`,
      );
      if (!response.ok) throw new Error("Failed to fetch attendance");
      return response.json();
    },
  });

  const { data: examResults } = useQuery<ExamResult[]>({
    queryKey: ["student-exams", studentId],
    queryFn: async () => {
      const response = await fetch(`/api/students/${studentId}/exam-results`);
      if (!response.ok) throw new Error("Failed to fetch exam results");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Student Details" description="Admin Portal">
        <div className="text-center py-12">Loading student details...</div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout title="Student Details" description="Admin Portal">
        <div className="text-center py-12">Student not found</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Details" description="Admin Portal">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/students">
            <Button variant="ghost" size="sm" className="rounded-xl">
              ← Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{student.user.name}</h1>
            <p className="text-muted-foreground">
              Roll No: {student.rollNumber} | Admission No:{" "}
              {student.admissionNumber}
            </p>
          </div>
        </div>

        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList>
            <TabsTrigger value="basic">
              <User className="h-4 w-4 mr-2" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="medical">
              <Heart className="h-4 w-4 mr-2" />
              Medical Info
            </TabsTrigger>
            <TabsTrigger value="performance">
              <GraduationCap className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="attendance">
              <UserCheck className="h-4 w-4 mr-2" />
              Attendance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{student.user.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{student.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">
                        {student.user.phone || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Date of Birth
                      </p>
                      <p className="font-medium">
                        {new Date(student.dateOfBirth).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">
                        {student.user.address || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Home className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Class & Section
                      </p>
                      <p className="font-medium">
                        {student.classroom
                          ? `${student.classroom.name}`
                          : "Not assigned"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Parent/Guardian Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {student.parent ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Parent Name
                        </p>
                        <p className="font-medium">{student.parent.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Parent Email
                        </p>
                        <p className="font-medium">{student.parent.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Parent Phone
                        </p>
                        <p className="font-medium">
                          {student.parent.phone || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No parent information available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medical" className="space-y-4">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Medical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Blood Group
                    </p>
                    {student.bloodGroup ? (
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {student.bloodGroup}
                      </Badge>
                    ) : (
                      <p className="text-muted-foreground">Not provided</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Medical History & Allergies
                  </p>
                  <div className="bg-muted p-4 rounded-xl">
                    {student.medicalInfo ? (
                      <p className="whitespace-pre-wrap">
                        {student.medicalInfo}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        No medical information recorded
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Exam Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {examResults && examResults.length > 0 ? (
                  <div className="space-y-3">
                    {examResults.map((result) => (
                      <div
                        key={result.id}
                        className="flex items-center justify-between p-3 border rounded-xl"
                      >
                        <div>
                          <p className="font-medium">{result.examName}</p>
                          <p className="text-sm text-muted-foreground">
                            {result.subjectName} •{" "}
                            {new Date(result.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {result.marksObtained}/{result.totalMarks}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {result.percentage.toFixed(1)}%
                            </Badge>
                            <Badge>{result.grade}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No exam results available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Attendance Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceStats ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {attendanceStats.present}
                        </p>
                        <p className="text-sm text-muted-foreground">Present</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {attendanceStats.absent}
                        </p>
                        <p className="text-sm text-muted-foreground">Absent</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                          {attendanceStats.late}
                        </p>
                        <p className="text-sm text-muted-foreground">Late</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {attendanceStats.excused}
                        </p>
                        <p className="text-sm text-muted-foreground">Excused</p>
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-xl">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Working Days
                          </p>
                          <p className="text-2xl font-bold">
                            {attendanceStats.totalDays}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            Attendance Rate
                          </p>
                          <p className="text-2xl font-bold text-primary">
                            {attendanceStats.attendanceRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No attendance data available
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
