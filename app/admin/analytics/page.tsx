"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  ClipboardCheck,
  Award,
  UserCheck,
  Calendar,
} from "lucide-react";
import { useState } from "react";

interface AnalyticsData {
  attendance: {
    overall: number;
    byGrade: { grade: string; rate: number }[];
    trend: { date: string; rate: number }[];
  };
  grades: {
    averagePercentage: number;
    passingRate: number;
    bySubject: { subject: string; average: number }[];
    distribution: { grade: string; count: number }[];
  };
  homework: {
    totalAssigned: number;
    completionRate: number;
    onTimeRate: number;
    bySubject: { subject: string; completion: number }[];
  };
  exams: {
    totalConducted: number;
    averageScore: number;
    finalized: number;
    pending: number;
  };
  students: {
    total: number;
    active: number;
    byGrade: { grade: string; count: number }[];
  };
  teachers: {
    total: number;
    active: number;
    assignmentRate: number;
  };
}

export default function AdminAnalyticsPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const [timeRange, setTimeRange] = useState("30");

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["admin-analytics", timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/analytics?days=${timeRange}`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
    enabled: !!session,
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive insights into school performance
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
                    <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.attendance.overall.toFixed(1)}%
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                    <span>Overall attendance</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Average Grades</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics?.grades.averagePercentage.toFixed(1)}%
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <span>Passing rate: {analytics?.grades.passingRate.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Homework</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.homework.totalAssigned}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <span>
                      {analytics?.homework.completionRate.toFixed(1)}% completion rate
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Exams</CardTitle>
                    <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.exams.totalConducted}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <span>{analytics?.exams.finalized} finalized</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics */}
            <Tabs defaultValue="attendance" className="space-y-4">
              <TabsList>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="grades">Grades</TabsTrigger>
                <TabsTrigger value="homework">Homework</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
              </TabsList>

              {/* Attendance Tab */}
              <TabsContent value="attendance" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Attendance by Grade</CardTitle>
                      <CardDescription>Average attendance rates per grade level</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analytics?.attendance.byGrade.map((item) => (
                        <div key={item.grade} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{item.grade}</span>
                            <span className="text-muted-foreground">{item.rate.toFixed(1)}%</span>
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

                  <Card>
                    <CardHeader>
                      <CardTitle>Attendance Trend</CardTitle>
                      <CardDescription>Daily attendance over selected period</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analytics?.attendance.trend.slice(-7).map((item, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{item.date}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.rate.toFixed(1)}%</span>
                              {item.rate >= 90 ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Grades Tab */}
              <TabsContent value="grades" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance by Subject</CardTitle>
                      <CardDescription>Average scores across subjects</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analytics?.grades.bySubject.map((item) => (
                        <div key={item.subject} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{item.subject}</span>
                            <span className="text-muted-foreground">
                              {item.average.toFixed(1)}%
                            </span>
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
                      <CardTitle>Grade Distribution</CardTitle>
                      <CardDescription>Student count by grade category</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analytics?.grades.distribution.map((item) => (
                        <div
                          key={item.grade}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary"
                        >
                          <Badge
                            variant={
                              item.grade === "A+" || item.grade === "A"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {item.grade}
                          </Badge>
                          <span className="font-medium">{item.count} students</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Homework Tab */}
              <TabsContent value="homework" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Homework Statistics</CardTitle>
                      <CardDescription>Overall homework metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Assigned</p>
                          <p className="text-2xl font-bold">{analytics?.homework.totalAssigned}</p>
                        </div>
                        <BookOpen className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                        <div>
                          <p className="text-sm text-muted-foreground">Completion Rate</p>
                          <p className="text-2xl font-bold">
                            {analytics?.homework.completionRate.toFixed(1)}%
                          </p>
                        </div>
                        <ClipboardCheck className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                        <div>
                          <p className="text-sm text-muted-foreground">On-Time Submission</p>
                          <p className="text-2xl font-bold">
                            {analytics?.homework.onTimeRate.toFixed(1)}%
                          </p>
                        </div>
                        <Calendar className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Completion by Subject</CardTitle>
                      <CardDescription>Homework completion rates per subject</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analytics?.homework.bySubject.map((item) => (
                        <div key={item.subject} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{item.subject}</span>
                            <span className="text-muted-foreground">
                              {item.completion.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${item.completion}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Students Tab */}
              <TabsContent value="students" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Student Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Total Students</p>
                        <p className="text-3xl font-bold">{analytics?.students.total}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Active Students</p>
                        <p className="text-3xl font-bold text-green-600">
                          {analytics?.students.active}
                        </p>
                      </div>
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Teachers</span>
                          <span className="font-bold">{analytics?.teachers.total}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-muted-foreground">Assignment Rate</span>
                          <span className="font-bold">
                            {analytics?.teachers.assignmentRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="col-span-2">
                    <CardHeader>
                      <CardTitle>Students by Grade</CardTitle>
                      <CardDescription>Distribution across grade levels</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {analytics?.students.byGrade.map((item) => (
                          <div
                            key={item.grade}
                            className="flex items-center justify-between p-4 rounded-lg bg-secondary"
                          >
                            <div>
                              <p className="text-sm text-muted-foreground">Grade {item.grade}</p>
                              <p className="text-2xl font-bold">{item.count}</p>
                            </div>
                            <Users className="h-8 w-8 text-primary" />
                          </div>
                        ))}
                      </div>
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
