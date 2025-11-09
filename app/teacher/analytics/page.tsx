"use client";

import { useSession } from "@/lib/auth/client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Users,
  BookOpen,
  Award,
  UserCheck,
  BarChart,
  Calendar,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { TeacherHeader } from "@/components/teacher/teacher-header";
import {
  getTeacherAnalytics,
  type TeacherAnalytics,
  getTeacherTimetable,
  type TeacherTimetableEntry,
} from "@/actions/teacher";

export default function TeacherAnalyticsPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const [timeRange, setTimeRange] = useState("30");

  const { data: analytics, isLoading } = useQuery<TeacherAnalytics>({
    queryKey: ["teacher-analytics", session?.user?.id, timeRange],
    queryFn: async () => {
      if (!session?.user?.id) {
        return {
          totalClasses: 0,
          totalStudents: 0,
          homeworkAssigned: 0,
          examsScheduled: 0,
          leavesTaken: 0,
          substituteDuties: 0,
          attendanceRate: 0,
          recentActivity: [],
        };
      }
      return await getTeacherAnalytics(session.user.id);
    },
    enabled: !!session?.user?.id,
  });

  const { data: timetable, isLoading: timetableLoading } = useQuery<
    TeacherTimetableEntry[]
  >({
    queryKey: ["teacher-timetable", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      return await getTeacherTimetable(session.user.id);
    },
    enabled: !!session?.user?.id,
  });

  const getDayName = (day: number) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[day];
  };

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
      <div className="space-y-6">
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
          isPrimaryTeacher={false}
        />

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="analytics" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="timetable">Timetable</TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="space-y-6">
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
                    {analytics?.totalClasses || 0}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <span>{analytics?.totalStudents || 0} students</span>
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
                    {analytics?.attendanceRate.toFixed(1) || 0}%
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <span>Average rate</span>
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
                    {analytics?.homeworkAssigned || 0}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <span>Total assigned</span>
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
                    {analytics?.examsScheduled || 0}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <span>Scheduled</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest teaching activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
                    analytics.recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 p-3 rounded-lg bg-secondary/50"
                      >
                        <div className="shrink-0">
                          {activity.type === "homework" ? (
                            <BookOpen className="h-5 w-5 text-blue-500" />
                          ) : (
                            <Award className="h-5 w-5 text-purple-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(activity.date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {activity.type}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      No recent activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Leaves</CardTitle>
                  <CardDescription>Approved leave requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {analytics?.leavesTaken || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Substitute Duties</CardTitle>
                  <CardDescription>Classes covered for others</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {analytics?.substituteDuties || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Attendance Rate</CardTitle>
                  <CardDescription>Overall performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {analytics?.attendanceRate.toFixed(1) || 0}%
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Timetable Tab */}
          <TabsContent value="timetable">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Weekly Timetable</CardTitle>
                <CardDescription>
                  Your teaching schedule across all classes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timetableLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {[1, 2, 3, 4, 5].map((day) => {
                      const dayEntries =
                        timetable?.filter((entry) => entry.dayOfWeek === day) ||
                        [];
                      if (dayEntries.length === 0) return null;

                      return (
                        <div key={day} className="space-y-2">
                          <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                            {getDayName(day)}
                          </h3>
                          <div className="overflow-x-auto rounded-lg border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs sm:text-sm">
                                    Time
                                  </TableHead>
                                  <TableHead className="text-xs sm:text-sm">
                                    Subject
                                  </TableHead>
                                  <TableHead className="text-xs sm:text-sm">
                                    Class
                                  </TableHead>
                                  <TableHead className="text-xs sm:text-sm">
                                    Room
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {dayEntries.map((entry) => (
                                  <TableRow key={entry.id}>
                                    <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">
                                      {entry.startTime} - {entry.endTime}
                                    </TableCell>
                                    <TableCell className="text-xs sm:text-sm">
                                      {entry.subjectName}
                                    </TableCell>
                                    <TableCell className="text-xs sm:text-sm">
                                      {entry.classroomName}
                                    </TableCell>
                                    <TableCell className="text-xs sm:text-sm">
                                      {entry.room || "TBA"}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      );
                    })}
                    {(!timetable || timetable.length === 0) && (
                      <div className="text-center py-12">
                        <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          Timetable not available yet
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
