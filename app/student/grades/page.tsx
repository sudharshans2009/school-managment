"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";

interface Grade {
  id: string;
  marksObtained: string;
  grade: string;
  percentage: string;
  remarks?: string;
  isAbsent: boolean;
  uploadedAt: string;
  exam: {
    id: string;
    name: string;
    examType: string;
    examDate: string;
    totalMarks: number;
    passingMarks?: number;
    academicYear: string;
    term?: string;
  };
  subject: {
    id: string;
    name: string;
    code: string;
  };
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

export default function StudentGradesPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();

  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterExamType, setFilterExamType] = useState<string>("all");

  // Fetch student grades (finalized only)
  const { data: grades, isLoading: gradesLoading } = useQuery<Grade[]>({
    queryKey: ["student-grades", filterSubject, filterExamType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterSubject && filterSubject !== "all")
        params.append("subjectId", filterSubject);
      if (filterExamType && filterExamType !== "all")
        params.append("examType", filterExamType);

      const response = await fetch(`/api/students/grades?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch grades");
      return response.json();
    },
    enabled: !!session?.user,
  });

  // Get unique subjects from grades
  const subjects =
    grades?.reduce((acc, grade) => {
      if (!acc.find((s) => s.id === grade.subject.id)) {
        acc.push(grade.subject);
      }
      return acc;
    }, [] as Subject[]) || [];

  // Calculate statistics
  const stats = {
    totalExams: grades?.length || 0,
    averagePercentage:
      grades && grades.length > 0
        ? (
            grades.reduce(
              (sum, g) => sum + (g.isAbsent ? 0 : parseFloat(g.percentage)),
              0,
            ) / grades.filter((g) => !g.isAbsent).length
          ).toFixed(2)
        : "0",
    passedExams:
      grades?.filter((g) => {
        if (g.isAbsent) return false;
        const passingMarks = g.exam.passingMarks || g.exam.totalMarks * 0.4;
        return parseFloat(g.marksObtained) >= passingMarks;
      }).length || 0,
    absentExams: grades?.filter((g) => g.isAbsent).length || 0,
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

  const getExamTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      class_test: "Class Test",
      unit_test: "Unit Test",
      quarterly: "Quarterly",
      midterm: "Midterm",
      final_exam: "Final Exam",
    };
    return labels[type] || type;
  };

  const getGradeBadgeVariant = (grade: string) => {
    if (grade === "A*" || grade === "A") return "default";
    if (grade === "B") return "secondary";
    if (grade === "C" || grade === "D") return "outline";
    return "destructive"; // E and F
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">My Grades</h1>
          <p className="text-muted-foreground mt-1">
            View your test scores and performance
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Exams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalExams}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Percentage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averagePercentage}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Passed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-green-600">
                  {stats.passedExams}
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Absent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-red-600">
                  {stats.absentExams}
                </div>
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="filterSubject">Filter by Subject</Label>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name} ({subject.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filterExamType">Filter by Exam Type</Label>
                <Select
                  value={filterExamType}
                  onValueChange={setFilterExamType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="class_test">Class Test</SelectItem>
                    <SelectItem value="unit_test">Unit Test</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="midterm">Midterm</SelectItem>
                    <SelectItem value="final_exam">Final Exam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grade Legend */}
        <Card>
          <CardHeader>
            <CardTitle>Grading System</CardTitle>
            <CardDescription>Understanding your grades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="flex flex-col items-center p-3 bg-primary/10 rounded-lg">
                <Badge variant="default" className="mb-2">
                  A*
                </Badge>
                <span className="text-xs font-medium">Outstanding</span>
                <span className="text-xs text-muted-foreground">90-100%</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-primary/10 rounded-lg">
                <Badge variant="default" className="mb-2">
                  A
                </Badge>
                <span className="text-xs font-medium">Excellent</span>
                <span className="text-xs text-muted-foreground">80-89%</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-secondary/50 rounded-lg">
                <Badge variant="secondary" className="mb-2">
                  B
                </Badge>
                <span className="text-xs font-medium">Good</span>
                <span className="text-xs text-muted-foreground">70-79%</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-secondary/30 rounded-lg">
                <Badge variant="outline" className="mb-2">
                  C
                </Badge>
                <span className="text-xs font-medium">Satisfactory</span>
                <span className="text-xs text-muted-foreground">60-69%</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-secondary/30 rounded-lg">
                <Badge variant="outline" className="mb-2">
                  D
                </Badge>
                <span className="text-xs font-medium">Pass</span>
                <span className="text-xs text-muted-foreground">50-59%</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-destructive/10 rounded-lg">
                <Badge variant="destructive" className="mb-2">
                  E
                </Badge>
                <span className="text-xs font-medium">Marginal Pass</span>
                <span className="text-xs text-muted-foreground">40-49%</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-destructive/10 rounded-lg">
                <Badge variant="destructive" className="mb-2">
                  F
                </Badge>
                <span className="text-xs font-medium">Fail</span>
                <span className="text-xs text-muted-foreground">&lt;40%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grades Table */}
        <Card>
          <CardHeader>
            <CardTitle>Exam Results</CardTitle>
            <CardDescription>
              All finalized exam results (only finalized exams are visible)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {gradesLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : grades && grades.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">
                        {grade.exam.name}
                      </TableCell>
                      <TableCell>
                        {grade.subject.name}
                        <span className="text-muted-foreground ml-1">
                          ({grade.subject.code})
                        </span>
                      </TableCell>
                      <TableCell>
                        {getExamTypeLabel(grade.exam.examType)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(grade.exam.examDate), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        {grade.isAbsent ? (
                          <span className="text-muted-foreground">N/A</span>
                        ) : (
                          <span className="font-medium">
                            {grade.marksObtained} / {grade.exam.totalMarks}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {grade.isAbsent ? (
                          <span className="text-muted-foreground">N/A</span>
                        ) : (
                          <Badge variant={getGradeBadgeVariant(grade.grade)}>
                            {grade.grade}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {grade.isAbsent ? (
                          <span className="text-muted-foreground">N/A</span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">
                              {grade.percentage}%
                            </span>
                            {parseFloat(grade.percentage) >= 75 ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : parseFloat(grade.percentage) < 40 ? (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            ) : null}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {grade.isAbsent ? (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Absent
                          </Badge>
                        ) : (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Graded
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No grades available yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Grades will appear here once your exams are finalized
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
