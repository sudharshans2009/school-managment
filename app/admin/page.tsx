"use client";

import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Calendar,
  School,
  UserCheck,
  ClipboardList,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

export default function AdminDashboard() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/signin");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  const stats = [
    { title: "Total Students", value: "1,234", icon: Users, color: "text-blue-600", bgColor: "bg-blue-100" },
    { title: "Total Teachers", value: "87", icon: GraduationCap, color: "text-green-600", bgColor: "bg-green-100" },
    { title: "Active Classrooms", value: "42", icon: School, color: "text-purple-600", bgColor: "bg-purple-100" },
    { title: "Attendance Rate", value: "94.5%", icon: UserCheck, color: "text-orange-600", bgColor: "bg-orange-100" },
  ];

  const quickActions = [
    { title: "Manage Classrooms", href: "/admin/classrooms", icon: School, description: "Create and manage classrooms" },
    { title: "Manage Students", href: "/admin/students", icon: Users, description: "Enroll and manage students" },
    { title: "Manage Teachers", href: "/admin/teachers", icon: GraduationCap, description: "Assign teachers to classes" },
    { title: "Manage Subjects", href: "/admin/subjects", icon: BookOpen, description: "Add and edit subjects" },
    { title: "Calendar & Holidays", href: "/admin/calendar", icon: Calendar, description: "Manage working days and timetables" },
    { title: "Attendance Records", href: "/admin/attendance", icon: UserCheck, description: "View and mark attendance" },
    { title: "Announcements", href: "/admin/announcements", icon: ClipboardList, description: "Create and manage announcements" },
  ];

  return (
    <DashboardLayout title="Admin Portal" description="Smart School Management">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="rounded-2xl shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-xl`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
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
                  <Card className="rounded-xl shadow-sm hover:shadow-md transition-all hover:border-primary cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="bg-primary/10 p-2 rounded-xl">
                          <action.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{action.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
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
              <CardDescription>Latest updates across the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: "New student enrolled", detail: "John Doe - Grade 10A", time: "5 minutes ago" },
                  { action: "Homework assigned", detail: "Mathematics - Class 9B", time: "1 hour ago" },
                  { action: "Fee payment received", detail: "Jane Smith - ₹15,000", time: "2 hours ago" },
                  { action: "Teacher assigned", detail: "Dr. Kumar - Science Class", time: "3 hours ago" },
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-3 pb-3 border-b last:border-0">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <ClipboardList className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.action}</p>
                      <p className="text-sm text-muted-foreground">{item.detail}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Key metrics and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: "Attendance Rate", value: 94.5, color: "bg-green-500" },
                  { label: "Fee Collection", value: 87.3, color: "bg-blue-500" },
                  { label: "Homework Completion", value: 82.1, color: "bg-purple-500" },
                  { label: "Teacher Assignments", value: 100, color: "bg-orange-500" },
                ].map((metric) => (
                  <div key={metric.label}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">{metric.label}</span>
                      <span className="text-sm font-bold">{metric.value}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className={`${metric.color} h-2 rounded-full transition-all`} style={{ width: `${metric.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
