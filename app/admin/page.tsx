"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Calendar,
  LogOut,
  School,
  UserCheck,
  ClipboardList
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) return null;

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/signin");
  };

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
    { title: "Attendance", href: "/admin/attendance", icon: UserCheck, description: "View attendance reports" },
    { title: "Announcements", href: "/admin/announcements", icon: Calendar, description: "School-wide announcements" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <School className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Portal</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Smart School Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{session.user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">Admin</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Link key={action.title} href={action.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <action.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{action.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{action.description}</p>
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
          <Card>
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
                    <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                      <ClipboardList className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.action}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.detail}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Key metrics and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Attendance Rate</span>
                    <span className="text-sm font-bold">94.5%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '94.5%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Fee Collection</span>
                    <span className="text-sm font-bold">87.3%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '87.3%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Homework Completion</span>
                    <span className="text-sm font-bold">82.1%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '82.1%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Teacher Assignments</span>
                    <span className="text-sm font-bold">100%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
