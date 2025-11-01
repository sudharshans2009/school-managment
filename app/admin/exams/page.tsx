"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  CheckCircle,
  XCircle,
  Trash2,
  ArrowLeft,
} from "lucide-react";
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
  stats?: {
    totalGrades: number;
  };
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface Classroom {
  id: string;
  name: string;
  grade: string;
  section: string;
}

export default function AdminExamsPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filterClassroom, setFilterClassroom] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");

  const [formData, setFormData] = useState({
    name: "",
    examType: "",
    subjectId: "",
    classroomId: "",
    examDate: "",
    totalMarks: "",
    passingMarks: "",
    duration: "",
    syllabus: "",
    instructions: "",
    academicYear: new Date().getFullYear().toString(),
    term: "",
  });

  // Fetch exams
  const { data: exams, isLoading: examsLoading } = useQuery<Exam[]>({
    queryKey: ["exams", filterClassroom, filterSubject],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterClassroom && filterClassroom !== "all")
        params.append("classroomId", filterClassroom);
      if (filterSubject && filterSubject !== "all")
        params.append("subjectId", filterSubject);

      const response = await fetch(`/api/exams?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch exams");
      return response.json();
    },
  });

  // Fetch classrooms
  const { data: classrooms } = useQuery<Classroom[]>({
    queryKey: ["classrooms"],
    queryFn: async () => {
      const response = await fetch("/api/classrooms");
      if (!response.ok) throw new Error("Failed to fetch classrooms");
      return response.json();
    },
  });

  // Fetch subjects
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: async () => {
      const response = await fetch("/api/subjects");
      if (!response.ok) throw new Error("Failed to fetch subjects");
      return response.json();
    },
  });

  // Create exam mutation
  const createExamMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          totalMarks: parseInt(data.totalMarks),
          passingMarks: data.passingMarks
            ? parseInt(data.passingMarks)
            : undefined,
          duration: data.duration ? parseInt(data.duration) : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create exam");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Exam created successfully");
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Finalize exam mutation
  const finalizeExamMutation = useMutation({
    mutationFn: async ({
      examId,
      isFinalized,
    }: {
      examId: string;
      isFinalized: boolean;
    }) => {
      const response = await fetch(`/api/exams/${examId}/finalize`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFinalized }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to finalize exam");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Exam finalization updated");
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete exam mutation
  const deleteExamMutation = useMutation({
    mutationFn: async (examId: string) => {
      const response = await fetch(`/api/exams/${examId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete exam");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Exam deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      examType: "",
      subjectId: "",
      classroomId: "",
      examDate: "",
      totalMarks: "",
      passingMarks: "",
      duration: "",
      syllabus: "",
      instructions: "",
      academicYear: new Date().getFullYear().toString(),
      term: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExamMutation.mutate(formData);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Exam Management</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage exams, upload grades, and finalize results
            </p>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Exam
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Exam</DialogTitle>
                <DialogDescription>
                  Set up a new exam for a class and subject
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Exam Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Mathematics Mid-Term Exam"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="examType">Exam Type</Label>
                    <Select
                      value={formData.examType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, examType: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="class_test">Class Test</SelectItem>
                        <SelectItem value="unit_test">Unit Test</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="midterm">Midterm</SelectItem>
                        <SelectItem value="final_exam">Final Exam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="examDate">Exam Date</Label>
                    <Input
                      id="examDate"
                      type="date"
                      value={formData.examDate}
                      onChange={(e) =>
                        setFormData({ ...formData, examDate: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="classroomId">Classroom</Label>
                    <Select
                      value={formData.classroomId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, classroomId: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select classroom" />
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

                  <div>
                    <Label htmlFor="subjectId">Subject</Label>
                    <Select
                      value={formData.subjectId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, subjectId: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects?.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name} ({subject.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="totalMarks">Total Marks</Label>
                    <Input
                      id="totalMarks"
                      type="number"
                      value={formData.totalMarks}
                      onChange={(e) =>
                        setFormData({ ...formData, totalMarks: e.target.value })
                      }
                      placeholder="100"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="passingMarks">
                      Passing Marks (Optional)
                    </Label>
                    <Input
                      id="passingMarks"
                      type="number"
                      value={formData.passingMarks}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          passingMarks: e.target.value,
                        })
                      }
                      placeholder="40"
                    />
                  </div>

                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: e.target.value })
                      }
                      placeholder="180"
                    />
                  </div>

                  <div>
                    <Label htmlFor="academicYear">Academic Year</Label>
                    <Input
                      id="academicYear"
                      value={formData.academicYear}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          academicYear: e.target.value,
                        })
                      }
                      placeholder="2024"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="term">Term (Optional)</Label>
                    <Input
                      id="term"
                      value={formData.term}
                      onChange={(e) =>
                        setFormData({ ...formData, term: e.target.value })
                      }
                      placeholder="Term 1"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="syllabus">Syllabus (Optional)</Label>
                    <Textarea
                      id="syllabus"
                      value={formData.syllabus}
                      onChange={(e) =>
                        setFormData({ ...formData, syllabus: e.target.value })
                      }
                      placeholder="Topics covered in this exam..."
                      rows={3}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="instructions">
                      Instructions (Optional)
                    </Label>
                    <Textarea
                      id="instructions"
                      value={formData.instructions}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          instructions: e.target.value,
                        })
                      }
                      placeholder="Exam instructions..."
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createExamMutation.isPending}>
                    {createExamMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Create Exam
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="filterClassroom">Filter by Classroom</Label>
                <Select
                  value={filterClassroom}
                  onValueChange={setFilterClassroom}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Classrooms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classrooms</SelectItem>
                    {classrooms?.map((classroom) => (
                      <SelectItem key={classroom.id} value={classroom.id}>
                        {classroom.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filterSubject">Filter by Subject</Label>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects?.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exams List */}
        {examsLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : exams && exams.length > 0 ? (
          <div className="grid gap-4">
            {exams.map((exam) => (
              <Card key={exam.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {exam.name}
                        {exam.isFinalized ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Finalized
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Draft
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {exam.classroom.name} • {exam.subject.name} (
                        {exam.subject.code})
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={exam.isFinalized ? "outline" : "default"}
                        onClick={() =>
                          finalizeExamMutation.mutate({
                            examId: exam.id,
                            isFinalized: !exam.isFinalized,
                          })
                        }
                        disabled={finalizeExamMutation.isPending}
                      >
                        {finalizeExamMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : exam.isFinalized ? (
                          "Unfinalize"
                        ) : (
                          "Finalize"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to delete this exam? This action cannot be undone.",
                            )
                          ) {
                            deleteExamMutation.mutate(exam.id);
                          }
                        }}
                        disabled={deleteExamMutation.isPending}
                      >
                        {deleteExamMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium">
                        {getExamTypeLabel(exam.examType)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">
                        {format(new Date(exam.examDate), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Marks</p>
                      <p className="font-medium">{exam.totalMarks}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Academic Year</p>
                      <p className="font-medium">
                        {exam.academicYear} {exam.term && `• ${exam.term}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-muted-foreground mb-4">No exams found</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Exam
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
