"use client";

import { useRoleRedirect } from "@/hooks/use-role-redirect";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  BookOpen,
  GraduationCap,
  Calendar,
  School,
  UserCheck,
  ClipboardList,
  Loader2,
  FileText,
  UserPlus,
  ClipboardCheck,
  DollarSign,
  BookMarked,
  Award,
  BarChart3,
  History,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { session, isPending } = useRoleRedirect(["admin"]);

  // Fetch dashboard stats
  const { data: statsResult, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { getAdminStats } = await import("@/actions/admin");
      return await getAdminStats();
    },
    enabled: !!session,
  });

  const stats = statsResult?.success ? statsResult.data : null;

  // Fetch recent activity
  const { data: activityResult, isLoading: activityLoading } = useQuery({
    queryKey: ["admin-activity"],
    queryFn: async () => {
      const { getRecentActivity } = await import("@/actions/admin");
      return await getRecentActivity();
    },
    enabled: !!session,
  });

  const recentActivity = activityResult?.success ? activityResult.data : [];

  // Fetch system metrics
  const { data: metricsResult, isLoading: metricsLoading } = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      const { getAdminMetrics } = await import("@/actions/admin");
      return await getAdminMetrics();
    },
    enabled: !!session,
  });

  const metrics = metricsResult?.success ? metricsResult.data : null;

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  const statsCards = [
    {
      title: "Total Students",
      value: statsLoading
        ? "..."
        : stats?.totalStudents.toLocaleString() || "0",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Teachers",
      value: statsLoading
        ? "..."
        : stats?.totalTeachers.toLocaleString() || "0",
      icon: GraduationCap,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Active Classrooms",
      value: statsLoading
        ? "..."
        : stats?.activeClassrooms.toLocaleString() || "0",
      icon: School,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Attendance Rate",
      value: statsLoading
        ? "..."
        : `${stats?.attendanceRate.toFixed(1) || 0}%` || "0%",
      icon: UserCheck,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  const quickActions = [
    {
      title: "Manage Classrooms",
      href: "/admin/classrooms",
      icon: School,
      description: "Create and manage classrooms",
    },
    {
      title: "Manage Students",
      href: "/admin/students",
      icon: Users,
      description: "Enroll and manage students",
    },
    {
      title: "Manage Teachers",
      href: "/admin/teachers",
      icon: GraduationCap,
      description: "Assign teachers to classes",
    },
    {
      title: "Manage Admins",
      href: "/admin/admins",
      icon: UserCog,
      description: "Manage system administrators",
    },
    {
      title: "Manage Admissions",
      href: "/admin/admissions",
      icon: UserPlus,
      description: "Review and process admission applications",
    },
    {
      title: "Manage Subjects",
      href: "/admin/subjects",
      icon: BookOpen,
      description: "Add and edit subjects",
    },
    {
      title: "Manage Exams",
      href: "/admin/exams",
      icon: Award,
      description: "Create exams and manage grades",
    },
    {
      title: "Analytics Dashboard",
      href: "/admin/analytics",
      icon: BarChart3,
      description: "View school performance metrics",
    },
    {
      title: "Calendar & Holidays",
      href: "/admin/calendar",
      icon: Calendar,
      description: "Manage working days and timetables",
    },
    {
      title: "Attendance Records",
      href: "/admin/attendance",
      icon: UserCheck,
      description: "View and mark attendance",
    },
    {
      title: "Announcements",
      href: "/admin/announcements",
      icon: ClipboardList,
      description: "Create and manage announcements",
    },
    {
      title: "Manage Leaves",
      href: "/admin/leaves",
      icon: FileText,
      description: "Approve and manage teacher leaves",
    },
    {
      title: "Manage Substitutes",
      href: "/admin/substitutes",
      icon: UserPlus,
      description: "Assign substitute teachers",
    },
    {
      title: "View Work Done",
      href: "/admin/work-done",
      icon: ClipboardCheck,
      description: "View all work done records",
    },
    {
      title: "Audit History",
      href: "/admin/audit-logs",
      icon: History,
      description: "View system audit logs and security events",
    },
  ];

  const systemMetrics = [
    {
      label: "Attendance Rate",
      value: metrics?.attendanceRate || 0,
      color: "bg-green-500",
      icon: UserCheck,
    },
    {
      label: "Fee Collection",
      value: metrics?.feeCollectionRate || 0,
      color: "bg-blue-500",
      icon: DollarSign,
    },
    {
      label: "Homework Completion",
      value: metrics?.homeworkCompletionRate || 0,
      color: "bg-purple-500",
      icon: BookMarked,
    },
    {
      label: "Teacher Assignments",
      value: metrics?.teacherAssignmentRate || 0,
      color: "bg-orange-500",
      icon: GraduationCap,
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "student":
        return Users;
      case "homework":
        return BookOpen;
      case "fee":
        return DollarSign;
      case "teacher":
        return GraduationCap;
      case "leave":
        return FileText;
      case "substitute":
        return UserPlus;
      default:
        return ClipboardList;
    }
  };

  return (
    <DashboardLayout
      title="Admin Portal"
      description="Amrita Vidyalayam Management"
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat) => (
            <Card key={stat.title} className="rounded-2xl shadow-sm">
              <CardContent className="p-6">
                {statsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-xl`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Link key={action.title} href={action.href}>
                  <Card className="shadow-sm hover:shadow-md transition-all hover:border-primary cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="bg-primary/10 p-2 rounded-xl">
                          <action.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{action.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates across the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((item) => {
                    const Icon = getActivityIcon(item.type);
                    return (
                      <div
                        key={item.id}
                        className="flex items-start space-x-3 pb-3 border-b last:border-0"
                      >
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.action}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.detail}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recent activity
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Key metrics and performance</CardDescription>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {systemMetrics.map((metric) => (
                    <div key={metric.label}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <metric.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {metric.label}
                          </span>
                        </div>
                        <span className="text-sm font-bold">
                          {metric.value.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className={`${metric.color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${metric.value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
