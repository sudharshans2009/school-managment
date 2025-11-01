"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  GraduationCap,
  Filter,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

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
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [allGrades, setAllGrades] = useState(true);
  const [allSections, setAllSections] = useState(true);
  const queryClient = useQueryClient();

  const availableGrades = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
  ];
  const availableSections = ["A", "B", "C", "D", "E"];

  // Reset filters when dialog opens/closes
  const handleDialogChange = (open: boolean) => {
    setOpenCreate(open);
    if (!open) {
      setEditingSubject(null);
      setSelectedGrades([]);
      setSelectedSections([]);
      setAllGrades(true);
      setAllSections(true);
    } else if (editingSubject) {
      // Load existing filters when editing
      const grades = editingSubject.applicableGrades
        ? JSON.parse(editingSubject.applicableGrades)
        : [];
      const sections = editingSubject.applicableSections
        ? JSON.parse(editingSubject.applicableSections)
        : [];
      setSelectedGrades(grades);
      setSelectedSections(sections);
      setAllGrades(grades.length === 0);
      setAllSections(sections.length === 0);
    }
  };

  const { data: subjects, isLoading } = useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: async () => {
      const response = await fetch("/api/subjects");
      if (!response.ok) throw new Error("Failed to fetch subjects");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      code: string;
      description?: string;
      applicableGrades?: string[];
      applicableSections?: string[];
    }) => {
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create subject");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setOpenCreate(false);
      setSelectedGrades([]);
      setSelectedSections([]);
      setAllGrades(true);
      setAllSections(true);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      name?: string;
      code?: string;
      description?: string;
      applicableGrades?: string[];
      applicableSections?: string[];
    }) => {
      const { id, ...body } = data;
      const response = await fetch(`/api/subjects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update subject");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setEditingSubject(null);
      setSelectedGrades([]);
      setSelectedSections([]);
      setAllGrades(true);
      setAllSections(true);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/subjects/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete subject");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get("name") as string,
      code: formData.get("code") as string,
      description: formData.get("description") as string,
      applicableGrades: allGrades ? [] : selectedGrades,
      applicableSections: allSections ? [] : selectedSections,
    };

    if (editingSubject) {
      updateMutation.mutate({ id: editingSubject.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleGrade = (grade: string) => {
    setSelectedGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade],
    );
  };

  const toggleSection = (section: string) => {
    setSelectedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const filteredSubjects = subjects?.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const uniqueTeachers = (subject: Subject) => {
    const teacherMap = new Map();
    subject.teacherAssignments.forEach((assignment) => {
      teacherMap.set(assignment.teacher.id, assignment.teacher.name);
    });
    return Array.from(teacherMap.values());
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
              <Button className="rounded-xl">
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Subject Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Mathematics"
                    required
                    defaultValue={editingSubject?.name}
                  />
                </div>
                <div>
                  <Label htmlFor="code">Subject Code *</Label>
                  <Input
                    id="code"
                    name="code"
                    placeholder="e.g., MATH-101"
                    required
                    defaultValue={editingSubject?.code}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Brief description of the subject"
                    rows={3}
                    defaultValue={editingSubject?.description || ""}
                  />
                </div>

                {/* Grade Filter */}
                <div className="space-y-2">
                  <Label>Applicable for Classes</Label>
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id="allGrades"
                      checked={allGrades}
                      onCheckedChange={(checked) => {
                        setAllGrades(checked as boolean);
                        if (checked) setSelectedGrades([]);
                      }}
                    />
                    <label
                      htmlFor="allGrades"
                      className="text-sm font-medium cursor-pointer"
                    >
                      All Classes
                    </label>
                  </div>
                  {!allGrades && (
                    <div className="grid grid-cols-6 gap-2 p-3 border rounded-md">
                      {availableGrades.map((grade) => (
                        <div
                          key={grade}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`grade-${grade}`}
                            checked={selectedGrades.includes(grade)}
                            onCheckedChange={() => toggleGrade(grade)}
                          />
                          <label
                            htmlFor={`grade-${grade}`}
                            className="text-sm cursor-pointer"
                          >
                            Class {grade}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section Filter */}
                <div className="space-y-2">
                  <Label>Applicable for Sections</Label>
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id="allSections"
                      checked={allSections}
                      onCheckedChange={(checked) => {
                        setAllSections(checked as boolean);
                        if (checked) setSelectedSections([]);
                      }}
                    />
                    <label
                      htmlFor="allSections"
                      className="text-sm font-medium cursor-pointer"
                    >
                      All Sections
                    </label>
                  </div>
                  {!allSections && (
                    <div className="grid grid-cols-5 gap-2 p-3 border rounded-md">
                      {availableSections.map((section) => (
                        <div
                          key={section}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`section-${section}`}
                            checked={selectedSections.includes(section)}
                            onCheckedChange={() => toggleSection(section)}
                          />
                          <label
                            htmlFor={`section-${section}`}
                            className="text-sm cursor-pointer"
                          >
                            Section {section}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {(createMutation.error || updateMutation.error) && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {createMutation.error?.message ||
                        updateMutation.error?.message}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      setOpenCreate(false);
                      setEditingSubject(null);
                      setSelectedGrades([]);
                      setSelectedSections([]);
                      setAllGrades(true);
                      setAllSections(true);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Saving..."
                      : editingSubject
                        ? "Update"
                        : "Create"}
                  </Button>
                </div>
              </form>
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
              <Card
                key={subject.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      <Badge variant="secondary" className="mt-2">
                        {subject.code}
                      </Badge>
                    </div>
                    <div className="flex space-x-1">
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
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to delete this subject? This will remove all teacher assignments.",
                            )
                          ) {
                            deleteMutation.mutate(subject.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {subject.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {subject.description}
                    </p>
                  )}

                  {/* Class Filter Display */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center">
                        <GraduationCap className="h-4 w-4 mr-1" />
                        Classes
                      </span>
                      <span className="font-semibold text-xs">
                        {subject.applicableGrades &&
                        JSON.parse(subject.applicableGrades).length > 0
                          ? `${JSON.parse(subject.applicableGrades).length} classes`
                          : "All Classes"}
                      </span>
                    </div>
                    {subject.applicableGrades &&
                      JSON.parse(subject.applicableGrades).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {JSON.parse(subject.applicableGrades).map(
                            (grade: string) => (
                              <Badge
                                key={grade}
                                variant="outline"
                                className="text-xs"
                              >
                                Class {grade}
                              </Badge>
                            ),
                          )}
                        </div>
                      )}
                  </div>

                  {/* Section Filter Display */}
                  {subject.applicableSections &&
                    JSON.parse(subject.applicableSections).length > 0 && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400 flex items-center">
                            <Filter className="h-4 w-4 mr-1" />
                            Sections
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {JSON.parse(subject.applicableSections).map(
                            (section: string) => (
                              <Badge
                                key={section}
                                variant="outline"
                                className="text-xs"
                              >
                                Section {section}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      Teachers
                    </span>
                    <span className="font-semibold">
                      {uniqueTeachers(subject).length}
                    </span>
                  </div>
                  {uniqueTeachers(subject).length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500 mb-2">Assigned to:</p>
                      <div className="flex flex-wrap gap-1">
                        {uniqueTeachers(subject)
                          .slice(0, 3)
                          .map((teacherName, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {teacherName}
                            </Badge>
                          ))}
                        {uniqueTeachers(subject).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{uniqueTeachers(subject).length - 3} more
                          </Badge>
                        )}
                      </div>
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
