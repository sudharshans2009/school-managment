"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { TeacherQuickActions } from "@/components/teacher-quick-actions";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  TrendingUp,
  Users,
  BookOpen,
  ClipboardCheck,
  Award,
  UserCheck,
  BarChart,
} from "lucide-react";
import { useState } from "react";
import { TeacherHeader } from "@/components/teacher/teacher-header";

interface TeacherAnalytics {
  classes: {
    total: number;
    students: number;
    subjects: number;
    isPrimary: boolean;
  };
  attendance: {
    totalMarked: number;
    averageRate: number;
    byClass: { className: string; rate: number }[];
  };
  homework: {
    totalAssigned: number;
    totalSubmissions: number;
    graded: number;
    pending: number;
    completionRate: number;
  };
  exams: {
    canUpload: number;
    gradesUploaded: number;
    studentsGraded: number;
  };
  workDone: {
    totalRecords: number;
    bySubject: { subject: string; count: number }[];
  };
}

export default function TeacherAnalyticsPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const [timeRange, setTimeRange] = useState("30");

  const { data: analytics, isLoading } = useQuery<TeacherAnalytics>({
    queryKey: ["teacher-analytics", session?.user?.id, timeRange],
    queryFn: async () => {
      const response = await fetch(
        `/api/teachers/${session?.user?.id}/analytics?days=${timeRange}`,
      );
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
    enabled: !!session?.user?.id,
  });

  if (sessionPending) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    router.push("/auth/signin");
    return null;
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <TeacherHeader
          icon={BarChart}
          title="My Analytics"
          description="Track your teaching performance and student progress"
        >
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </TeacherHeader>
        
        <TeacherQuickActions
          currentPage="analytics"
          unreadMessages={0}
          isPrimaryTeacher={analytics?.classes.isPrimary || false}
        />

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      My Classes
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.classes.total}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <span>{analytics?.classes.students} students</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Attendance
                    </CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.attendance.totalMarked}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <span>
                      {analytics?.attendance.averageRate.toFixed(1)}% avg rate
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Homework
                    </CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.homework.totalAssigned}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <span>{analytics?.homework.pending} pending grading</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Exams</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.exams.studentsGraded}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <span>students graded</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics */}
            <Tabs defaultValue="attendance" className="space-y-4">
              <TabsList>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="homework">Homework</TabsTrigger>
                <TabsTrigger value="exams">Exams</TabsTrigger>
                <TabsTrigger value="workdone">Work Done</TabsTrigger>
              </TabsList>

              {/* Attendance Tab */}
              <TabsContent value="attendance" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Attendance Overview</CardTitle>
                      <CardDescription>
                        Your attendance marking statistics
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Marked
                          </p>
                          <p className="text-2xl font-bold">
                            {analytics?.attendance.totalMarked}
                          </p>
                        </div>
                        <UserCheck className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Average Rate
                          </p>
                          <p className="text-2xl font-bold">
                            {analytics?.attendance.averageRate.toFixed(1)}%
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Attendance by Class</CardTitle>
                      <CardDescription>
                        Rates for each of your classes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analytics?.attendance.byClass.map((item) => (
                        <div key={item.className} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">
                              {item.className}
                            </span>
                            <span className="text-muted-foreground">
                              {item.rate.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${item.rate}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Homework Tab */}
              <TabsContent value="homework" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Assigned</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold">
                        {analytics?.homework.totalAssigned}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Total homework assigned
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Submissions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold">
                        {analytics?.homework.totalSubmissions}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {analytics?.homework.completionRate.toFixed(1)}%
                        completion
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Grading Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Graded
                        </span>
                        <Badge variant="default">
                          {analytics?.homework.graded}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Pending
                        </span>
                        <Badge variant="secondary">
                          {analytics?.homework.pending}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Exams Tab */}
              <TabsContent value="exams" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Available for Grading</CardTitle>
                      <CardDescription>
                        Exams you can upload grades for
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold">
                        {analytics?.exams.canUpload}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Non-finalized exams in your classes
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Grades Uploaded</CardTitle>
                      <CardDescription>
                        Total exam entries uploaded
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold">
                        {analytics?.exams.gradesUploaded}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Individual student grades
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Students Graded</CardTitle>
                      <CardDescription>
                        Unique students with grades
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold">
                        {analytics?.exams.studentsGraded}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Across all your exams
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Work Done Tab */}
              <TabsContent value="workdone" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Work Done Records</CardTitle>
                      <CardDescription>
                        Your teaching activity log
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Records
                          </p>
                          <p className="text-3xl font-bold">
                            {analytics?.workDone.totalRecords}
                          </p>
                        </div>
                        <ClipboardCheck className="h-10 w-10 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-4">
                        This includes topics covered, homework assigned, and
                        class notes
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Records by Subject</CardTitle>
                      <CardDescription>
                        Distribution across your subjects
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analytics?.workDone.bySubject.map((item) => (
                        <div
                          key={item.subject}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary"
                        >
                          <span className="font-medium">{item.subject}</span>
                          <Badge variant="default">{item.count} records</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
