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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Loader2, Calendar, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { AdminHeader } from "@/components/admin/admin-header";

interface TeacherLeave {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  approvedBy?: string;
  approvalNotes?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function LeavesManagementPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedTab, setSelectedTab] = useState("pending");
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    leave: TeacherLeave | null;
    action: "approve" | "reject" | null;
  }>({
    open: false,
    leave: null,
    action: null,
  });
  const [approvalNotes, setApprovalNotes] = useState("");

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/signin");
    }
  }, [session, isPending, router]);

  // Fetch all leaves
  const { data: allLeaves, isLoading } = useQuery<TeacherLeave[]>({
    queryKey: ["teacher-leaves"],
    queryFn: async () => {
      const res = await fetch("/api/teacher-leaves");
      if (!res.ok) throw new Error("Failed to fetch leaves");
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  // Approve/Reject leave mutation
  const updateLeaveMutation = useMutation({
    mutationFn: async ({
      leaveId,
      status,
      notes,
    }: {
      leaveId: string;
      status: string;
      notes: string;
    }) => {
      const res = await fetch(`/api/teacher-leaves/${leaveId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          approvedBy: session?.user?.id,
          approvalNotes: notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to update leave");
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Leave ${variables.status === "approved" ? "approved" : "rejected"} successfully`,
      );
      setApprovalDialog({ open: false, leave: null, action: null });
      setApprovalNotes("");
      queryClient.invalidateQueries({ queryKey: ["teacher-leaves"] });
    },
    onError: () => {
      toast.error("Failed to update leave");
    },
  });

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  const pendingLeaves = allLeaves?.filter((l) => l.status === "pending") || [];
  const approvedLeaves =
    allLeaves?.filter((l) => l.status === "approved") || [];
  const rejectedLeaves =
    allLeaves?.filter((l) => l.status === "rejected") || [];

  const handleApproval = (action: "approve" | "reject") => {
    if (!approvalDialog.leave) return;
    updateLeaveMutation.mutate({
      leaveId: approvalDialog.leave.id,
      status: action === "approve" ? "approved" : "rejected",
      notes: approvalNotes,
    });
  };

  const LeaveCard = ({ leave }: { leave: TeacherLeave }) => (
    <Card key={leave.id} className="rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-semibold">{leave.teacherName}</h4>
              <Badge variant="outline" className="capitalize">
                {leave.leaveType}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              <Calendar className="h-3 w-3 inline mr-1" />
              {leave.startDate} to {leave.endDate}
            </p>
            <p className="text-sm mb-2">
              <strong>Reason:</strong> {leave.reason}
            </p>
            {leave.approvalNotes && (
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Notes:</strong> {leave.approvalNotes}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Requested on: {new Date(leave.createdAt).toLocaleString()}
            </p>
            {leave.approvedAt && (
              <p className="text-xs text-muted-foreground">
                {leave.status === "approved" ? "Approved" : "Rejected"} on:{" "}
                {new Date(leave.approvedAt).toLocaleString()}
              </p>
            )}
          </div>
          {leave.status === "pending" && (
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                className="rounded-xl bg-green-600 hover:bg-green-700"
                onClick={() =>
                  setApprovalDialog({ open: true, leave, action: "approve" })
                }
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-xl"
                onClick={() =>
                  setApprovalDialog({ open: true, leave, action: "reject" })
                }
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout
      title="Leave Management"
      description="Manage teacher leave requests"
    >
      <div className="space-y-6">
        <AdminHeader
          icon={Calendar}
          title="Leave Management"
          description="Review and manage teacher leave requests"
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Pending
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {pendingLeaves.length}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-xl">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Approved
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {approvedLeaves.length}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Rejected
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {rejectedLeaves.length}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-xl">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different statuses */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4 rounded-xl">
            <TabsTrigger value="pending" className="rounded-lg">
              Pending ({pendingLeaves.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="rounded-lg">
              Approved ({approvedLeaves.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-lg">
              Rejected ({rejectedLeaves.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg">
              All ({allLeaves?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Pending Leave Requests</CardTitle>
                <CardDescription>
                  Review and approve or reject leave requests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingLeaves.map((leave) => (
                  <LeaveCard key={leave.id} leave={leave} />
                ))}
                {pendingLeaves.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">
                    No pending leave requests
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Approved Leaves</CardTitle>
                <CardDescription>View approved leave requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {approvedLeaves.map((leave) => (
                  <LeaveCard key={leave.id} leave={leave} />
                ))}
                {approvedLeaves.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">
                    No approved leaves
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Rejected Leaves</CardTitle>
                <CardDescription>View rejected leave requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {rejectedLeaves.map((leave) => (
                  <LeaveCard key={leave.id} leave={leave} />
                ))}
                {rejectedLeaves.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">
                    No rejected leaves
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>All Leave Requests</CardTitle>
                <CardDescription>View all leave requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {allLeaves?.map((leave) => (
                  <LeaveCard key={leave.id} leave={leave} />
                ))}
                {(!allLeaves || allLeaves.length === 0) && (
                  <p className="text-center py-8 text-muted-foreground">
                    No leave requests
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Approval Dialog */}
        <Dialog
          open={approvalDialog.open}
          onOpenChange={(open) =>
            !open &&
            setApprovalDialog({ open: false, leave: null, action: null })
          }
        >
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>
                {approvalDialog.action === "approve" ? "Approve" : "Reject"}{" "}
                Leave Request
              </DialogTitle>
              <DialogDescription>
                {approvalDialog.action === "approve"
                  ? "Add any notes for the teacher regarding this approval"
                  : "Please provide a reason for rejection"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {approvalDialog.leave && (
                <div className="bg-muted p-4 rounded-xl">
                  <p className="font-semibold">
                    {approvalDialog.leave.teacherName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {approvalDialog.leave.startDate} to{" "}
                    {approvalDialog.leave.endDate}
                  </p>
                  <p className="text-sm mt-2">{approvalDialog.leave.reason}</p>
                </div>
              )}
              <div>
                <Label>
                  Notes {approvalDialog.action === "reject" && "(Required)"}
                </Label>
                <Textarea
                  className="rounded-xl"
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder={
                    approvalDialog.action === "approve"
                      ? "Add any notes (optional)..."
                      : "Provide reason for rejection..."
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 rounded-xl"
                  variant={
                    approvalDialog.action === "approve"
                      ? "default"
                      : "destructive"
                  }
                  onClick={() =>
                    approvalDialog.action &&
                    handleApproval(approvalDialog.action)
                  }
                  disabled={
                    updateLeaveMutation.isPending ||
                    (approvalDialog.action === "reject" && !approvalNotes)
                  }
                >
                  {updateLeaveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : approvalDialog.action === "approve" ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Confirm{" "}
                  {approvalDialog.action === "approve"
                    ? "Approval"
                    : "Rejection"}
                </Button>
                <Button
                  className="rounded-xl"
                  variant="outline"
                  onClick={() =>
                    setApprovalDialog({
                      open: false,
                      leave: null,
                      action: null,
                    })
                  }
                  disabled={updateLeaveMutation.isPending}
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
