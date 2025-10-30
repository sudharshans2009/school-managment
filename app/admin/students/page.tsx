"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Mail, Phone, Calendar, Search, Edit2, Trash2, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

interface Student {
  id: string;
  rollNumber: string;
  admissionNumber: string;
  user: {
    name: string;
    email: string;
    phone: string | null;
  };
  classroom: {
    name: string;
    grade: string;
    section: string;
  } | null;
  dateOfBirth: string;
  bloodGroup: string | null;
}

interface Classroom {
  id: string;
  name: string;
  grade: string;
  section: string;
}

export default function StudentsPage() {
  const [open, setOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadResult, setUploadResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const queryClient = useQueryClient();

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: async () => {
      const response = await fetch("/api/students");
      if (!response.ok) throw new Error("Failed to fetch students");
      return response.json();
    },
  });

  const { data: classrooms } = useQuery<Classroom[]>({
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
      email: string;
      phone: string;
      address: string;
      password: string;
      classroomId: string;
      rollNumber: string;
      admissionNumber: string;
      dateOfBirth: string;
      bloodGroup: string;
    }) => {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create student");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
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
      classroomId?: string;
      rollNumber?: string;
      admissionNumber?: string;
      dateOfBirth?: string;
      bloodGroup?: string;
    }) => {
      const { id, ...body } = data;
      const response = await fetch(`/api/students/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update student");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      setEditingStudent(null);
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/students/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete student");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
    },
  });

  const bulkUploadMutation = useMutation({
    mutationFn: async (students: unknown[]) => {
      const response = await fetch("/api/students/bulk-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload students");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setCsvDialogOpen(false);
      setCsvFile(null);
      setUploadResult({ success: data.success, failed: data.failed, errors: data.errors || [] });
    },
    onError: (error: Error) => {
      setUploadResult({ success: 0, failed: 0, errors: [error.message] });
    },
  });

  const handleCSVUpload = async () => {
    if (!csvFile) return;

    const text = await csvFile.text();
    const lines = text.split("\n").filter(line => line.trim());
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    
    const students = lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim());
      const student: Record<string, string> = {};
      headers.forEach((header, index) => {
        student[header] = values[index] || "";
      });
      return student;
    });

    bulkUploadMutation.mutate(students);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      password: formData.get("password") as string,
      classroomId: formData.get("classroomId") as string,
      rollNumber: formData.get("rollNumber") as string,
      admissionNumber: formData.get("admissionNumber") as string,
      dateOfBirth: formData.get("dateOfBirth") as string,
      bloodGroup: formData.get("bloodGroup") as string,
    };

    if (editingStudent) {
      updateMutation.mutate({
        id: editingStudent.id,
        ...data,
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredStudents = students?.filter((student) =>
    student.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout title="Students Management" description="Admin Portal">
        <div className="text-center py-12">Loading students...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Students Management" description="Admin Portal">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Students Management</h1>
            <p className="text-muted-foreground mt-1">Manage students and their enrollment</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Bulk Upload Students</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>CSV File</Label>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="rounded-xl"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      CSV should have headers: name, email, password, phone, address, rollNumber, admissionNumber, dateOfBirth, bloodGroup, classroomId
                    </p>
                  </div>
                  <Button
                    onClick={handleCSVUpload}
                    disabled={!csvFile || bulkUploadMutation.isPending}
                    className="w-full rounded-xl"
                  >
                    {bulkUploadMutation.isPending ? "Uploading..." : "Upload Students"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={open} onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (!isOpen) setEditingStudent(null);
            }}>
              <DialogTrigger asChild>
                <Button className="rounded-xl">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
              <DialogHeader>
                <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" name="name" required defaultValue={editingStudent?.user.name} className="rounded-xl" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" name="email" type="email" required defaultValue={editingStudent?.user.email} className="rounded-xl" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="password">Password {editingStudent ? "" : "*"}</Label>
                <Input id="password" name="password" type="password" required={!editingStudent} minLength={6} placeholder={editingStudent ? "Leave blank to keep current password" : ""} className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rollNumber">Roll Number *</Label>
                  <Input id="rollNumber" name="rollNumber" required defaultValue={editingStudent?.rollNumber} />
                </div>
                <div>
                  <Label htmlFor="admissionNumber">Admission Number *</Label>
                  <Input id="admissionNumber" name="admissionNumber" required defaultValue={editingStudent?.admissionNumber} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input id="dateOfBirth" name="dateOfBirth" type="date" required defaultValue={editingStudent?.dateOfBirth ? new Date(editingStudent.dateOfBirth).toISOString().split('T')[0] : ''} />
                </div>
                <div>
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <Select name="bloodGroup" defaultValue={editingStudent?.bloodGroup || undefined}>
                    <SelectTrigger id="bloodGroup">
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="classroomId">Assign to Classroom</Label>
                <Select name="classroomId">
                  <SelectTrigger id="classroomId">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" type="tel" defaultValue={editingStudent?.user.phone || ''} />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" />
                </div>
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
                  setEditingStudent(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingStudent 
                    ? (updateMutation.isPending ? "Updating..." : "Update Student")
                    : (createMutation.isPending ? "Creating..." : "Create Student")
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

    {uploadResult && (
      <Alert variant={uploadResult.failed > 0 ? "destructive" : "default"} className="mb-4">
        <AlertDescription>
          <div className="font-semibold mb-2">
            Bulk Upload Complete: {uploadResult.success} succeeded, {uploadResult.failed} failed
          </div>
          {uploadResult.errors.length > 0 && (
            <ul className="list-disc list-inside text-sm">
              {uploadResult.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2"
            onClick={() => setUploadResult(null)}
          >
            Dismiss
          </Button>
        </AlertDescription>
      </Alert>
    )}

    <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents?.map((student) => (
          <Card key={student.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{student.user.name}</span>
                {student.classroom && (
                  <Badge variant="default">{student.classroom.name}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {student.user.email}
                </div>
                {student.user.phone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {student.user.phone}
                  </div>
                )}
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  DOB: {new Date(student.dateOfBirth).toLocaleDateString()}
                </div>
                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Roll Number</p>
                    <p className="font-semibold">{student.rollNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Admission No.</p>
                    <p className="font-semibold">{student.admissionNumber}</p>
                  </div>
                  {student.bloodGroup && (
                    <div>
                      <p className="text-xs text-gray-500">Blood Group</p>
                      <p className="font-semibold">{student.bloodGroup}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setEditingStudent(student);
                      setOpen(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setDeletingStudent(student)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deletingStudent} onOpenChange={() => setDeletingStudent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingStudent?.user.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingStudent) {
                  deleteMutation.mutate(deletingStudent.id);
                  setDeletingStudent(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {filteredStudents?.length === 0 && (
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No students found</p>
          </CardContent>
        </Card>
      )}
      </div>
    </DashboardLayout>
  );
}
