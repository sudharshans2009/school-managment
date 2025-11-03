"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  TrendingUp,
  BookOpen,
  Award,
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  BarChart,
} from "lucide-react";
import { StudentHeader } from "@/components/student/student-header";

interface StudentAnalytics {
  attendance: {
    totalDays: number;
    present: number;
    absent: number;
    late: number;
    rate: number;
    recentTrend: { date: string; status: string }[];
  };
  grades: {
    totalExams: number;
    averagePercentage: number;
    averageGrade: string;
    passed: number;
    failed: number;
    bySubject: { subject: string; average: number; grade: string }[];
    recentGrades: {
      exam: string;
      marks: number;
      total: number;
      grade: string;
      date: string;
    }[];
  };
  homework: {
    totalAssigned: number;
    submitted: number;
    graded: number;
    pending: number;
    averageScore: number;
    onTimeRate: number;
  };
  overall: {
    rank: number;
    totalStudents: number;
    performanceLevel: string;
  };
}

export default function StudentAnalyticsPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();

  const { data: analytics, isLoading } = useQuery<StudentAnalytics>({
    queryKey: ["student-analytics", session?.user?.id],
    queryFn: async () => {
      const response = await fetch("/api/students/analytics");
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
    enabled: !!session?.user,
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

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case "Excellent":
        return "text-green-600";
      case "Good":
        return "text-blue-600";
      case "Average":
        return "text-yellow-600";
      default:
        return "text-red-600";
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <StudentHeader
          icon={BarChart}
          title="My Performance"
          description="Track your academic progress and achievements"
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
                      Attendance
                    </CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.attendance.rate.toFixed(1)}%
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <span>
                      {analytics?.attendance.present}/
                      {analytics?.attendance.totalDays} days
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Average Grade
                    </CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.grades.averageGrade}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <span>
                      {analytics?.grades.averagePercentage.toFixed(1)}% overall
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
                    {analytics?.homework.submitted}/
                    {analytics?.homework.totalAssigned}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <span>
                      {analytics?.homework.onTimeRate.toFixed(1)}% on time
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Class Rank
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    #{analytics?.overall.rank}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <span>of {analytics?.overall.totalStudents} students</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Level */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Overall Performance
                    </p>
                    <p
                      className={`text-3xl font-bold mt-1 ${getPerformanceColor(
                        analytics?.overall.performanceLevel || "",
                      )}`}
                    >
                      {analytics?.overall.performanceLevel}
                    </p>
                  </div>
                  {analytics?.overall.performanceLevel === "Excellent" && (
                    <Award className="h-16 w-16 text-yellow-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Detailed Analytics */}
            <Tabs defaultValue="grades" className="space-y-4">
              <TabsList>
                <TabsTrigger value="grades">Grades</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="homework">Homework</TabsTrigger>
              </TabsList>

              {/* Grades Tab */}
              <TabsContent value="grades" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance by Subject</CardTitle>
                      <CardDescription>
                        Your scores across all subjects
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analytics?.grades.bySubject.map((item) => (
                        <div key={item.subject} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{item.subject}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                {item.average.toFixed(1)}%
                              </span>
                              <Badge>{item.grade}</Badge>
                            </div>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                item.average >= 80
                                  ? "bg-green-500"
                                  : item.average >= 60
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${item.average}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Exam Results</CardTitle>
                      <CardDescription>Your latest test scores</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analytics?.grades.recentGrades
                        .slice(0, 5)
                        .map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-lg bg-secondary"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.exam}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.date}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {item.marks}/{item.total}
                              </span>
                              <Badge>{item.grade}</Badge>
                            </div>
                          </div>
                        ))}
                    </CardContent>
                  </Card>

                  <Card className="col-span-2">
                    <CardHeader>
                      <CardTitle>Exam Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 rounded-lg bg-secondary">
                          <p className="text-sm text-muted-foreground">
                            Total Exams
                          </p>
                          <p className="text-2xl font-bold mt-1">
                            {analytics?.grades.totalExams}
                          </p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-green-50">
                          <p className="text-sm text-muted-foreground">
                            Passed
                          </p>
                          <p className="text-2xl font-bold text-green-600 mt-1">
                            {analytics?.grades.passed}
                          </p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-red-50">
                          <p className="text-sm text-muted-foreground">
                            Failed
                          </p>
                          <p className="text-2xl font-bold text-red-600 mt-1">
                            {analytics?.grades.failed}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Attendance Tab */}
              <TabsContent value="attendance" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Attendance Summary</CardTitle>
                      <CardDescription>
                        Your attendance breakdown
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-green-50">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-8 w-8 text-green-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Present
                            </p>
                            <p className="text-2xl font-bold">
                              {analytics?.attendance.present}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg bg-red-50">
                        <div className="flex items-center gap-3">
                          <XCircle className="h-8 w-8 text-red-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Absent
                            </p>
                            <p className="text-2xl font-bold">
                              {analytics?.attendance.absent}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-50">
                        <div className="flex items-center gap-3">
                          <Clock className="h-8 w-8 text-yellow-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Late
                            </p>
                            <p className="text-2xl font-bold">
                              {analytics?.attendance.late}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Attendance</CardTitle>
                      <CardDescription>
                        Last 7 days attendance record
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {analytics?.attendance.recentTrend
                        .slice(-7)
                        .map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-lg bg-secondary"
                          >
                            <span className="text-sm">{item.date}</span>
                            <Badge
                              variant={
                                item.status === "present"
                                  ? "default"
                                  : item.status === "absent"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {item.status}
                            </Badge>
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
                      <CardTitle>Submitted</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold">
                        {analytics?.homework.submitted}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Out of {analytics?.homework.totalAssigned} assigned
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Average Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold">
                        {analytics?.homework.averageScore.toFixed(1)}%
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Across {analytics?.homework.graded} graded assignments
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold">
                        {analytics?.homework.pending}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Assignments to complete
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Submission Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">
                            Submission Rate
                          </span>
                          <span className="font-medium">
                            {(
                              ((analytics?.homework.submitted || 0) /
                                (analytics?.homework.totalAssigned || 1)) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{
                              width: `${
                                ((analytics?.homework.submitted || 0) /
                                  (analytics?.homework.totalAssigned || 1)) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">
                            On-Time Rate
                          </span>
                          <span className="font-medium">
                            {analytics?.homework.onTimeRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all"
                            style={{
                              width: `${analytics?.homework.onTimeRate}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
