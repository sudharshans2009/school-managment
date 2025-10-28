"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { School, Plus, Search, Edit, Trash2, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Classroom {
  id: string;
  name: string;
  grade: string;
  section: string;
  code: string;
  currentStrength: number;
  teacherAssignments: Array<{
    isPrimary: boolean;
    teacher: { name: string };
  }>;
  students: Array<{ id: string }>;
}

export default function ClassroomsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: classrooms, isLoading } = useQuery<Classroom[]>({
    queryKey: ["classrooms"],
    queryFn: async () => {
      const response = await fetch("/api/classrooms");
      if (!response.ok) throw new Error("Failed to fetch classrooms");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      grade: string;
      section: string;
    }) => {
      const response = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create classroom");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      setOpenCreate(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/classrooms/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete classroom");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get("name") as string,
      grade: formData.get("grade") as string,
      section: formData.get("section") as string,
    });
  };

  const filteredClassrooms = classrooms?.filter((classroom) =>
    classroom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classroom.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classroom.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
    classroom.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const primaryTeacher = (classroom: Classroom) => {
    const primary = classroom.teacherAssignments.find((a) => a.isPrimary);
    return primary?.teacher.name || "Not assigned";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p>Loading classrooms...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Link href="/admin">
                <Button variant="ghost" size="sm">← Back</Button>
              </Link>
              <School className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Classroom Management</h1>
            </div>
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button className="rounded-xl">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Classroom
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Classroom</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Classroom Name *</Label>
                    <Input className="rounded-xl" id="name" name="name" placeholder="e.g., Class 10A" required />
                  </div>
                  <div>
                    <Label htmlFor="grade">Grade *</Label>
                    <Input className="rounded-xl" id="grade" name="grade" placeholder="e.g., 10" required />
                  </div>
                  <div>
                    <Label htmlFor="section">Section *</Label>
                    <Input className="rounded-xl" id="section" name="section" placeholder="e.g., A" required />
                  </div>
                  {createMutation.error && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {createMutation.error.message}
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpenCreate(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search classrooms by name, grade, or section..."
                className="flex-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {filteredClassrooms && filteredClassrooms.length === 0 ? (
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-8 text-center text-gray-500">
              No classrooms found. Create your first classroom to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClassrooms?.map((classroom) => (
              <Card key={classroom.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{classroom.name}</CardTitle>
                      <CardDescription>Code: {classroom.code}</CardDescription>
                    </div>
                    <div className="flex space-x-1">
                      <Link href={`/admin/classrooms/${classroom.id}/edit`}>
                        <Button variant="ghost" size="icon" title="Manage classroom">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this classroom?")) {
                            deleteMutation.mutate(classroom.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        title="Delete classroom"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Grade & Section</span>
                    <span className="font-semibold">{classroom.grade}{classroom.section}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center">
                      <Users className="h-4 w-4 mr-1" /> Students
                    </span>
                    <span className="font-semibold">
                      {classroom.students.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="text-gray-600 dark:text-gray-400">Class Teacher</span>
                    <span className="font-semibold text-xs">{primaryTeacher(classroom)}</span>
                  </div>
                  <div className="pt-2">
                    <Badge variant="secondary" className="text-xs">
                      {classroom.teacherAssignments.length} teachers assigned
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
