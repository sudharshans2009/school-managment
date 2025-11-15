"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Eye,
  Trash2,
  GraduationCap,
  Calendar,
  Mail,
  Phone,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
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
import { AdminHeader } from "@/components/admin/admin-header";
import { toast } from "sonner";
import { useSession } from "@/lib/auth/client";
import {
  getAllAdmissions,
  getAdmissionById,
  updateAdmissionStatus,
  deleteAdmission,
  getAllEntranceTests,
  type AdmissionApplication,
} from "@/actions/admin";
import { format } from "date-fns";

export default function AdmissionsPage() {
  const [viewingAdmission, setViewingAdmission] =
    useState<AdmissionApplication | null>(null);
  const [deletingAdmission, setDeletingAdmission] =
    useState<AdmissionApplication | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const { data: admissions, isLoading } = useQuery<AdmissionApplication[]>({
    queryKey: ["admissions", statusFilter, gradeFilter],
    queryFn: async () => {
      const data = await getAllAdmissions({
        status: statusFilter !== "all" ? statusFilter : undefined,
        grade: gradeFilter !== "all" ? gradeFilter : undefined,
      });
      return data;
    },
  });

  useQuery({
    queryKey: ["entrance-tests"],
    queryFn: getAllEntranceTests,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      status?: string;
      testScore?: number;
      interviewDate?: Date | null;
      admissionDate?: Date | null;
      rejectionReason?: string;
      notes?: string;
    }) => {
      const { id, ...updateData } = data;
      const result = await updateAdmissionStatus(id, {
        ...updateData,
        reviewedBy: session?.user?.id || "",
      });
      if (!result.success) {
        throw new Error(result.error || "Failed to update admission");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admissions"] });
      toast.success("Admission updated successfully");
      setViewingAdmission(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteAdmission(id);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete admission");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admissions"] });
      toast.success("Admission deleted successfully");
      setDeletingAdmission(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setDeletingAdmission(null);
    },
  });

  const handleStatusUpdate = (
    admissionId: string,
    newStatus: string,
    additionalData?: {
      testScore?: number;
      rejectionReason?: string;
      notes?: string;
    },
  ) => {
    const data: {
      id: string;
      status: string;
      testScore?: number;
      rejectionReason?: string;
      notes?: string;
      admissionDate?: Date;
    } = {
      id: admissionId,
      status: newStatus,
      ...additionalData,
    };

    if (newStatus === "accepted") {
      data.admissionDate = new Date();
    }

    updateMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      under_review: "bg-blue-100 text-blue-800",
      test_scheduled: "bg-purple-100 text-purple-800",
      test_completed: "bg-indigo-100 text-indigo-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      waitlisted: "bg-orange-100 text-orange-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="h-3 w-3" />,
      under_review: <Eye className="h-3 w-3" />,
      test_scheduled: <Calendar className="h-3 w-3" />,
      test_completed: <FileText className="h-3 w-3" />,
      accepted: <CheckCircle className="h-3 w-3" />,
      rejected: <XCircle className="h-3 w-3" />,
      waitlisted: <Clock className="h-3 w-3" />,
    };
    return icons[status] || <FileText className="h-3 w-3" />;
  };

  const filteredAdmissions = admissions?.filter(
    (admission) =>
      admission.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admission.applicationNumber
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      admission.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return (
      <DashboardLayout title="Admission Management" description="Admin Portal">
        <div className="text-center">Loading admissions...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admission Management" description="Admin Portal">
      <div className="space-y-4 sm:space-y-6">
        <AdminHeader
          icon={GraduationCap}
          title="Admission Management"
          description="Manage student admission applications"
        />

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or application number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="test_scheduled">Test Scheduled</SelectItem>
                  <SelectItem value="test_completed">Test Completed</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="waitlisted">Waitlisted</SelectItem>
                </SelectContent>
              </Select>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                    <SelectItem key={grade} value={grade.toString()}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {admissions?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total Applications
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">
                {admissions?.filter((a) => a.status === "pending").length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Pending Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {admissions?.filter((a) => a.status === "accepted").length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Accepted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {admissions?.filter((a) => a.status === "rejected").length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Applications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAdmissions && filteredAdmissions.length > 0 ? (
            filteredAdmissions.map((admission) => (
              <Card
                key={admission.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {admission.studentName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {admission.applicationNumber}
                      </p>
                    </div>
                    <Badge className={getStatusColor(admission.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(admission.status)}
                        {admission.status.replace("_", " ")}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <GraduationCap className="h-4 w-4 mr-2 shrink-0" />
                    <span>Grade {admission.gradeAppliedFor}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 mr-2 shrink-0" />
                    <span className="truncate">{admission.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 mr-2 shrink-0" />
                    <span>{admission.phone}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <User className="h-4 w-4 mr-2 shrink-0" />
                    <span className="truncate">{admission.guardianName}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2 shrink-0" />
                    <span>
                      Applied:{" "}
                      {admission.createdAt
                        ? format(new Date(admission.createdAt), "PPP")
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const details = await getAdmissionById(admission.id);
                        setViewingAdmission(details);
                      }}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeletingAdmission(admission)}
                      disabled={
                        admission.status !== "pending" &&
                        admission.status !== "rejected"
                      }
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchQuery ||
                  statusFilter !== "all" ||
                  gradeFilter !== "all"
                    ? "No applications found matching your filters"
                    : "No admission applications found"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* View/Edit Dialog */}
        <Dialog
          open={!!viewingAdmission}
          onOpenChange={(open) => !open && setViewingAdmission(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Admission Application Details</DialogTitle>
            </DialogHeader>
            {viewingAdmission && (
              <div className="space-y-6">
                {/* Student Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Student Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">
                        Application Number
                      </Label>
                      <p className="font-medium">
                        {viewingAdmission.applicationNumber}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Current Status
                      </Label>
                      <Badge
                        className={getStatusColor(viewingAdmission.status)}
                      >
                        {viewingAdmission.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Full Name</Label>
                      <p className="font-medium">
                        {viewingAdmission.studentName}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Date of Birth
                      </Label>
                      <p className="font-medium">
                        {format(new Date(viewingAdmission.dateOfBirth), "PPP")}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Gender</Label>
                      <p className="font-medium">{viewingAdmission.gender}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Grade Applied For
                      </Label>
                      <p className="font-medium">
                        Grade {viewingAdmission.gradeAppliedFor}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{viewingAdmission.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <p className="font-medium">{viewingAdmission.phone}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Address</Label>
                      <p className="font-medium">{viewingAdmission.address}</p>
                    </div>
                    {viewingAdmission.previousSchool && (
                      <div className="col-span-2">
                        <Label className="text-muted-foreground">
                          Previous School
                        </Label>
                        <p className="font-medium">
                          {viewingAdmission.previousSchool}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Guardian Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Guardian Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">
                        Guardian Name
                      </Label>
                      <p className="font-medium">
                        {viewingAdmission.guardianName}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Relation</Label>
                      <p className="font-medium">
                        {viewingAdmission.guardianRelation}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Guardian Phone
                      </Label>
                      <p className="font-medium">
                        {viewingAdmission.guardianPhone}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Guardian Email
                      </Label>
                      <p className="font-medium">
                        {viewingAdmission.guardianEmail}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Update */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Update Application Status
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Status</Label>
                      <Select
                        defaultValue={viewingAdmission.status}
                        onValueChange={(value) => {
                          if (value === "rejected") {
                            const reason = prompt(
                              "Please enter rejection reason:",
                            );
                            if (reason) {
                              handleStatusUpdate(viewingAdmission.id, value, {
                                rejectionReason: reason,
                              });
                            }
                          } else {
                            handleStatusUpdate(viewingAdmission.id, value);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="under_review">
                            Under Review
                          </SelectItem>
                          <SelectItem value="test_scheduled">
                            Test Scheduled
                          </SelectItem>
                          <SelectItem value="test_completed">
                            Test Completed
                          </SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="waitlisted">Waitlisted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {viewingAdmission.testScore && (
                      <div>
                        <Label className="text-muted-foreground">
                          Test Score
                        </Label>
                        <p className="font-medium">
                          {viewingAdmission.testScore}
                        </p>
                      </div>
                    )}
                    {viewingAdmission.rejectionReason && (
                      <div className="col-span-2">
                        <Label className="text-muted-foreground">
                          Rejection Reason
                        </Label>
                        <p className="font-medium">
                          {viewingAdmission.rejectionReason}
                        </p>
                      </div>
                    )}
                    {viewingAdmission.notes && (
                      <div className="col-span-2">
                        <Label className="text-muted-foreground">Notes</Label>
                        <p className="font-medium">{viewingAdmission.notes}</p>
                      </div>
                    )}
                    {viewingAdmission.reviewer && (
                      <div className="col-span-2">
                        <Label className="text-muted-foreground">
                          Reviewed By
                        </Label>
                        <p className="font-medium">
                          {viewingAdmission.reviewer.name} (
                          {format(
                            new Date(viewingAdmission.reviewedAt!),
                            "PPP",
                          )}
                          )
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setViewingAdmission(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deletingAdmission}
          onOpenChange={(open) => !open && setDeletingAdmission(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the admission application for{" "}
                <strong>{deletingAdmission?.studentName}</strong>. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletingAdmission(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deletingAdmission) {
                    deleteMutation.mutate(deletingAdmission.id);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Application
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
