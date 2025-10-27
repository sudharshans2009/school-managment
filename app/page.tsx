import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Users, LayoutDashboard } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <main className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8">
          {/* Logo/Icon */}
          <div className="flex items-center justify-center w-20 h-20 bg-primary rounded-2xl shadow-lg">
            <GraduationCap className="w-12 h-12 text-white" />
          </div>

          {/* Hero Section */}
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              Smart School Management System
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Modern, efficient, and intelligent school management with real-time classroom dashboards, 
              attendance tracking, fee management, and more.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/auth/signin">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                <LayoutDashboard className="mr-2 h-5 w-5" />
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6">
                <Users className="mr-2 h-5 w-5" />
                Create Account
              </Button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 max-w-4xl w-full">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <LayoutDashboard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Smart Dashboards
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Real-time classroom displays with schedules, announcements, and attendance charts
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Homework Management
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Create, submit, and grade assignments with file attachments and feedback
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Complete Management
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Attendance tracking, fee management, timetables, and comprehensive reporting
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-16 text-sm text-gray-500 dark:text-gray-400">
            <p>Built with Next.js, Drizzle ORM, Better Auth, and TanStack Query</p>
          </div>
        </div>
      </main>
    </div>
  );
}
