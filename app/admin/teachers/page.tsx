"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Mail, Phone, MapPin, Search, Edit2, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  isActive: boolean | null;
  teacherAssignments: Array<{
    classroom: { name: string; grade: string; section: string };
    subject: { name: string };
  }>;
}

export default function TeachersPage() {
  const [open, setOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: teachers, isLoading } = useQuery<Teacher[]>({
    queryKey: ["teachers"],
    queryFn: async () => {
      const response = await fetch("/api/teachers");
      if (!response.ok) throw new Error("Failed to fetch teachers");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      phone: string;
      address: string;
      password: string;
    }) => {
      const response = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create teacher");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      setOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      password?: string;
    }) => {
      const { id, ...body } = data;
      const response = await fetch(`/api/teachers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update teacher");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      setEditingTeacher(null);
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/teachers/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete teacher");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      password: formData.get("password") as string,
    };

    if (editingTeacher) {
      updateMutation.mutate({
        id: editingTeacher.id,
        ...data,
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredTeachers = teachers?.filter((teacher) =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading teachers...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Teachers Management</h1>
          <p className="text-gray-600 mt-1">Manage teachers and their assignments</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) setEditingTeacher(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTeacher ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" name="name" required defaultValue={editingTeacher?.name} />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" required defaultValue={editingTeacher?.email} />
              </div>
              <div>
                <Label htmlFor="password">Password {editingTeacher ? "" : "*"}</Label>
                <Input id="password" name="password" type="password" required={!editingTeacher} minLength={6} placeholder={editingTeacher ? "Leave blank to keep current password" : ""} />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" type="tel" defaultValue={editingTeacher?.phone || ''} />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" defaultValue={editingTeacher?.address || ''} />
              </div>
              {(createMutation.error || updateMutation.error) && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {createMutation.error?.message || updateMutation.error?.message}
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setOpen(false);
                  setEditingTeacher(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingTeacher 
                    ? (updateMutation.isPending ? "Updating..." : "Update Teacher")
                    : (createMutation.isPending ? "Creating..." : "Create Teacher")
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers?.map((teacher) => (
          <Card key={teacher.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{teacher.name}</span>
                {teacher.isActive && (
                  <Badge variant="default">Active</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {teacher.email}
                </div>
                {teacher.phone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {teacher.phone}
                  </div>
                )}
                {teacher.address && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {teacher.address}
                  </div>
                )}
                {teacher.teacherAssignments.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="font-semibold mb-2">Assignments:</p>
                    {teacher.teacherAssignments.map((assignment, idx) => (
                      <Badge key={idx} variant="outline" className="mr-1 mb-1">
                        {assignment.classroom.name} - {assignment.subject.name}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setEditingTeacher(teacher);
                      setOpen(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setDeletingTeacher(teacher)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deletingTeacher} onOpenChange={() => setDeletingTeacher(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingTeacher?.name}? This will also remove all their classroom and subject assignments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingTeacher) {
                  deleteMutation.mutate(deletingTeacher.id);
                  setDeletingTeacher(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {filteredTeachers?.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No teachers found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
