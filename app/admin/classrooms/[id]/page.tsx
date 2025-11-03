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
  Users,
  BookOpen,
  Settings,
  Calendar,
  User,
  Mail,
  Hash,
  GraduationCap,
} from "lucide-react";

interface Classroom {
  id: string;
  name: string;
  grade: string;
  section: string;
  classroomCode: string;
  classroomKey: string;
  capacity: number;
  currentStrength: number;
  academicYear: string;
  teacherAssignments: Array<{
    id: string;
    isPrimary: boolean;
    teacher: { id: string; name: string; email: string };
    subject: { id: string; name: string; code: string };
  }>;
  students: Array<{
    id: string;
    rollNumber: string;
    user: { id: string; name: string; email: string };
  }>;
}

export default function ClassroomDetailPage() {
  const params = useParams();
  const classroomId = params.id as string;

  const { data: classroom, isLoading } = useQuery<Classroom>({
    queryKey: ["classroom", classroomId],
    queryFn: async () => {
      const response = await fetch(`/api/classrooms/${classroomId}`);
      if (!response.ok) throw new Error("Failed to fetch classroom");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Classroom Details" description="Admin Portal">
        <div className="text-center py-12">Loading classroom details...</div>
      </DashboardLayout>
    );
  }

  if (!classroom) {
    return (
      <DashboardLayout title="Classroom Details" description="Admin Portal">
        <div className="text-center py-12">Classroom not found</div>
      </DashboardLayout>
    );
  }

  const primaryTeacher = classroom.teacherAssignments.find((a) => a.isPrimary);

  return (
    <DashboardLayout title="Classroom Details" description="Admin Portal">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/classrooms">
              <Button variant="ghost" size="sm" className="rounded-xl">
                ← Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{classroom.name}</h1>
              <p className="text-muted-foreground">
                Grade {classroom.grade} - Section {classroom.section}
              </p>
            </div>
          </div>
          <Link href={`/admin/classrooms/${classroomId}/edit`}>
            <Button className="rounded-xl">
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              <Settings className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="students">
              <Users className="h-4 w-4 mr-2" />
              Students
            </TabsTrigger>
            <TabsTrigger value="teachers">
              <GraduationCap className="h-4 w-4 mr-2" />
              Teachers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {classroom.currentStrength}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    of {classroom.capacity} capacity
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Assigned Teachers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {classroom.teacherAssignments.length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    teaching this class
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Academic Year
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {classroom.academicYear}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Classroom Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Classroom Code
                      </p>
                      <p className="font-mono font-medium">
                        {classroom.classroomCode}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Grade</p>
                      <p className="font-medium">{classroom.grade}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Section</p>
                      <p className="font-medium">{classroom.section}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {primaryTeacher && (
              <Card className="rounded-2xl border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Class Teacher
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-primary/5 rounded-xl">
                    <p className="text-lg font-semibold">
                      {primaryTeacher.teacher.name}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Mail className="h-4 w-4" />
                      {primaryTeacher.teacher.email}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Student List ({classroom.students.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {classroom.students.length > 0 ? (
                  <div className="space-y-2">
                    {classroom.students
                      .sort((a, b) =>
                        a.rollNumber.localeCompare(b.rollNumber)
                      )
                      .map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {student.user.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {student.user.email}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">{student.rollNumber}</Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No students enrolled
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teachers" className="space-y-4">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>
                  Teacher Assignments ({classroom.teacherAssignments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {classroom.teacherAssignments.length > 0 ? (
                  <div className="space-y-3">
                    {classroom.teacherAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <GraduationCap className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {assignment.teacher.name}
                              </p>
                              {assignment.isPrimary && (
                                <Badge variant="default">Class Teacher</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {assignment.teacher.email}
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
                    No teachers assigned
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
