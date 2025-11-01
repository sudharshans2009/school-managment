"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Search, Edit2, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { SubjectForm } from "@/components/forms/subject-form";
import {
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjects,
  type SubjectFormData,
} from "@/app/actions/subjects";
import { toast } from "sonner";

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  applicableGrades: string | null;
  applicableSections: string | null;
  teacherAssignments: Array<{
    teacher: { id: string; name: string };
  }>;
}

export default function SubjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const queryClient = useQueryClient();

  // Use TanStack Query to fetch subjects via server action
  const { data: subjectsResult, isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: getSubjects,
  });

  const subjects = subjectsResult?.success ? (subjectsResult.data as Subject[]) : [];

  // Create mutation using server action
  const createMutation = useMutation({
    mutationFn: createSubject,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["subjects"] });
        setOpenCreate(false);
        toast.success("Subject created successfully");
      } else {
        toast.error(result.error || "Failed to create subject");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update mutation using server action
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubjectFormData }) =>
      updateSubject(id, data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["subjects"] });
        setEditingSubject(null);
        toast.success("Subject updated successfully");
      } else {
        toast.error(result.error || "Failed to update subject");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete mutation using server action
  const deleteMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["subjects"] });
        toast.success("Subject deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete subject");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleCreate = async (data: SubjectFormData) => {
    await createMutation.mutateAsync(data);
  };

  const handleUpdate = async (data: SubjectFormData) => {
    if (editingSubject) {
      await updateMutation.mutateAsync({ id: editingSubject.id, data });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this subject?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleDialogChange = (open: boolean) => {
    if (openCreate) {
      setOpenCreate(open);
    }
    if (!open) {
      setEditingSubject(null);
    }
  };

  const filteredSubjects = subjects?.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const uniqueTeachers = (subject: Subject) => {
    const teacherMap = new Map();
    subject.teacherAssignments.forEach((assignment) => {
      teacherMap.set(assignment.teacher.id, assignment.teacher.name);
    });
    return Array.from(teacherMap.values());
  };

  const getGradesDisplay = (applicableGrades: string | null) => {
    if (!applicableGrades) return "All Grades";
    const grades = JSON.parse(applicableGrades) as string[];
    if (grades.length === 0) return "All Grades";
    return `Grade ${grades.join(", ")}`;
  };

  const getSectionsDisplay = (applicableSections: string | null) => {
    if (!applicableSections) return "All Sections";
    const sections = JSON.parse(applicableSections) as string[];
    if (sections.length === 0) return "All Sections";
    return `Section ${sections.join(", ")}`;
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Subjects Management" description="Admin Portal">
        <p>Loading subjects...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Subjects Management" description="Admin Portal">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="rounded-xl">
                ← Back
              </Button>
            </Link>
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Subject Management</h1>
          </div>
          <Dialog
            open={openCreate || !!editingSubject}
            onOpenChange={handleDialogChange}
          >
            <DialogTrigger asChild>
              <Button className="rounded-xl" onClick={() => setOpenCreate(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSubject ? "Edit Subject" : "Add New Subject"}
                </DialogTitle>
              </DialogHeader>
              <SubjectForm
                initialData={
                  editingSubject
                    ? {
                        name: editingSubject.name,
                        code: editingSubject.code,
                        description: editingSubject.description || undefined,
                        applicableGrades: editingSubject.applicableGrades
                          ? JSON.parse(editingSubject.applicableGrades)
                          : [],
                        applicableSections: editingSubject.applicableSections
                          ? JSON.parse(editingSubject.applicableSections)
                          : [],
                      }
                    : undefined
                }
                onSubmit={editingSubject ? handleUpdate : handleCreate}
                isLoading={createMutation.isPending || updateMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card className="mb-6 rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search subjects by name or code..."
                className="flex-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {filteredSubjects && filteredSubjects.length === 0 ? (
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-8 text-center text-gray-500">
              No subjects found. Add your first subject to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubjects?.map((subject) => (
              <Card key={subject.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      <Badge variant="secondary" className="mt-2">
                        {subject.code}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingSubject(subject)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(subject.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {subject.description && (
                    <p className="text-sm text-gray-600 mb-3">
                      {subject.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-3">
                    <div className="text-sm">
                      <span className="font-medium">Grades: </span>
                      <span className="text-gray-600">
                        {getGradesDisplay(subject.applicableGrades)}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Sections: </span>
                      <span className="text-gray-600">
                        {getSectionsDisplay(subject.applicableSections)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>
                      {uniqueTeachers(subject).length === 0
                        ? "No teachers assigned"
                        : `${uniqueTeachers(subject).length} teacher(s)`}
                    </span>
                  </div>

                  {uniqueTeachers(subject).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {uniqueTeachers(subject).map((teacherName, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {teacherName}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
