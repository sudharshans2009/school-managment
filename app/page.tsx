import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap,
  BookOpen,
  Users,
  LayoutDashboard,
  UserCog,
  Presentation,
} from "lucide-react";
import { HomeLayout } from "@/components/layouts/home-layout";

export default function Home() {
  return (
    <HomeLayout>
      <div className="container mx-auto px-6 py-16">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8">
          {/* Logo/Icon */}
          <div className="flex items-center justify-center w-20 h-20 bg-primary rounded-2xl shadow-lg">
            <GraduationCap className="w-12 h-12 text-primary-foreground" />
          </div>

          {/* Hero Section */}
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
              Amrita Vidyalayam Management System
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Modern, efficient, and intelligent school management with
              real-time classroom dashboards, attendance tracking, fee
              management, and more.
            </p>
          </div>

          {/* Login Options */}
          <div className="pt-8 w-full max-w-4xl">
            <h2 className="text-2xl font-semibold mb-6">Select Your Portal</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Admin Portal */}
              <Link href="/auth/signin?role=admin" className="block">
                <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 hover:border-primary">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                      <UserCog className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Admin</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage school, users, and settings
                    </p>
                  </CardContent>
                </Card>
              </Link>

              {/* Teacher Portal */}
              <Link href="/auth/signin?role=teacher" className="block">
                <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 hover:border-primary">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Teacher</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage classes and assignments
                    </p>
                  </CardContent>
                </Card>
              </Link>

              {/* Student Portal */}
              <Link href="/auth/signin?role=student" className="block">
                <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 hover:border-primary">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Student</h3>
                    <p className="text-sm text-muted-foreground">
                      View homework and timetable
                    </p>
                  </CardContent>
                </Card>
              </Link>

              {/* Smartboard */}
              <Link href="/smartboard/login" className="block">
                <Card className="rounded-2xl shadow-sm hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 hover:border-primary">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-4">
                      <Presentation className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Smartboard</h3>
                    <p className="text-sm text-muted-foreground">
                      Classroom display dashboard
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Divider */}
          {/* <div className="flex items-center gap-4 w-full max-w-4xl pt-8">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-sm text-muted-foreground">Or</span>
            <div className="flex-1 h-px bg-border"></div>
          </div> */}

          {/* General Auth Buttons */}
          {/* <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/auth/signin">
              <Button
                size="lg"
                className="w-full sm:w-auto text-lg px-8 py-6 rounded-2xl shadow-sm"
              >
                <LayoutDashboard className="mr-2 h-5 w-5" />
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-lg px-8 py-6 rounded-2xl shadow-sm"
              >
                <Users className="mr-2 h-5 w-5" />
                Create Account
              </Button>
            </Link>
          </div> */}

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 max-w-4xl w-full">
            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 mx-auto bg-primary/10 flex items-center justify-center mb-4">
                  <LayoutDashboard className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Smart Dashboards</h3>
                <p className="text-muted-foreground text-sm">
                  Real-time classroom displays with schedules, announcements,
                  and attendance charts
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 mx-auto bg-primary/10 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Homework Management
                </h3>
                <p className="text-muted-foreground text-sm">
                  Create, submit, and grade assignments with file attachments
                  and feedback
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 mx-auto bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Complete Management
                </h3>
                <p className="text-muted-foreground text-sm">
                  Attendance tracking, fee management, timetables, and
                  comprehensive reporting
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="pt-16 space-y-4 text-sm text-muted-foreground">
            <p>
              Built with Next.js, Drizzle ORM, Better Auth, and TanStack Query
            </p>
            <p>
              <Link
                href="/downloads"
                className="text-primary hover:underline font-medium"
              >
                Download Native Apps for Windows & Android
              </Link>
            </p>
          </div>
        </div>
      </div>
    </HomeLayout>
  );
}
