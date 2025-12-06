"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Search,
  Edit2,
  Trash2,
  Upload,
  LayoutGrid,
  Table as TableIcon,
  HeartPulse,
  AlertTriangle,
  GraduationCap,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { DataTable } from "@/components/ui/data-table";
import { createStudentColumns, Student } from "./components/columns";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { getAllStudents, createStudent, updateStudent, deleteStudent } from "@/actions/admin";
import { getAllClassrooms } from "@/actions/classrooms";

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
  const [medicalDialogOpen, setMedicalDialogOpen] = useState(false);
  const [disciplinaryDialogOpen, setDisciplinaryDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const queryClient = useQueryClient();

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: async () => {
      const result = await getAllStudents();
      return result;
    },
  });

  // Fetch classrooms
  const { data: classrooms } = useQuery<Classroom[]>({
    queryKey: ["classrooms"],
    queryFn: async () => {
      const result = await getAllClassrooms();
      if (!result.success || !result.data) throw new Error(result.error || "Failed to fetch classrooms");
      return result.data.map((c) => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
        section: c.section,
      }));
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
      house: string;
    }) => {
      const result = await createStudent(data);
      if (!result.success) {
        throw new Error(result.error || "Failed to create student");
      }
      return result.data;
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
      house?: string;
    }) => {
      const { id, ...body } = data;
      const result = await updateStudent(id, body);
      if (!result.success) {
        throw new Error(result.error || "Failed to update student");
      }
      return result.data;
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
      const result = await deleteStudent(id);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete student");
      }
      return result;
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
      setUploadResult({
        success: data.success,
        failed: data.failed,
        errors: data.errors || [],
      });
    },
    onError: (error: Error) => {
      setUploadResult({ success: 0, failed: 0, errors: [error.message] });
    },
  });

  const createMedicalIncidentMutation = useMutation({
    mutationFn: async (data: {
      studentId: string;
      incidentDate: string;
      incidentType: string;
      description: string;
      treatment?: string;
      severity: string;
      followUpRequired: boolean;
      followUpNotes?: string;
      parentNotified: boolean;
    }) => {
      const response = await fetch("/api/students/medical-incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create medical incident");
      }
      return response.json();
    },
    onSuccess: () => {
      setMedicalDialogOpen(false);
      setSelectedStudent(null);
    },
  });

  const createDisciplinaryActionMutation = useMutation({
    mutationFn: async (data: {
      studentId: string;
      incidentDate: string;
      actionType: string;
      severity: string;
      description: string;
      actionTaken: string;
      witnessesOrInvolved?: string;
      parentNotified: boolean;
      parentMeetingRequired: boolean;
      parentMeetingDate?: string;
      resolutionNotes?: string;
    }) => {
      const response = await fetch("/api/students/disciplinary-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create disciplinary action");
      }
      return response.json();
    },
    onSuccess: () => {
      setDisciplinaryDialogOpen(false);
      setSelectedStudent(null);
    },
  });

  const handleCSVUpload = async () => {
    if (!csvFile) return;

    const text = await csvFile.text();
    const lines = text.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

    const students = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
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
      house: formData.get("house") as string,
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

  const filteredStudents = students?.filter(
    (student) =>
      student.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const columns = createStudentColumns({
    onEdit: (student) => {
      setEditingStudent(student);
      setOpen(true);
    },
    onDelete: (student) => {
      setDeletingStudent(student);
    },
    onMedical: (student) => {
      setSelectedStudent(student);
      setMedicalDialogOpen(true);
    },
    onDisciplinary: (student) => {
      setSelectedStudent(student);
      setDisciplinaryDialogOpen(true);
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Students Management" description="Admin Portal">
        <div className="text-center py-12">Loading students...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Students Management" description="Admin Portal">
      <div className="space-y-4 sm:space-y-6">
        <AdminHeader
          icon={GraduationCap}
          title="Students Management"
          description="Manage students and their enrollment"
        >
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() =>
                setViewMode(viewMode === "grid" ? "table" : "grid")
              }
              className="flex-1 sm:flex-none"
            >
              {viewMode === "grid" ? (
                <>
                  <TableIcon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Table View</span>
                  <span className="sm:hidden">Table</span>
                </>
              ) : (
                <>
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Grid View</span>
                  <span className="sm:hidden">Grid</span>
                </>
              )}
            </Button>
            <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 sm:flex-none">
                  <Upload className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Upload CSV</span>
                  <span className="sm:hidden">CSV</span>
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
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      CSV should have headers: name, email, password, phone,
                      address, rollNumber, admissionNumber, dateOfBirth,
                      bloodGroup, classroomId
                    </p>
                  </div>
                  <Button
                    onClick={handleCSVUpload}
                    disabled={!csvFile || bulkUploadMutation.isPending}
                    className="w-full"
                  >
                    {bulkUploadMutation.isPending
                      ? "Uploading..."
                      : "Upload Students"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog
              open={open}
              onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) setEditingStudent(null);
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingStudent ? "Edit Student" : "Add New Student"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        required
                        defaultValue={editingStudent?.user.name}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        defaultValue={editingStudent?.user.email}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="password">
                      Password {editingStudent ? "" : "*"}
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required={!editingStudent}
                      minLength={6}
                      placeholder={
                        editingStudent
                          ? "Leave blank to keep current password"
                          : ""
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rollNumber">Roll Number *</Label>
                      <Input
                        id="rollNumber"
                        name="rollNumber"
                        required
                        defaultValue={editingStudent?.rollNumber}
                      />
                    </div>
                    <div>
                      <Label htmlFor="admissionNumber">
                        Admission Number *
                      </Label>
                      <Input
                        id="admissionNumber"
                        name="admissionNumber"
                        required
                        defaultValue={editingStudent?.admissionNumber}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        required
                        defaultValue={
                          editingStudent?.dateOfBirth
                            ? new Date(editingStudent.dateOfBirth)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="bloodGroup">Blood Group</Label>
                      <Select
                        name="bloodGroup"
                        defaultValue={editingStudent?.bloodGroup || undefined}
                      >
                        <SelectTrigger id="bloodGroup" className="w-full">
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
                    <div>
                      <Label htmlFor="house">House</Label>
                      <Select
                        name="house"
                        defaultValue={editingStudent?.house || undefined}
                      >
                        <SelectTrigger id="house" className="w-full">
                          <SelectValue placeholder="Select house" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Amritamayi">Amritamayi</SelectItem>
                          <SelectItem value="Anandamayi">Anandamayi</SelectItem>
                          <SelectItem value="Chinmayi">Chinmayi</SelectItem>
                          <SelectItem value="Jothyrmayi">Jothyrmayi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="classroomId">Assign to Classroom</Label>
                      <Select name="classroomId">
                        <SelectTrigger id="classroomId" className="w-full">
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
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        defaultValue={editingStudent?.user.phone || ""}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" name="address" />
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
                      onClick={() => {
                        setOpen(false);
                        setEditingStudent(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        createMutation.isPending || updateMutation.isPending
                      }
                    >
                      {editingStudent
                        ? updateMutation.isPending
                          ? "Updating..."
                          : "Update Student"
                        : createMutation.isPending
                          ? "Creating..."
                          : "Create Student"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </AdminHeader>

        {uploadResult && (
          <Alert
            variant={uploadResult.failed > 0 ? "destructive" : "default"}
            className="mb-4"
          >
            <AlertDescription>
              <div className="font-semibold mb-2">
                Bulk Upload Complete: {uploadResult.success} succeeded,{" "}
                {uploadResult.failed} failed
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

        {viewMode === "table" ? (
          <DataTable
            columns={columns}
            data={filteredStudents || []}
            searchKey="name"
            searchPlaceholder="Search students by name, roll number, or admission number..."
          />
        ) : (
          <>
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
                        <Badge variant="default">
                          {student.classroom.name}
                        </Badge>
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
                        DOB:{" "}
                        {new Date(student.dateOfBirth).toLocaleDateString()}
                      </div>
                      <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-gray-500">Roll Number</p>
                          <p className="font-semibold">{student.rollNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Admission No.</p>
                          <p className="font-semibold">
                            {student.admissionNumber}
                          </p>
                        </div>
                        {student.bloodGroup && (
                          <div>
                            <p className="text-xs text-gray-500">Blood Group</p>
                            <p className="font-semibold">
                              {student.bloodGroup}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Link href={`/admin/students/${student.id}`}>
                          <Button variant="default" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingStudent(student);
                            setOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedStudent(student);
                            setMedicalDialogOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 border-blue-300 hover:bg-blue-50"
                          title="Medical Records"
                        >
                          <HeartPulse className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedStudent(student);
                            setDisciplinaryDialogOpen(true);
                          }}
                          className="text-orange-600 hover:text-orange-700 border-orange-300 hover:bg-orange-50"
                          title="Disciplinary Actions"
                        >
                          <AlertTriangle className="h-4 w-4" />
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

            {filteredStudents?.length === 0 && (
              <Card className="rounded-2xl shadow-sm">
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No students found</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <AlertDialog
          open={!!deletingStudent}
          onOpenChange={() => setDeletingStudent(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Student</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {deletingStudent?.user.name}?
                This action cannot be undone.
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

        {/* Medical Incident Dialog */}
        <Dialog
          open={medicalDialogOpen}
          onOpenChange={(isOpen) => {
            setMedicalDialogOpen(isOpen);
            if (!isOpen) setSelectedStudent(null);
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-blue-600" />
                Add Medical Incident - {selectedStudent?.user.name}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createMedicalIncidentMutation.mutate({
                  studentId: selectedStudent!.id,
                  incidentDate: formData.get("incidentDate") as string,
                  incidentType: formData.get("incidentType") as string,
                  description: formData.get("description") as string,
                  treatment: formData.get("treatment") as string,
                  severity: formData.get("severity") as string,
                  followUpRequired: formData.get("followUpRequired") === "on",
                  followUpNotes: formData.get("followUpNotes") as string,
                  parentNotified: formData.get("parentNotified") === "on",
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="incidentDate">Incident Date *</Label>
                  <Input
                    id="incidentDate"
                    name="incidentDate"
                    type="datetime-local"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="incidentType">Incident Type *</Label>
                  <Select name="incidentType">
                    <SelectTrigger id="incidentType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Injury">Injury</SelectItem>
                      <SelectItem value="Illness">Illness</SelectItem>
                      <SelectItem value="Allergy Reaction">
                        Allergy Reaction
                      </SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="severity">Severity *</Label>
                <Select name="severity">
                  <SelectTrigger id="severity">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Minor">Minor</SelectItem>
                    <SelectItem value="Moderate">Moderate</SelectItem>
                    <SelectItem value="Severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  name="description"
                  required
                  placeholder="Describe what happened"
                />
              </div>
              <div>
                <Label htmlFor="treatment">Treatment Provided</Label>
                <Input
                  id="treatment"
                  name="treatment"
                  placeholder="Treatment given"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="followUpRequired"
                  name="followUpRequired"
                  className="rounded"
                />
                <Label htmlFor="followUpRequired">Follow-up Required</Label>
              </div>
              <div>
                <Label htmlFor="followUpNotes">Follow-up Notes</Label>
                <Input
                  id="followUpNotes"
                  name="followUpNotes"
                  placeholder="Any follow-up instructions"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="parentNotified"
                  name="parentNotified"
                  className="rounded"
                />
                <Label htmlFor="parentNotified">Parent Notified</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setMedicalDialogOpen(false);
                    setSelectedStudent(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMedicalIncidentMutation.isPending}
                >
                  {createMedicalIncidentMutation.isPending
                    ? "Adding..."
                    : "Add Record"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Disciplinary Action Dialog */}
        <Dialog
          open={disciplinaryDialogOpen}
          onOpenChange={(isOpen) => {
            setDisciplinaryDialogOpen(isOpen);
            if (!isOpen) setSelectedStudent(null);
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Add Disciplinary Action - {selectedStudent?.user.name}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createDisciplinaryActionMutation.mutate({
                  studentId: selectedStudent!.id,
                  incidentDate: formData.get("incidentDate") as string,
                  actionType: formData.get("actionType") as string,
                  severity: formData.get("severity") as string,
                  description: formData.get("description") as string,
                  actionTaken: formData.get("actionTaken") as string,
                  witnessesOrInvolved: formData.get(
                    "witnessesOrInvolved",
                  ) as string,
                  parentNotified: formData.get("parentNotified") === "on",
                  parentMeetingRequired:
                    formData.get("parentMeetingRequired") === "on",
                  parentMeetingDate: formData.get(
                    "parentMeetingDate",
                  ) as string,
                  resolutionNotes: formData.get("resolutionNotes") as string,
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="disc-incidentDate">Incident Date *</Label>
                  <Input
                    id="disc-incidentDate"
                    name="incidentDate"
                    type="datetime-local"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="actionType">Action Type *</Label>
                  <Select name="actionType">
                    <SelectTrigger id="actionType">
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Warning">Warning</SelectItem>
                      <SelectItem value="Detention">Detention</SelectItem>
                      <SelectItem value="Suspension">Suspension</SelectItem>
                      <SelectItem value="Counseling">Counseling</SelectItem>
                      <SelectItem value="Probation">Probation</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="disc-severity">Severity *</Label>
                <Select name="severity">
                  <SelectTrigger id="disc-severity">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Minor">Minor</SelectItem>
                    <SelectItem value="Moderate">Moderate</SelectItem>
                    <SelectItem value="Severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="disc-description">
                  What Happened (Description) *
                </Label>
                <Input
                  id="disc-description"
                  name="description"
                  required
                  placeholder="Describe the incident"
                />
              </div>
              <div>
                <Label htmlFor="actionTaken">Action Taken *</Label>
                <Input
                  id="actionTaken"
                  name="actionTaken"
                  required
                  placeholder="What action was taken"
                />
              </div>
              <div>
                <Label htmlFor="witnessesOrInvolved">
                  Witnesses or Others Involved
                </Label>
                <Input
                  id="witnessesOrInvolved"
                  name="witnessesOrInvolved"
                  placeholder="Names of witnesses or other students involved"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="disc-parentNotified"
                  name="parentNotified"
                  className="rounded"
                />
                <Label htmlFor="disc-parentNotified">Parent Notified</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="parentMeetingRequired"
                  name="parentMeetingRequired"
                  className="rounded"
                />
                <Label htmlFor="parentMeetingRequired">
                  Parent Meeting Required
                </Label>
              </div>
              <div>
                <Label htmlFor="parentMeetingDate">Parent Meeting Date</Label>
                <Input
                  id="parentMeetingDate"
                  name="parentMeetingDate"
                  type="datetime-local"
                />
              </div>
              <div>
                <Label htmlFor="resolutionNotes">Resolution Notes</Label>
                <Input
                  id="resolutionNotes"
                  name="resolutionNotes"
                  placeholder="Notes about resolution or next steps"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDisciplinaryDialogOpen(false);
                    setSelectedStudent(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createDisciplinaryActionMutation.isPending}
                >
                  {createDisciplinaryActionMutation.isPending
                    ? "Adding..."
                    : "Add Action"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
