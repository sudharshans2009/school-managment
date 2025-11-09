"use client";

import { useSession } from "@/lib/auth/client";
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
import { useQuery } from "@tanstack/react-query";
import { Loader2, Download, Filter, ClipboardCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { AdminHeader } from "@/components/admin/admin-header";

interface WorkDone {
  id: string;
  classroomId: string;
  classroomName: string;
  classroomGrade: string;
  classroomSection: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  date: string;
  periodNumber: number;
  topicsCovered: string;
  homeworkAssigned?: string;
  remarks?: string;
  isSubstitute: boolean;
  createdAt: string;
}

interface Classroom {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

export default function WorkDoneManagementPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    classroomId: "all",
    subjectId: "all",
    isSubstitute: "all",
  });

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/signin");
    }
  }, [session, isPending, router]);

  // Build query string
  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.classroomId && filters.classroomId !== "all")
      params.append("classroomId", filters.classroomId);
    if (filters.subjectId && filters.subjectId !== "all")
      params.append("subjectId", filters.subjectId);
    if (filters.isSubstitute && filters.isSubstitute !== "all")
      params.append("isSubstitute", filters.isSubstitute);
    return params.toString();
  };

  // Fetch work done records
  const { data: workDoneRecords, isLoading } = useQuery<WorkDone[]>({
    queryKey: ["work-done", filters],
    queryFn: async () => {
      const queryString = buildQueryString();
      const res = await fetch(`/api/work-done?${queryString}`);
      if (!res.ok) throw new Error("Failed to fetch work done records");
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  // Fetch classrooms
  const { data: classrooms } = useQuery<Classroom[]>({
    queryKey: ["classrooms"],
    queryFn: async () => {
      const res = await fetch("/api/classrooms");
      if (!res.ok) throw new Error("Failed to fetch classrooms");
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  // Fetch subjects
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: async () => {
      const res = await fetch("/api/subjects");
      if (!res.ok) throw new Error("Failed to fetch subjects");
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      classroomId: "",
      subjectId: "",
      isSubstitute: "",
    });
  };

  return (
    <DashboardLayout
      title="Work Done Records"
      description="View all work done records across the school"
    >
      <div className="space-y-6">
        <AdminHeader
          icon={ClipboardCheck}
          title="Work Done Records"
          description="View all work done records across the school"
        />

        {/* Filters */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter work done records by date, class, subject, etc.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  className="rounded-xl"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  className="rounded-xl"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Classroom</Label>
                <Select
                  value={filters.classroomId}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, classroomId: value }))
                  }
                >
                  <SelectTrigger className="rounded-xl w-full">
                    <SelectValue placeholder="All classrooms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All classrooms</SelectItem>
                    {classrooms?.map((classroom) => (
                      <SelectItem key={classroom.id} value={classroom.id}>
                        {classroom.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Subject</Label>
                <Select
                  value={filters.subjectId}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, subjectId: value }))
                  }
                >
                  <SelectTrigger className="rounded-xl w-full">
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subjects</SelectItem>
                    {subjects?.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Substitute Only</Label>
                <Select
                  value={filters.isSubstitute}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, isSubstitute: value }))
                  }
                >
                  <SelectTrigger className="rounded-xl w-full">
                    <SelectValue placeholder="All records" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All records</SelectItem>
                    <SelectItem value="true">Substitute only</SelectItem>
                    <SelectItem value="false">Regular only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="rounded-xl w-full"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Records
                </p>
                <p className="text-3xl font-bold mt-2">
                  {workDoneRecords?.length || 0}
                </p>
              </div>
              <Button variant="outline" className="rounded-xl" disabled>
                <Download className="h-4 w-4 mr-2" />
                Export (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Records */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Work Done Records</CardTitle>
            <CardDescription>
              {workDoneRecords?.length || 0} records found
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {workDoneRecords?.map((record) => (
              <Card key={record.id} className="rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">
                          {record.classroomName} - {record.subjectName}
                        </h4>
                        <Badge variant="outline">
                          Period {record.periodNumber}
                        </Badge>
                        {record.isSubstitute && (
                          <Badge variant="secondary">Substitute</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Teacher:</strong> {record.teacherName} |{" "}
                        <strong>Date:</strong> {record.date}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Topics Covered:</p>
                      <p className="text-sm text-muted-foreground">
                        {record.topicsCovered}
                      </p>
                    </div>
                    {record.homeworkAssigned && (
                      <div>
                        <p className="text-sm font-medium">
                          Homework Assigned:
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {record.homeworkAssigned}
                        </p>
                      </div>
                    )}
                    {record.remarks && (
                      <div>
                        <p className="text-sm font-medium">Remarks:</p>
                        <p className="text-sm text-muted-foreground">
                          {record.remarks}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Recorded on: {new Date(record.createdAt).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!workDoneRecords || workDoneRecords.length === 0) && (
              <p className="text-center py-8 text-muted-foreground">
                No work done records found. Try adjusting the filters.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
