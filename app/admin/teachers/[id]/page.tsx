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
  GraduationCap,
  Calendar,
  BookOpen,
  Users,
} from "lucide-react";
import {
  getTeacherById,
  getTeacherLeaveStats,
  type Teacher,
  type TeacherLeaveStats,
} from "@/actions/admin";

export default function TeacherDetailPage() {
  const params = useParams();
  const teacherId = params.id as string;

  const { data: teacher, isLoading } = useQuery<Teacher>({
    queryKey: ["teacher", teacherId],
    queryFn: async () => {
      return await getTeacherById(teacherId);
    },
  });

  const { data: leaveStats } = useQuery<TeacherLeaveStats>({
    queryKey: ["teacher-leaves", teacherId],
    queryFn: async () => {
      return await getTeacherLeaveStats(teacherId);
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Teacher Details" description="Admin Portal">
        <div className="text-center py-12">Loading teacher details...</div>
      </DashboardLayout>
    );
  }

  if (!teacher) {
    return (
      <DashboardLayout title="Teacher Details" description="Admin Portal">
        <div className="text-center py-12">Teacher not found</div>
      </DashboardLayout>
    );
  }

  const primaryClassroom = teacher.teacherAssignments?.find((a) => a.isPrimary);

  return (
    <DashboardLayout title="Teacher Details" description="Admin Portal">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/teachers">
              <Button variant="ghost" size="sm" className="rounded-xl">
                ← Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{teacher.name}</h1>
              {primaryClassroom && (
                <p className="text-muted-foreground">
                  Class Teacher of {primaryClassroom.classroom.name}
                </p>
              )}
            </div>
          </div>
          <Badge variant={teacher.isActive ? "default" : "secondary"}>
            {teacher.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList>
            <TabsTrigger value="basic">
              <User className="h-4 w-4 mr-2" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="classes">
              <GraduationCap className="h-4 w-4 mr-2" />
              Classes & Assignments
            </TabsTrigger>
            <TabsTrigger value="leaves">
              <Calendar className="h-4 w-4 mr-2" />
              Leaves
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{teacher.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{teacher.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">
                        {teacher.phone || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">
                        {teacher.address || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="space-y-4">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Classroom Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                {teacher.teacherAssignments && teacher.teacherAssignments.length > 0 ? (
                  <div className="space-y-2">
                    {teacher.teacherAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            {assignment.isPrimary ? (
                              <Users className="h-5 w-5 text-primary" />
                            ) : (
                              <BookOpen className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {assignment.classroom.name}
                              </p>
                              {assignment.isPrimary && (
                                <Badge variant="default">Class Teacher</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Grade {assignment.classroom.grade} - Section{" "}
                              {assignment.classroom.section}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">
                            {assignment.subject.name}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {assignment.subject.code}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No classroom assignments
                  </p>
                )}
              </CardContent>
            </Card>

            {primaryClassroom && (
              <Card className="rounded-2xl border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Primary Class
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-primary/5 rounded-xl">
                    <p className="text-sm text-muted-foreground mb-1">
                      Class Teacher of
                    </p>
                    <p className="text-2xl font-bold">
                      {primaryClassroom.classroom.name}
                    </p>
                    <p className="text-muted-foreground">
                      Grade {primaryClassroom.classroom.grade} - Section{" "}
                      {primaryClassroom.classroom.section}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="leaves" className="space-y-4">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Leave Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {leaveStats ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {leaveStats.totalLeaves}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total Leaves
                        </p>
                      </div>
                      <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {leaveStats.sickLeaves}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Sick Leaves
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {leaveStats.casualLeaves}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Casual Leaves
                        </p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {leaveStats.earnedLeaves}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Earned Leaves
                        </p>
                      </div>
                    </div>
                    {leaveStats.pendingLeaves > 0 && (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                        <p className="text-sm text-muted-foreground">
                          Pending Leave Requests
                        </p>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                          {leaveStats.pendingLeaves}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No leave data available
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
