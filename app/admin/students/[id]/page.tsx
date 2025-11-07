"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Heart,
  GraduationCap,
  UserCheck,
  Home,
  Users,
  HeartPulse,
  AlertTriangle,
  Plus,
  Download,
  FileText,
  Printer,
} from "lucide-react";
import {
  exportMedicalIncidentsToCSV,
  exportDisciplinaryActionsToCSV,
  exportStudentReport,
  printMedicalIncidentsReport,
  printDisciplinaryActionsReport,
} from "@/lib/export-utils";

interface StudentDetail {
  id: string;
  rollNumber: string;
  admissionNumber: string;
  dateOfBirth: string;
  bloodGroup: string | null;
  medicalInfo: string | null;
  house: string | null;
  user: {
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
  };
  classroom: {
    name: string;
    grade: string;
    section: string;
  } | null;
  parent: {
    name: string;
    email: string;
    phone: string | null;
  } | null;
}

interface MedicalIncident {
  id: string;
  studentId: string;
  incidentDate: string;
  incidentType: string;
  description: string;
  treatment: string | null;
  severity: string;
  followUpRequired: boolean;
  followUpNotes: string | null;
  parentNotified: boolean;
  reportedBy: string;
  reporter: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface DisciplinaryAction {
  id: string;
  studentId: string;
  incidentDate: string;
  incidentType: string;
  severity: string;
  description: string;
  actionTaken: string | null;
  witnesses: string | null;
  resolution: string | null;
  parentMeetingRequired: boolean;
  parentMeetingDate: string | null;
  reportedBy: string;
  reporter: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface AttendanceStats {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}

interface ExamResult {
  id: string;
  examName: string;
  subjectName: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  date: string;
}

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.id as string;
  const queryClient = useQueryClient();
  const [medicalDialogOpen, setMedicalDialogOpen] = useState(false);
  const [disciplinaryDialogOpen, setDisciplinaryDialogOpen] = useState(false);
  const [medicalFilter, setMedicalFilter] = useState<string>("all");
  const [disciplinaryFilter, setDisciplinaryFilter] = useState<string>("all");

  const { data: student, isLoading } = useQuery<StudentDetail>({
    queryKey: ["student", studentId],
    queryFn: async () => {
      const response = await fetch(`/api/students/${studentId}`);
      if (!response.ok) throw new Error("Failed to fetch student");
      return response.json();
    },
  });

  const { data: attendanceStats } = useQuery<AttendanceStats>({
    queryKey: ["student-attendance", studentId],
    queryFn: async () => {
      const response = await fetch(
        `/api/students/${studentId}/attendance-stats`,
      );
      if (!response.ok) throw new Error("Failed to fetch attendance");
      return response.json();
    },
  });

  const { data: examResults } = useQuery<ExamResult[]>({
    queryKey: ["student-exams", studentId],
    queryFn: async () => {
      const response = await fetch(`/api/students/${studentId}/exam-results`);
      if (!response.ok) throw new Error("Failed to fetch exam results");
      return response.json();
    },
  });

  const { data: medicalIncidents } = useQuery<MedicalIncident[]>({
    queryKey: ["medical-incidents", studentId],
    queryFn: async () => {
      const response = await fetch(
        `/api/students/medical-incidents?studentId=${studentId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch medical incidents");
      return response.json();
    },
  });

  const { data: disciplinaryActions } = useQuery<DisciplinaryAction[]>({
    queryKey: ["disciplinary-actions", studentId],
    queryFn: async () => {
      const response = await fetch(
        `/api/students/disciplinary-actions?studentId=${studentId}`,
      );
      if (!response.ok)
        throw new Error("Failed to fetch disciplinary actions");
      return response.json();
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
      queryClient.invalidateQueries({
        queryKey: ["medical-incidents", studentId],
      });
      setMedicalDialogOpen(false);
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
        throw new Error(
          error.error || "Failed to create disciplinary action",
        );
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["disciplinary-actions", studentId],
      });
      setDisciplinaryDialogOpen(false);
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Student Details" description="Admin Portal">
        <div className="text-center py-12">Loading student details...</div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout title="Student Details" description="Admin Portal">
        <div className="text-center py-12">Student not found</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Details" description="Admin Portal">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/students">
              <Button variant="ghost" size="sm" className="rounded-xl">
                ← Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{student.user.name}</h1>
              <p className="text-muted-foreground">
                Roll No: {student.rollNumber} | Admission No:{" "}
                {student.admissionNumber}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => {
              if (medicalIncidents && disciplinaryActions) {
                exportStudentReport(
                  student.user.name,
                  medicalIncidents as unknown as Parameters<typeof exportStudentReport>[1],
                  disciplinaryActions as unknown as Parameters<typeof exportStudentReport>[2]
                );
              }
            }}
            disabled={
              (!medicalIncidents || medicalIncidents.length === 0) &&
              (!disciplinaryActions || disciplinaryActions.length === 0)
            }
          >
            <FileText className="h-4 w-4 mr-2" />
            Export Full Report
          </Button>
        </div>

        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList>
            <TabsTrigger value="basic">
              <User className="h-4 w-4 mr-2" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="medical">
              <Heart className="h-4 w-4 mr-2" />
              Medical Info
            </TabsTrigger>
            <TabsTrigger value="medical-incidents">
              <HeartPulse className="h-4 w-4 mr-2" />
              Medical Incidents
            </TabsTrigger>
            <TabsTrigger value="disciplinary">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Disciplinary
            </TabsTrigger>
            <TabsTrigger value="performance">
              <GraduationCap className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="attendance">
              <UserCheck className="h-4 w-4 mr-2" />
              Attendance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{student.user.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{student.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">
                        {student.user.phone || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Date of Birth
                      </p>
                      <p className="font-medium">
                        {new Date(student.dateOfBirth).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">
                        {student.user.address || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Home className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Class & Section
                      </p>
                      <p className="font-medium">
                        {student.classroom
                          ? `${student.classroom.name}`
                          : "Not assigned"}
                      </p>
                    </div>
                  </div>
                  {student.house && (
                    <div className="flex items-start gap-3">
                      <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">House</p>
                        <Badge
                          className={
                            student.house === "Amritamayi"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                              : student.house === "Anandamayi"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                              : student.house === "Chinmayi"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                          }
                        >
                          {student.house}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Parent/Guardian Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {student.parent ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Parent Name
                        </p>
                        <p className="font-medium">{student.parent.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Parent Email
                        </p>
                        <p className="font-medium">{student.parent.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Parent Phone
                        </p>
                        <p className="font-medium">
                          {student.parent.phone || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No parent information available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medical" className="space-y-4">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Medical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Blood Group
                    </p>
                    {student.bloodGroup ? (
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {student.bloodGroup}
                      </Badge>
                    ) : (
                      <p className="text-muted-foreground">Not provided</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Medical History & Allergies
                  </p>
                  <div className="bg-muted p-4 rounded-xl">
                    {student.medicalInfo ? (
                      <p className="whitespace-pre-wrap">
                        {student.medicalInfo}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        No medical information recorded
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medical-incidents" className="space-y-4">
            {/* Medical Incidents Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="rounded-2xl">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {medicalIncidents?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total Incidents
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">
                    {
                      medicalIncidents?.filter(
                        (i: MedicalIncident) => i.severity === "critical"
                      ).length || 0
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">Critical</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-orange-600">
                    {
                      medicalIncidents?.filter(
                        (i: MedicalIncident) => i.followUpRequired
                      ).length || 0
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Requires Follow-up
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">
                    {
                      medicalIncidents?.filter(
                        (i: MedicalIncident) => i.parentNotified
                      ).length || 0
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Parents Notified
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Medical Incidents</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => medicalIncidents && printMedicalIncidentsReport(medicalIncidents as unknown as Parameters<typeof printMedicalIncidentsReport>[0], student?.user?.name || "Student")}
                    disabled={!medicalIncidents || medicalIncidents.length === 0}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => medicalIncidents && exportMedicalIncidentsToCSV(medicalIncidents as unknown as Parameters<typeof exportMedicalIncidentsToCSV>[0], student?.user?.name || "Student")}
                    disabled={!medicalIncidents || medicalIncidents.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Select value={medicalFilter} onValueChange={setMedicalFilter}>
                    <SelectTrigger className="w-[180px] rounded-xl">
                      <SelectValue placeholder="Filter by severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Incidents</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="followup">Needs Follow-up</SelectItem>
                    </SelectContent>
                  </Select>
                  <Dialog
                    open={medicalDialogOpen}
                    onOpenChange={setMedicalDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" className="rounded-xl">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Incident
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <HeartPulse className="h-5 w-5 text-blue-600" />
                        Add Medical Incident
                      </DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        createMedicalIncidentMutation.mutate({
                          studentId: studentId,
                          incidentDate: formData.get("incidentDate") as string,
                          incidentType: formData.get("incidentType") as string,
                          description: formData.get("description") as string,
                          treatment: formData.get("treatment") as string,
                          severity: formData.get("severity") as string,
                          followUpRequired:
                            formData.get("followUpRequired") === "on",
                          followUpNotes: formData.get("followUpNotes") as string,
                          parentNotified:
                            formData.get("parentNotified") === "on",
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
                            className="rounded-xl"
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
                          className="rounded-xl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="treatment">Treatment Provided</Label>
                        <Input
                          id="treatment"
                          name="treatment"
                          placeholder="Treatment given"
                          className="rounded-xl"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="followUpRequired"
                          name="followUpRequired"
                          className="rounded"
                        />
                        <Label htmlFor="followUpRequired">
                          Follow-up Required
                        </Label>
                      </div>
                      <div>
                        <Label htmlFor="followUpNotes">Follow-up Notes</Label>
                        <Input
                          id="followUpNotes"
                          name="followUpNotes"
                          placeholder="Any follow-up instructions"
                          className="rounded-xl"
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
                          onClick={() => setMedicalDialogOpen(false)}
                          className="rounded-xl"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="rounded-xl"
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
                </div>
              </CardHeader>
              <CardContent>
                {medicalIncidents && medicalIncidents.length > 0 ? (
                  <div className="space-y-3">
                    {medicalIncidents
                      .filter((incident: MedicalIncident) => {
                        if (medicalFilter === "all") return true;
                        if (medicalFilter === "followup") return incident.followUpRequired;
                        return incident.severity === medicalFilter;
                      })
                      .map((incident: MedicalIncident) => (
                      <div
                        key={incident.id}
                        className="p-4 border rounded-xl space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  incident.severity === "Severe"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {incident.severity}
                              </Badge>
                              <Badge variant="outline">
                                {incident.incidentType}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(
                                incident.incidentDate,
                              ).toLocaleString()}
                            </p>
                          </div>
                          {incident.parentNotified && (
                            <Badge variant="outline">Parent Notified</Badge>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">Description:</p>
                          <p className="text-sm">{incident.description}</p>
                        </div>
                        {incident.treatment && (
                          <div>
                            <p className="font-medium">Treatment:</p>
                            <p className="text-sm">{incident.treatment}</p>
                          </div>
                        )}
                        {incident.followUpRequired && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                              Follow-up Required
                            </p>
                            {incident.followUpNotes && (
                              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                {incident.followUpNotes}
                              </p>
                            )}
                          </div>
                        )}
                        {incident.reporter && (
                          <p className="text-xs text-muted-foreground">
                            Reported by: {incident.reporter.name} (
                            {incident.reporter.email})
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No medical incidents recorded
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disciplinary" className="space-y-4">
            {/* Disciplinary Actions Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="rounded-2xl">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {disciplinaryActions?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total Actions
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">
                    {
                      disciplinaryActions?.filter(
                        (a: DisciplinaryAction) => a.severity === "Severe"
                      ).length || 0
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">Severe</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-orange-600">
                    {
                      disciplinaryActions?.filter(
                        (a: DisciplinaryAction) => a.parentMeetingRequired
                      ).length || 0
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Parent Meetings Required
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">
                    {
                      disciplinaryActions?.filter(
                        (a: DisciplinaryAction) => a.severity === "Minor"
                      ).length || 0
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minor Incidents
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Disciplinary Actions</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => disciplinaryActions && printDisciplinaryActionsReport(disciplinaryActions as unknown as Parameters<typeof printDisciplinaryActionsReport>[0], student?.user?.name || "Student")}
                    disabled={!disciplinaryActions || disciplinaryActions.length === 0}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => disciplinaryActions && exportDisciplinaryActionsToCSV(disciplinaryActions as unknown as Parameters<typeof exportDisciplinaryActionsToCSV>[0], student?.user?.name || "Student")}
                    disabled={!disciplinaryActions || disciplinaryActions.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Select value={disciplinaryFilter} onValueChange={setDisciplinaryFilter}>
                    <SelectTrigger className="w-[180px] rounded-xl">
                      <SelectValue placeholder="Filter by severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="Severe">Severe</SelectItem>
                      <SelectItem value="Major">Major</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="Minor">Minor</SelectItem>
                      <SelectItem value="meeting">Requires Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                  <Dialog
                    open={disciplinaryDialogOpen}
                    onOpenChange={setDisciplinaryDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" className="rounded-xl">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Action
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        Add Disciplinary Action
                      </DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        createDisciplinaryActionMutation.mutate({
                          studentId: studentId,
                          incidentDate: formData.get("incidentDate") as string,
                          actionType: formData.get("actionType") as string,
                          severity: formData.get("severity") as string,
                          description: formData.get("description") as string,
                          actionTaken: formData.get("actionTaken") as string,
                          witnessesOrInvolved: formData.get(
                            "witnessesOrInvolved",
                          ) as string,
                          parentNotified:
                            formData.get("parentNotified") === "on",
                          parentMeetingRequired:
                            formData.get("parentMeetingRequired") === "on",
                          parentMeetingDate: formData.get(
                            "parentMeetingDate",
                          ) as string,
                          resolutionNotes: formData.get(
                            "resolutionNotes",
                          ) as string,
                        });
                      }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="disc-incidentDate">
                            Incident Date *
                          </Label>
                          <Input
                            id="disc-incidentDate"
                            name="incidentDate"
                            type="datetime-local"
                            required
                            className="rounded-xl"
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
                              <SelectItem value="Detention">
                                Detention
                              </SelectItem>
                              <SelectItem value="Suspension">
                                Suspension
                              </SelectItem>
                              <SelectItem value="Counseling">
                                Counseling
                              </SelectItem>
                              <SelectItem value="Probation">
                                Probation
                              </SelectItem>
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
                          className="rounded-xl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="actionTaken">Action Taken *</Label>
                        <Input
                          id="actionTaken"
                          name="actionTaken"
                          required
                          placeholder="What action was taken"
                          className="rounded-xl"
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
                          className="rounded-xl"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="disc-parentNotified"
                          name="parentNotified"
                          className="rounded"
                        />
                        <Label htmlFor="disc-parentNotified">
                          Parent Notified
                        </Label>
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
                        <Label htmlFor="parentMeetingDate">
                          Parent Meeting Date
                        </Label>
                        <Input
                          id="parentMeetingDate"
                          name="parentMeetingDate"
                          type="datetime-local"
                          className="rounded-xl"
                        />
                      </div>
                      <div>
                        <Label htmlFor="resolutionNotes">
                          Resolution Notes
                        </Label>
                        <Input
                          id="resolutionNotes"
                          name="resolutionNotes"
                          placeholder="Notes about resolution or next steps"
                          className="rounded-xl"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDisciplinaryDialogOpen(false)}
                          className="rounded-xl"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="rounded-xl"
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
              </CardHeader>
              <CardContent>
                {disciplinaryActions && disciplinaryActions.length > 0 ? (
                  <div className="space-y-3">
                    {disciplinaryActions
                      .filter((action: DisciplinaryAction) => {
                        if (disciplinaryFilter === "all") return true;
                        if (disciplinaryFilter === "meeting") return action.parentMeetingRequired;
                        return action.severity === disciplinaryFilter;
                      })
                      .map((action: DisciplinaryAction) => (
                      <div
                        key={action.id}
                        className="p-4 border rounded-xl space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  action.severity === "major" ||
                                  action.severity === "critical"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {action.severity}
                              </Badge>
                              <Badge variant="outline">
                                {action.incidentType}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(action.incidentDate).toLocaleString()}
                            </p>
                          </div>
                          {action.parentMeetingRequired && (
                            <Badge variant="outline" className="bg-yellow-50">
                              Parent Meeting Required
                            </Badge>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">Description:</p>
                          <p className="text-sm whitespace-pre-wrap">
                            {action.description}
                          </p>
                        </div>
                        {action.actionTaken && (
                          <div>
                            <p className="font-medium">Action Taken:</p>
                            <p className="text-sm">{action.actionTaken}</p>
                          </div>
                        )}
                        {action.witnesses && (
                          <div>
                            <p className="font-medium">Witnesses:</p>
                            <p className="text-sm">{action.witnesses}</p>
                          </div>
                        )}
                        {action.resolution && (
                          <div>
                            <p className="font-medium">Resolution:</p>
                            <p className="text-sm">{action.resolution}</p>
                          </div>
                        )}
                        {action.parentMeetingRequired && action.parentMeetingDate && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                              Parent Meeting: {new Date(action.parentMeetingDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Reported by: {action.reporter?.name || "Unknown"} ({action.reporter?.email || "N/A"})
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No disciplinary actions recorded
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Exam Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {examResults && examResults.length > 0 ? (
                  <div className="space-y-3">
                    {examResults.map((result) => (
                      <div
                        key={result.id}
                        className="flex items-center justify-between p-3 border rounded-xl"
                      >
                        <div>
                          <p className="font-medium">{result.examName}</p>
                          <p className="text-sm text-muted-foreground">
                            {result.subjectName} •{" "}
                            {new Date(result.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {result.marksObtained}/{result.totalMarks}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {result.percentage.toFixed(1)}%
                            </Badge>
                            <Badge>{result.grade}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No exam results available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Attendance Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceStats ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {attendanceStats.present}
                        </p>
                        <p className="text-sm text-muted-foreground">Present</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {attendanceStats.absent}
                        </p>
                        <p className="text-sm text-muted-foreground">Absent</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                          {attendanceStats.late}
                        </p>
                        <p className="text-sm text-muted-foreground">Late</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {attendanceStats.excused}
                        </p>
                        <p className="text-sm text-muted-foreground">Excused</p>
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-xl">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Working Days
                          </p>
                          <p className="text-2xl font-bold">
                            {attendanceStats.totalDays}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            Attendance Rate
                          </p>
                          <p className="text-2xl font-bold text-primary">
                            {attendanceStats.attendanceRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No attendance data available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
