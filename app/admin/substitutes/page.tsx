"use client";

import { useSession } from "@/lib/auth-client";
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
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { AdminHeader } from "@/components/admin/admin-header";
import { UserCheck } from "lucide-react";

interface UnassignedPeriod {
  id: string;
  classroomId: string;
  classroomName: string;
  classroomGrade: string;
  classroomSection: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  dayOfWeek: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  date: string;
}

interface SubstituteAssignment {
  id: string;
  originalTeacherId: string;
  originalTeacherName: string;
  substituteTeacherId: string;
  classroomId: string;
  classroomName: string;
  classroomGrade: string;
  classroomSection: string;
  subjectId: string;
  subjectName: string;
  date: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  reason?: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
}

export default function SubstitutesManagementPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [assignDialog, setAssignDialog] = useState<{
    open: boolean;
    period: UnassignedPeriod | null;
  }>({
    open: false,
    period: null,
  });
  const [selectedTeacher, setSelectedTeacher] = useState("");

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/signin");
    }
  }, [session, isPending, router]);

  // Fetch unassigned periods
  const { data: unassignedPeriods, isLoading: loadingUnassigned } = useQuery<
    UnassignedPeriod[]
  >({
    queryKey: ["unassigned-periods", selectedDate],
    queryFn: async () => {
      const res = await fetch(
        `/api/substitute-assignments/unassigned?date=${selectedDate}`,
      );
      if (!res.ok) throw new Error("Failed to fetch unassigned periods");
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  // Fetch all substitute assignments
  const { data: assignments, isLoading: loadingAssignments } = useQuery<
    SubstituteAssignment[]
  >({
    queryKey: ["substitute-assignments", selectedDate],
    queryFn: async () => {
      const res = await fetch(
        `/api/substitute-assignments?date=${selectedDate}`,
      );
      if (!res.ok) throw new Error("Failed to fetch assignments");
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  // Fetch all teachers
  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ["teachers"],
    queryFn: async () => {
      const res = await fetch("/api/teachers");
      if (!res.ok) throw new Error("Failed to fetch teachers");
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  // Assign substitute mutation
  const assignMutation = useMutation({
    mutationFn: async (data: {
      originalTeacherId: string;
      substituteTeacherId: string;
      classroomId: string;
      subjectId: string;
      date: string;
      periodNumber: number;
      startTime: string;
      endTime: string;
      assignedBy: string;
    }) => {
      const res = await fetch("/api/substitute-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to assign substitute");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Substitute assigned successfully");
      setAssignDialog({ open: false, period: null });
      setSelectedTeacher("");
      queryClient.invalidateQueries({ queryKey: ["unassigned-periods"] });
      queryClient.invalidateQueries({ queryKey: ["substitute-assignments"] });
    },
    onError: () => {
      toast.error("Failed to assign substitute");
    },
  });

  // Delete assignment mutation
  const deleteMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await fetch(`/api/substitute-assignments/${assignmentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete assignment");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Assignment deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["unassigned-periods"] });
      queryClient.invalidateQueries({ queryKey: ["substitute-assignments"] });
    },
    onError: () => {
      toast.error("Failed to delete assignment");
    },
  });

  if (isPending || loadingUnassigned || loadingAssignments) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  const handleAssign = () => {
    if (!assignDialog.period || !selectedTeacher) return;
    assignMutation.mutate({
      originalTeacherId: assignDialog.period.teacherId,
      substituteTeacherId: selectedTeacher,
      classroomId: assignDialog.period.classroomId,
      subjectId: assignDialog.period.subjectId,
      date: assignDialog.period.date,
      periodNumber: assignDialog.period.periodNumber,
      startTime: assignDialog.period.startTime,
      endTime: assignDialog.period.endTime,
      assignedBy: session?.user?.id || "",
    });
  };

  return (
    <DashboardLayout
      title="Substitute Management"
      description="Assign substitute teachers to periods"
    >
      <div className="space-y-6">
        <AdminHeader
          icon={UserCheck}
          title="Substitute Management"
          description="Assign substitute teachers to unassigned periods"
        />

        {/* Date Selector */}
        <div className="flex flex-col gap-2">
          <Label>Select Date</Label>
          <Input
            type="date"
            className="rounded-xl max-w-xs"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Unassigned Periods
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {unassignedPeriods?.length || 0}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Assigned Substitutes
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {assignments?.length || 0}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unassigned Periods */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Periods Needing Substitutes</CardTitle>
            <CardDescription>
              Assign substitute teachers to these periods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {unassignedPeriods?.map((period) => (
              <Card
                key={period.id}
                className="rounded-xl border-l-4 border-l-red-500"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">
                          {period.classroomName} - {period.subjectName}
                        </h4>
                        <Badge variant="outline">
                          Period {period.periodNumber}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>Time:</strong> {period.startTime} -{" "}
                        {period.endTime}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Original Teacher:</strong> {period.teacherName}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="rounded-xl"
                      onClick={() => setAssignDialog({ open: true, period })}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Assign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!unassignedPeriods || unassignedPeriods.length === 0) && (
              <p className="text-center py-8 text-muted-foreground">
                All periods have been assigned substitutes
              </p>
            )}
          </CardContent>
        </Card>

        {/* Assigned Substitutes */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Assigned Substitutes</CardTitle>
            <CardDescription>
              View and manage substitute assignments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignments?.map((assignment) => (
              <Card
                key={assignment.id}
                className="rounded-xl border-l-4 border-l-green-500"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">
                          {assignment.classroomName} - {assignment.subjectName}
                        </h4>
                        <Badge variant="outline">
                          Period {assignment.periodNumber}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>Time:</strong> {assignment.startTime} -{" "}
                        {assignment.endTime}
                      </p>
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>Original Teacher:</strong>{" "}
                        {assignment.originalTeacherName}
                      </p>
                      {assignment.reason && (
                        <p className="text-sm mb-1">
                          <strong>Reason:</strong> {assignment.reason}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="rounded-xl"
                      onClick={() => deleteMutation.mutate(assignment.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!assignments || assignments.length === 0) && (
              <p className="text-center py-8 text-muted-foreground">
                No substitute assignments for this date
              </p>
            )}
          </CardContent>
        </Card>

        {/* Assignment Dialog */}
        <Dialog
          open={assignDialog.open}
          onOpenChange={(open) =>
            !open && setAssignDialog({ open: false, period: null })
          }
        >
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Assign Substitute Teacher</DialogTitle>
              <DialogDescription>
                Select a teacher to substitute for this period
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {assignDialog.period && (
                <div className="bg-muted p-4 rounded-xl">
                  <p className="font-semibold">
                    {assignDialog.period.classroomName} -{" "}
                    {assignDialog.period.subjectName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Period {assignDialog.period.periodNumber} |{" "}
                    {assignDialog.period.startTime} -{" "}
                    {assignDialog.period.endTime}
                  </p>
                  <p className="text-sm mt-1">
                    Original: {assignDialog.period.teacherName}
                  </p>
                </div>
              )}
              <div>
                <Label>Select Substitute Teacher</Label>
                <Select
                  value={selectedTeacher}
                  onValueChange={setSelectedTeacher}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Choose a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers?.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name} ({teacher.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 rounded-xl"
                  onClick={handleAssign}
                  disabled={assignMutation.isPending || !selectedTeacher}
                >
                  {assignMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  Assign Substitute
                </Button>
                <Button
                  className="rounded-xl"
                  variant="outline"
                  onClick={() => setAssignDialog({ open: false, period: null })}
                  disabled={assignMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
