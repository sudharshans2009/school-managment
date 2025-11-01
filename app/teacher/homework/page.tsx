"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
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
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  Edit,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { TeacherQuickActions } from "@/components/teacher-quick-actions";

interface Classroom {
  id: string;
  name: string;
  grade: string;
  section: string;
}

interface Homework {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  totalMarks: number;
  subjectName: string;
  assignedDate: string;
}

interface Student {
  id: string;
  user: {
    name: string;
  };
  rollNumber: string;
}

interface Submission {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  studentRollNumber: string;
  homeworkTitle: string;
  subjectName: string;
  submittedAt: string;
  marksObtained: number | null;
  totalMarks: number;
  feedback: string | null;
  status: "submitted" | "graded";
}

export default function TeacherHomeworkPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedClassroom, setSelectedClassroom] = useState<string>("");
  const [selectedHomework, setSelectedHomework] = useState<string>("");
  const [openMarkDialog, setOpenMarkDialog] = useState(false);
  const [openGradeDialog, setOpenGradeDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [viewMode, setViewMode] = useState<"homework" | "students">("homework");

  const queryClient = useQueryClient();

  // Fetch classrooms for this teacher
  const { data: classrooms } = useQuery<Classroom[]>({
    queryKey: ["teacher-classrooms"],
    queryFn: async () => {
      const response = await fetch("/api/teachers/classrooms");
      if (!response.ok) throw new Error("Failed to fetch classrooms");
      return response.json();
    },
  });

  // Fetch homework for selected classroom
  const { data: homework } = useQuery<Homework[]>({
    queryKey: ["teacher-homework", selectedClassroom],
    queryFn: async () => {
      const response = await fetch(
        `/api/homework?classroomId=${selectedClassroom}&teacherId=${session?.user?.id}`,
      );
      if (!response.ok) throw new Error("Failed to fetch homework");
      return response.json();
    },
    enabled: !!selectedClassroom && !!session?.user?.id,
  });

  // Fetch students for selected classroom
  const { data: students } = useQuery<Student[]>({
    queryKey: ["classroom-students", selectedClassroom],
    queryFn: async () => {
      const response = await fetch(
        `/api/students?classroomId=${selectedClassroom}`,
      );
      if (!response.ok) throw new Error("Failed to fetch students");
      return response.json();
    },
    enabled: !!selectedClassroom && viewMode === "students",
  });

  // Fetch submissions for selected homework
  const { data: submissions, isLoading: submissionsLoading } = useQuery<
    Submission[]
  >({
    queryKey: ["homework-submissions", selectedHomework],
    queryFn: async () => {
      const response = await fetch(
        `/api/homework/submissions?homeworkId=${selectedHomework}`,
      );
      if (!response.ok) throw new Error("Failed to fetch submissions");
      return response.json();
    },
    enabled: !!selectedHomework,
  });

  // Mark as submitted mutation
  const markSubmittedMutation = useMutation({
    mutationFn: async (data: { homeworkId: string; studentId: string }) => {
      const response = await fetch("/api/homework/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to mark submission");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework-submissions"] });
      setOpenMarkDialog(false);
      setSelectedStudent(null);
    },
  });

  // Grade submission mutation
  const gradeMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      marksObtained: number;
      feedback: string;
    }) => {
      const response = await fetch(`/api/homework/submissions/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marksObtained: data.marksObtained,
          feedback: data.feedback,
          status: "graded",
        }),
      });
      if (!response.ok) throw new Error("Failed to grade submission");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework-submissions"] });
      setOpenGradeDialog(false);
      setSelectedSubmission(null);
    },
  });

  // Delete submission mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/homework/submissions/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete submission");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework-submissions"] });
    },
  });

  const handleMarkSubmitted = (student: Student) => {
    setSelectedStudent(student);
    setOpenMarkDialog(true);
  };

  const handleGrade = (submission: Submission) => {
    setSelectedSubmission(submission);
    setOpenGradeDialog(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Remove this submission record?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmitMark = () => {
    if (selectedStudent && selectedHomework) {
      markSubmittedMutation.mutate({
        homeworkId: selectedHomework,
        studentId: selectedStudent.id,
      });
    }
  };

  const handleSubmitGrade = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    const formData = new FormData(e.currentTarget);
    gradeMutation.mutate({
      id: selectedSubmission.id,
      marksObtained: parseInt(formData.get("marks") as string),
      feedback: formData.get("feedback") as string,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: React.ElementType;
      }
    > = {
      submitted: { variant: "secondary", icon: Clock },
      graded: { variant: "default", icon: CheckCircle },
    };
    const config = variants[status] || { variant: "outline", icon: XCircle };
    const Icon = config.icon;
    return (
      <Badge
        variant={config.variant}
        className="rounded-lg flex items-center gap-1"
      >
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const submittedStudentIds = submissions?.map((s) => s.studentId) || [];

  return (
    <DashboardLayout title="Teacher Portal" description="Homework Submissions">
      <div className="space-y-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <TeacherQuickActions currentPage="homework" />

        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Homework Submissions</h1>
            <p className="text-sm text-muted-foreground">
              Mark physical submissions and grade homework
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Select Classroom</Label>
                <Select
                  value={selectedClassroom}
                  onValueChange={setSelectedClassroom}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Choose a classroom" />
                  </SelectTrigger>
                  <SelectContent>
                    {classrooms?.map((classroom) => (
                      <SelectItem key={classroom.id} value={classroom.id}>
                        {classroom.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedClassroom && (
                <>
                  <div>
                    <Label>Select Homework</Label>
                    <Select
                      value={selectedHomework}
                      onValueChange={setSelectedHomework}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose homework" />
                      </SelectTrigger>
                      <SelectContent>
                        {homework?.map((hw) => (
                          <SelectItem key={hw.id} value={hw.id}>
                            {hw.title} ({hw.subjectName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>View Mode</Label>
                    <Select
                      value={viewMode}
                      onValueChange={(v) =>
                        setViewMode(v as "homework" | "students")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homework">By Homework</SelectItem>
                        <SelectItem value="students">By Students</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submissions View */}
        {selectedHomework && viewMode === "homework" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Submissions</span>
                <Badge variant="outline">
                  {submissions?.length || 0} / {students?.length || 0} submitted
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submissionsLoading ? (
                <div className="flex justify-center p-8">
                  <Spinner className="w-8 h-8" />
                </div>
              ) : submissions && submissions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Submitted At</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>{submission.studentRollNumber}</TableCell>
                        <TableCell className="font-medium">
                          {submission.studentName}
                        </TableCell>
                        <TableCell>
                          {format(
                            new Date(submission.submittedAt),
                            "MMM dd, yyyy HH:mm",
                          )}
                        </TableCell>
                        <TableCell>
                          {submission.marksObtained !== null
                            ? `${submission.marksObtained}/${submission.totalMarks}`
                            : "Not graded"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(submission.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGrade(submission)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(submission.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No submissions yet
                </div>
              )}

              {/* Mark Submission for Students */}
              {students && students.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-4">
                    Mark Physical Submissions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students
                      .filter(
                        (student) => !submittedStudentIds.includes(student.id),
                      )
                      .map((student) => (
                        <Card key={student.id}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium">{student.user.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {student.rollNumber}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleMarkSubmitted(student)}
                            >
                              <UserCheck className="w-4 h-4 mr-2" />
                              Mark
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Mark Submitted Dialog */}
        <Dialog open={openMarkDialog} onOpenChange={setOpenMarkDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Homework as Submitted</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                Confirm that <strong>{selectedStudent?.user.name}</strong> has
                submitted the homework physically?
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setOpenMarkDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitMark}
                  disabled={markSubmittedMutation.isPending}
                >
                  {markSubmittedMutation.isPending ? (
                    <>
                      <Spinner className="w-4 h-4 mr-2" />
                      Marking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Grade Submission Dialog */}
        <Dialog open={openGradeDialog} onOpenChange={setOpenGradeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grade Homework</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitGrade} className="space-y-4">
              <div>
                <Label>Student</Label>
                <Input value={selectedSubmission?.studentName || ""} disabled />
              </div>
              <div>
                <Label htmlFor="marks">
                  Marks Obtained (out of {selectedSubmission?.totalMarks})
                </Label>
                <Input
                  id="marks"
                  name="marks"
                  type="number"
                  min="0"
                  max={selectedSubmission?.totalMarks}
                  defaultValue={selectedSubmission?.marksObtained || ""}
                  required
                />
              </div>
              <div>
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  name="feedback"
                  defaultValue={selectedSubmission?.feedback || ""}
                  rows={4}
                  placeholder="Provide feedback..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenGradeDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={gradeMutation.isPending}>
                  {gradeMutation.isPending ? (
                    <>
                      <Spinner className="w-4 h-4 mr-2" />
                      Grading...
                    </>
                  ) : (
                    "Submit Grade"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
