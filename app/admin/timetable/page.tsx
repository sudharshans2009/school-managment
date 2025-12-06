"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, Clock } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { AdminHeader } from "@/components/admin/admin-header";
import { getAllTeachers, getAllSubjects, getTimetable, createTimetableEntry, updateTimetableEntry, deleteTimetableEntry } from "@/actions/admin";
import { getAllClassrooms } from "@/actions/classrooms";

interface Classroom {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

interface TimetableEntry {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  roomNumber: string;
  classroom: { id: string; name: string };
  subject: { id: string; name: string };
  teacher: { id: string; name: string };
}

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

// const PERIODS = [
//   { period: 1, startTime: "08:00", endTime: "08:50", label: "Period 1" },
//   { period: 2, startTime: "08:50", endTime: "09:40", label: "Period 2" },
//   { period: 3, startTime: "09:40", endTime: "10:30", label: "Period 3" },
//   {
//     period: "BREAK1",
//     startTime: "10:30",
//     endTime: "11:00",
//     label: "BREAK",
//     isBreak: true,
//   },
//   { period: 5, startTime: "11:00", endTime: "11:50", label: "Period 5" },
//   { period: 6, startTime: "11:50", endTime: "12:40", label: "Period 6" },
//   { period: 7, startTime: "12:40", endTime: "13:30", label: "Period 7" },
//   {
//     period: "LUNCH",
//     startTime: "13:30",
//     endTime: "14:15",
//     label: "LUNCH",
//     isBreak: true,
//   },
//   { period: 9, startTime: "14:15", endTime: "15:05", label: "Period 9" },
//   { period: 10, startTime: "15:05", endTime: "15:55", label: "Period 10" },
//   { period: 11, startTime: "15:55", endTime: "16:45", label: "Period 11" },
// ];

export default function TimetablePage() {
  const [selectedClassroom, setSelectedClassroom] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [openCreate, setOpenCreate] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const queryClient = useQueryClient();

  const { data: classrooms } = useQuery<Classroom[]>({
    queryKey: ["classrooms"],
    queryFn: async () => {
      const result = await getAllClassrooms();
      if (!result.success) throw new Error(result.error || "Failed to fetch classrooms");
      return result.data.map((c) => ({ id: c.id, name: c.name }));
    },
  });

  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ["teachers"],
    queryFn: async () => {
      const data = await getAllTeachers();
      return data.map((t) => ({ id: t.id, name: t.name }));
    },
  });

  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: async () => {
      const result = await getAllSubjects();
      return result.map((s) => ({ id: s.id, name: s.name }));
    },
  });

  const { data: timetable } = useQuery<TimetableEntry[]>({
    queryKey: ["timetable", selectedClassroom],
    queryFn: async () => {
      const result = await getTimetable(selectedClassroom || undefined);
      return result;
    },
    enabled: !!selectedClassroom,
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      classroomId: string;
      subjectId: string;
      teacherId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      roomNumber: string;
    }) => {
      const result = await createTimetableEntry({
        ...data,
        periodNumber: 0, // Default, will be determined by time
        room: data.roomNumber,
        sessionType: "regular",
      });
      if (!result.success) {
        throw new Error(result.error || "Failed to create timetable entry");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
      setOpenCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      subjectId: string;
      teacherId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      roomNumber: string;
    }) => {
      const { id, ...body } = data;
      const result = await updateTimetableEntry(id, {
        ...body,
        room: body.roomNumber,
      });
      if (!result.success) {
        throw new Error(result.error || "Failed to update timetable entry");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
      setEditingEntry(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteTimetableEntry(id);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete timetable entry");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable"] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (editingEntry) {
      updateMutation.mutate({
        id: editingEntry.id,
        subjectId: formData.get("subjectId") as string,
        teacherId: formData.get("teacherId") as string,
        dayOfWeek: parseInt(formData.get("dayOfWeek") as string),
        startTime: formData.get("startTime") as string,
        endTime: formData.get("endTime") as string,
        roomNumber: formData.get("roomNumber") as string,
      });
    } else {
      createMutation.mutate({
        classroomId: selectedClassroom,
        subjectId: formData.get("subjectId") as string,
        teacherId: formData.get("teacherId") as string,
        dayOfWeek: parseInt(formData.get("dayOfWeek") as string),
        startTime: formData.get("startTime") as string,
        endTime: formData.get("endTime") as string,
        roomNumber: formData.get("roomNumber") as string,
      });
    }
  };

  const filteredTimetable = timetable?.filter(
    (entry) => entry.dayOfWeek === selectedDay,
  );

  return (
    <DashboardLayout title="Timetable Management" description="Admin Portal">
      <div>
        <AdminHeader
          icon={Clock}
          title="Timetable Management"
          description="Manage class timetables and periods"
        >
          <Dialog
            open={openCreate || !!editingEntry}
            onOpenChange={(open) => {
              setOpenCreate(open);
              if (!open) setEditingEntry(null);
            }}
          >
            <DialogTrigger asChild>
              <Button
                disabled={!selectedClassroom}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Period
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  {editingEntry ? "Edit Period" : "Add New Period"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="subjectId">Subject *</Label>
                  <Select
                    name="subjectId"
                    required
                    defaultValue={editingEntry?.subject.id}
                  >
                    <SelectTrigger id="subjectId">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="teacherId">Teacher *</Label>
                  <Select
                    name="teacherId"
                    required
                    defaultValue={editingEntry?.teacher.id}
                  >
                    <SelectTrigger id="teacherId">
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers?.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dayOfWeek">Day of Week *</Label>
                  <Select
                    name="dayOfWeek"
                    required
                    defaultValue={
                      editingEntry?.dayOfWeek.toString() ||
                      selectedDay.toString()
                    }
                  >
                    <SelectTrigger id="dayOfWeek">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day) => (
                        <SelectItem
                          key={day.value}
                          value={day.value.toString()}
                        >
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      name="startTime"
                      type="time"
                      required
                      defaultValue={editingEntry?.startTime}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      name="endTime"
                      type="time"
                      required
                      defaultValue={editingEntry?.endTime}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="roomNumber">Room Number *</Label>
                  <Input
                    id="roomNumber"
                    name="roomNumber"
                    placeholder="e.g., 101"
                    required
                    defaultValue={editingEntry?.roomNumber}
                  />
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
                      setOpenCreate(false);
                      setEditingEntry(null);
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
                    {createMutation.isPending || updateMutation.isPending
                      ? "Saving..."
                      : editingEntry
                        ? "Update"
                        : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </AdminHeader>

        <Card className="mb-6 rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Select Classroom</Label>
                <Select
                  value={selectedClassroom}
                  onValueChange={setSelectedClassroom}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a classroom" />
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
              <div className="flex-1">
                <Label>Filter by Day</Label>
                <Select
                  value={selectedDay.toString()}
                  onValueChange={(value) => setSelectedDay(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {!selectedClassroom ? (
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-8 text-center text-gray-500">
              Please select a classroom to view and manage its timetable.
            </CardContent>
          </Card>
        ) : filteredTimetable && filteredTimetable.length === 0 ? (
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-8 text-center text-gray-500">
              No periods scheduled for{" "}
              {DAYS.find((d) => d.value === selectedDay)?.label}. Click
              &quot;Add Period&quot; to create one.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredTimetable
              ?.sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((entry) => (
                <Card
                  key={entry.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {entry.subject.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {entry.teacher.name} • Room {entry.roomNumber}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {entry.startTime} - {entry.endTime}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingEntry(entry)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to delete this period?",
                              )
                            ) {
                              deleteMutation.mutate(entry.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
