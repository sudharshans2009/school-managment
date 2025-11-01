"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { TeacherQuickActions } from "@/components/teacher-quick-actions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, CheckCircle, XCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Exam {
  id: string;
  name: string;
  examType: string;
  examDate: string;
  totalMarks: number;
  passingMarks?: number;
  isFinalized: boolean;
  academicYear: string;
  term?: string;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  classroom: {
    id: string;
    name: string;
    grade: string;
    section: string;
  };
}

interface Student {
  id: string;
  userId: string;
  rollNumber: string;
  admissionNumber: string;
  user: {
    name: string;
  };
}

interface GradeInput {
  studentId: string;
  marksObtained: string;
  grade: string;
  remarks: string;
  isAbsent: boolean;
}

export default function TeacherExamsPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedExam, setSelectedExam] = useState<string>("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [gradeInputs, setGradeInputs] = useState<Record<string, GradeInput>>({});

  // Fetch teacher's exams (from their assigned classes/subjects)
  const { data: exams } = useQuery<Exam[]>({
    queryKey: ["teacher-exams", session?.user?.id],
    queryFn: async () => {
      const response = await fetch("/api/exams");
      if (!response.ok) throw new Error("Failed to fetch exams");
      const allExams = await response.json();
      
      // Filter for non-finalized exams only (teachers can only upload to draft exams)
      return allExams.filter((exam: Exam) => !exam.isFinalized);
    },
    enabled: !!session?.user?.id,
  });

  // Fetch students for selected exam
  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["exam-students", selectedExam],
    queryFn: async () => {
      if (!selectedExam) return [];
      
      const examData = exams?.find((e) => e.id === selectedExam);
      if (!examData) return [];

      const response = await fetch(`/api/students?classroomId=${examData.classroom.id}`);
      if (!response.ok) throw new Error("Failed to fetch students");
      return response.json();
    },
    enabled: !!selectedExam && !!exams,
  });

  // Fetch existing grades for selected exam
  const { data: existingGrades } = useQuery({
    queryKey: ["exam-grades", selectedExam],
    queryFn: async () => {
      if (!selectedExam) return [];
      
      const response = await fetch(`/api/exams/${selectedExam}/grades`);
      if (!response.ok) throw new Error("Failed to fetch grades");
      return response.json();
    },
    enabled: !!selectedExam,
  });

  // Upload grades mutation
  const uploadGradesMutation = useMutation({
    mutationFn: async (grades: GradeInput[]) => {
      const response = await fetch(`/api/exams/${selectedExam}/grades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grades }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload grades");
      }

      return response.json();
    },
    onSuccess: (data) => {
      const { success, errors } = data;
      
      if (errors.length > 0) {
        toast.error(`Failed to upload ${errors.length} grade(s). Check the details.`);
        console.error("Upload errors:", errors);
      }
      
      if (success.length > 0) {
        toast.success(`Successfully uploaded ${success.length} grade(s)`);
      }

      queryClient.invalidateQueries({ queryKey: ["exam-grades", selectedExam] });
      setIsUploadDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleGradeChange = (studentId: string, field: keyof GradeInput, value: string | boolean) => {
    setGradeInputs((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        studentId,
        [field]: value,
      },
    }));
  };

  const calculateGrade = (marks: number, totalMarks: number): string => {
    const percentage = (marks / totalMarks) * 100;
    
    if (percentage >= 90) return "A*";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    if (percentage >= 40) return "E";
    return "F";
  };

  const handleMarksChange = (studentId: string, marks: string) => {
    handleGradeChange(studentId, "marksObtained", marks);
    
    if (marks && selectedExam) {
      const examData = exams?.find((e) => e.id === selectedExam);
      if (examData) {
        const calculatedGrade = calculateGrade(parseFloat(marks), examData.totalMarks);
        handleGradeChange(studentId, "grade", calculatedGrade);
      }
    }
  };

  const handleSubmitGrades = () => {
    const grades = Object.values(gradeInputs).filter(
      (g) => g.isAbsent || (g.marksObtained && g.marksObtained.trim() !== "")
    );

    if (grades.length === 0) {
      toast.error("Please enter grades for at least one student");
      return;
    }

    uploadGradesMutation.mutate(grades);
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

  const selectedExamData = exams?.find((e) => e.id === selectedExam);

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
        <TeacherQuickActions
          currentPage="exams"
          unreadMessages={0}
          isPrimaryTeacher={false}
        />

        <div>
          <h1 className="text-3xl font-bold">Exam Grade Upload</h1>
          <p className="text-muted-foreground mt-1">
            Upload test grades for your assigned classes
          </p>
        </div>

        {/* Exam Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Exam</CardTitle>
            <CardDescription>Choose an exam to upload grades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="examSelect">Exam</Label>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams?.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.name} - {exam.classroom.name} ({exam.subject.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedExamData && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{selectedExamData.name}</h3>
                    <Badge variant={selectedExamData.isFinalized ? "default" : "secondary"}>
                      {selectedExamData.isFinalized ? "Finalized" : "Draft"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium">{getExamTypeLabel(selectedExamData.examType)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">
                        {format(new Date(selectedExamData.examDate), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Marks</p>
                      <p className="font-medium">{selectedExamData.totalMarks}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Passing Marks</p>
                      <p className="font-medium">{selectedExamData.passingMarks || "N/A"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Students and Grades */}
        {selectedExam && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Student Grades</CardTitle>
                  <CardDescription>
                    Enter grades for all students in this exam
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsUploadDialogOpen(true)}
                  disabled={!students || students.length === 0 || selectedExamData?.isFinalized}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Grades
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : students && students.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No.</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Admission No.</TableHead>
                      <TableHead>Marks Obtained</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const existingGrade = existingGrades?.find(
                        (g: { student?: { id: string } }) => g.student?.id === student.id
                      );
                      
                      return (
                        <TableRow key={student.id}>
                          <TableCell>{student.rollNumber}</TableCell>
                          <TableCell className="font-medium">{student.user?.name}</TableCell>
                          <TableCell>{student.admissionNumber}</TableCell>
                          <TableCell>
                            {existingGrade ? existingGrade.marksObtained : "-"}
                          </TableCell>
                          <TableCell>
                            {existingGrade ? (
                              <Badge>{existingGrade.grade}</Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {existingGrade ? `${existingGrade.percentage}%` : "-"}
                          </TableCell>
                          <TableCell>
                            {existingGrade ? (
                              existingGrade.isAbsent ? (
                                <Badge variant="destructive">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Absent
                                </Badge>
                              ) : (
                                <Badge variant="default">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Graded
                                </Badge>
                              )
                            ) : (
                              <Badge variant="secondary">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No students found for this exam
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upload Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Grades - {selectedExamData?.name}</DialogTitle>
              <DialogDescription>
                Enter marks for each student. Grade will be calculated automatically.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Absent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students?.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.rollNumber}</TableCell>
                      <TableCell className="font-medium">{student.user?.name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={selectedExamData?.totalMarks}
                          placeholder="0"
                          value={gradeInputs[student.id]?.marksObtained || ""}
                          onChange={(e) => handleMarksChange(student.id, e.target.value)}
                          disabled={gradeInputs[student.id]?.isAbsent}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={gradeInputs[student.id]?.grade || ""}
                          onChange={(e) =>
                            handleGradeChange(student.id, "grade", e.target.value)
                          }
                          disabled={gradeInputs[student.id]?.isAbsent}
                          className="w-16"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={gradeInputs[student.id]?.remarks || ""}
                          onChange={(e) =>
                            handleGradeChange(student.id, "remarks", e.target.value)
                          }
                          placeholder="Optional"
                          className="w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={gradeInputs[student.id]?.isAbsent || false}
                          onChange={(e) =>
                            handleGradeChange(student.id, "isAbsent", e.target.checked)
                          }
                          className="h-4 w-4"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitGrades}
                disabled={uploadGradesMutation.isPending}
              >
                {uploadGradesMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Upload Grades
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
