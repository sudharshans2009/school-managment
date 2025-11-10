"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  School,
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { DataTable } from "@/components/ui/data-table";
import { createClassroomColumns, Classroom } from "./components/columns";
import { AdminHeader } from "@/components/admin/admin-header";

export default function ClassroomsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const queryClient = useQueryClient();

  const { data: classroomsResult, isLoading } = useQuery({
    queryKey: ["classrooms"],
    queryFn: async () => {
      const { getAllClassrooms } = await import("@/actions/classrooms");
      return await getAllClassrooms();
    },
  });

  const classrooms = classroomsResult?.success ? classroomsResult.data : [];

  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      grade: string;
      section: string;
    }) => {
      const { createClassroom } = await import("@/actions/classrooms");
      return await createClassroom(data);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["classrooms"] });
        setOpenCreate(false);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { deleteClassroom } = await import("@/actions/classrooms");
      return await deleteClassroom(id);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      }
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

  const filteredClassrooms = classrooms?.filter(
    (classroom) =>
      classroom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classroom.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classroom.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classroom.classroomCode
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  const primaryTeacher = (classroom: Classroom) => {
    const primary = classroom.teacherAssignments.find((a) => a.isPrimary);
    return primary?.teacher.name || "Not assigned";
  };

  const columns = createClassroomColumns({
    onDelete: (classroom) => {
      if (confirm("Are you sure you want to delete this classroom?")) {
        deleteMutation.mutate(classroom.id);
      }
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Classrooms Management" description="Admin Portal">
        <p>Loading classrooms...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Classrooms Management" description="Admin Portal">
      <div>
        <AdminHeader
          icon={School}
          title="Classroom Management"
          description="Manage all classrooms and their details"
        >
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() =>
                setViewMode(viewMode === "grid" ? "table" : "grid")
              }
              className="rounded-xl flex-1 sm:flex-none"
            >
              {viewMode === "grid" ? (
                <>
                  <TableIcon className="h-4 w-4 mr-2" />
                  Table View
                </>
              ) : (
                <>
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Grid View
                </>
              )}
            </Button>
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button className="rounded-xl flex-1 sm:flex-none">
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
                    <Input
                      className="rounded-xl"
                      id="name"
                      name="name"
                      placeholder="e.g., Class 10A"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="grade">Grade *</Label>
                    <Input
                      className="rounded-xl"
                      id="grade"
                      name="grade"
                      placeholder="e.g., 10"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="section">Section *</Label>
                    <Input
                      className="rounded-xl"
                      id="section"
                      name="section"
                      placeholder="e.g., A"
                      required
                    />
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
                      className="rounded-xl"
                      onClick={() => setOpenCreate(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="rounded-xl"
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </AdminHeader>

        {viewMode === "table" ? (
          <DataTable
            columns={columns}
            data={filteredClassrooms || []}
            searchKey="name"
            searchPlaceholder="Search classrooms by name, grade, or section..."
          />
        ) : (
          <>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search classrooms by name, grade, or section..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>
            {filteredClassrooms && filteredClassrooms.length === 0 ? (
              <Card className="rounded-2xl shadow-sm">
                <CardContent className="p-8 text-center text-gray-500">
                  No classrooms found. Create your first classroom to get
                  started.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClassrooms?.map((classroom) => (
                  <Card
                    key={classroom.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{classroom.name}</CardTitle>
                          <CardDescription>
                            Code: {classroom.classroomCode}
                          </CardDescription>
                        </div>
                        <div className="flex space-x-1">
                          <Link href={`/admin/classrooms/${classroom.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="View details"
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/classrooms/${classroom.id}/edit`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Manage classroom"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you sure you want to delete this classroom?",
                                )
                              ) {
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
                        <span className="text-gray-600 dark:text-gray-400">
                          Grade & Section
                        </span>
                        <span className="font-semibold">
                          {classroom.grade}
                          {classroom.section}
                        </span>
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
                        <span className="text-gray-600 dark:text-gray-400">
                          Class Teacher
                        </span>
                        <span className="font-semibold text-xs">
                          {primaryTeacher(classroom)}
                        </span>
                      </div>
                      <div className="pt-2">
                        <Badge variant="secondary" className="text-xs">
                          {classroom.teacherAssignments.length} teachers
                          assigned
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
