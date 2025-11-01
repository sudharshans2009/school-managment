"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
} from "date-fns";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Sun,
  Clock,
  Users,
  Briefcase,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import Link from "next/link";

interface CalendarDay {
  id: string;
  date: string;
  dayType: "working" | "holiday";
  dayDuration: "full" | "half";
  holidayFor: "all" | "students" | "teachers" | "office" | null;
  holidayName: string | null;
  customTimetable: number | null;
  notes: string | null;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIMETABLE_DAYS = [
  { value: null, label: "Default (Based on actual day)" },
  { value: 1, label: "Monday's Timetable" },
  { value: 2, label: "Tuesday's Timetable" },
  { value: 3, label: "Wednesday's Timetable" },
  { value: 4, label: "Thursday's Timetable" },
  { value: 5, label: "Friday's Timetable" },
  { value: 6, label: "Saturday's Timetable" },
];

export default function AdminCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    dayType: "working" as "working" | "holiday",
    dayDuration: "full" as "full" | "half",
    holidayFor: "all" as "all" | "students" | "teachers" | "office",
    holidayName: "",
    customTimetable: null as number | null,
    notes: "",
  });

  const queryClient = useQueryClient();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Fetch calendar days for current month
  const { data: calendarDays = [], isLoading } = useQuery({
    queryKey: [
      "calendar",
      format(monthStart, "yyyy-MM-dd"),
      format(monthEnd, "yyyy-MM-dd"),
    ],
    queryFn: async () => {
      const res = await fetch(
        `/api/calendar?startDate=${format(monthStart, "yyyy-MM-dd")}&endDate=${format(monthEnd, "yyyy-MM-dd")}`,
      );
      if (!res.ok) throw new Error("Failed to fetch calendar");
      return res.json() as Promise<CalendarDay[]>;
    },
  });

  // Fetch single day config when editing
  useQuery({
    queryKey: [
      "calendar-day",
      selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
    ],
    queryFn: async () => {
      if (!selectedDate) return null;
      const res = await fetch(
        `/api/calendar?date=${format(selectedDate, "yyyy-MM-dd")}`,
      );
      if (!res.ok) throw new Error("Failed to fetch day config");
      return res.json() as Promise<CalendarDay | null>;
    },
    enabled: !!selectedDate && openDialog,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { date: string }) => {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      setOpenDialog(false);
      setSelectedDate(null);
      resetForm();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (date: string) => {
      const res = await fetch(`/api/calendar?date=${date}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      setOpenDialog(false);
      setSelectedDate(null);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      dayType: "working",
      dayDuration: "full",
      holidayFor: "all",
      holidayName: "",
      customTimetable: null,
      notes: "",
    });
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateStr = format(date, "yyyy-MM-dd");
    const existing = calendarDays.find((d) => d.date === dateStr);

    if (existing) {
      setFormData({
        dayType: existing.dayType,
        dayDuration: existing.dayDuration,
        holidayFor: existing.holidayFor || "all",
        holidayName: existing.holidayName || "",
        customTimetable: existing.customTimetable,
        notes: existing.notes || "",
      });
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleSave = () => {
    if (!selectedDate) return;
    saveMutation.mutate({
      ...formData,
      date: format(selectedDate, "yyyy-MM-dd"),
    });
  };

  const handleDelete = () => {
    if (!selectedDate) return;
    if (confirm("Reset this day to default settings?")) {
      deleteMutation.mutate(format(selectedDate, "yyyy-MM-dd"));
    }
  };

  // Generate calendar grid
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = getDay(monthStart);
  const calendarGrid = Array(firstDayOfWeek).fill(null).concat(daysInMonth);

  const getDayConfig = (date: Date): CalendarDay | undefined => {
    const dateStr = format(date, "yyyy-MM-dd");
    return calendarDays.find((d) => d.date === dateStr);
  };

  const getDayBadge = (date: Date) => {
    const config = getDayConfig(date);
    const dayOfWeek = getDay(date);
    const isDefault = !config;

    // Default behavior: Mon-Sat working, Sunday holiday
    if (isDefault) {
      if (dayOfWeek === 0) {
        return (
          <Badge variant="outline" className="text-xs">
            Sunday
          </Badge>
        );
      }
      return (
        <Badge variant="secondary" className="text-xs">
          Working
        </Badge>
      );
    }

    // Custom configuration
    if (config.dayType === "holiday") {
      const icon =
        config.holidayFor === "students" ? (
          <Users className="w-3 h-3" />
        ) : config.holidayFor === "teachers" ? (
          <Briefcase className="w-3 h-3" />
        ) : config.holidayFor === "office" ? (
          <Building2 className="w-3 h-3" />
        ) : (
          <Sun className="w-3 h-3" />
        );
      return (
        <Badge
          variant="destructive"
          className="text-xs flex items-center gap-1"
        >
          {icon}
          Holiday
        </Badge>
      );
    }

    if (config.dayDuration === "half") {
      return (
        <Badge variant="default" className="text-xs flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Half Day
        </Badge>
      );
    }

    if (config.customTimetable) {
      return (
        <Badge variant="secondary" className="text-xs">
          {
            DAYS_OF_WEEK[
              config.customTimetable === 6 ? 6 : config.customTimetable
            ]
          }{" "}
          TT
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="text-xs">
        Working
      </Badge>
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
  };

  return (
    <DashboardLayout title="Admin Portal" description="Calendar Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="rounded-xl">
                  ← Back
                </Button>
              </Link>
              <Calendar className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">Calendar Management</h1>
            </div>
            <p className="text-muted-foreground mt-1 ml-14">
              Manage working days, holidays, and custom timetables
            </p>
          </div>
        </div>

        {/* Legend */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Default Schedule</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-lg">
                Working
              </Badge>
              <span className="text-muted-foreground">
                Mon-Sat: Full working day
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-lg">
                Sunday
              </Badge>
              <span className="text-muted-foreground">
                Sunday: Holiday for all
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="destructive"
                className="rounded-lg flex items-center gap-1"
              >
                <Sun className="w-3 h-3" />
                Holiday
              </Badge>
              <span className="text-muted-foreground">Custom holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="default"
                className="rounded-lg flex items-center gap-1"
              >
                <Clock className="w-3 h-3" />
                Half Day
              </Badge>
              <span className="text-muted-foreground">Half working day</span>
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                {format(currentDate, "MMMM yyyy")}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <Spinner className="w-8 h-8" />
              </div>
            ) : (
              <div>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div
                      key={day}
                      className="text-center font-semibold text-sm text-muted-foreground py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarGrid.map((date, index) => {
                    if (!date) {
                      return (
                        <div key={`empty-${index}`} className="aspect-square" />
                      );
                    }

                    const config = getDayConfig(date);
                    const today = isToday(date);

                    return (
                      <button
                        key={format(date, "yyyy-MM-dd")}
                        onClick={() => handleDateClick(date)}
                        className={`
                        aspect-square border rounded-lg p-2 flex flex-col items-start justify-between
                        hover:border-primary hover:bg-accent transition-colors
                        ${today ? "border-primary border-2 bg-accent" : ""}
                        ${config ? "bg-muted/30" : ""}
                      `}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-sm font-medium ${today ? "text-primary" : ""}`}
                          >
                            {format(date, "d")}
                          </span>
                          {config && (
                            <Edit2 className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                        <div className="w-full mt-1">
                          {getDayBadge(date)}
                          {config?.holidayName && (
                            <div className="text-xs text-muted-foreground mt-1 truncate">
                              {config.holidayName}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Configure{" "}
                {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
              </DialogTitle>
              <DialogDescription>
                Set working status, duration, and timetable for this day
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Day Type */}
              <div className="space-y-2">
                <Label>Day Type</Label>
                <Select
                  value={formData.dayType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      dayType: value as "working" | "holiday",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="working">Working Day</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Day Duration (only for working days) */}
              {formData.dayType === "working" && (
                <div className="space-y-2">
                  <Label>Day Duration</Label>
                  <Select
                    value={formData.dayDuration}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        dayDuration: value as "full" | "half",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Day</SelectItem>
                      <SelectItem value="half">Half Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Holiday For (only for holidays) */}
              {formData.dayType === "holiday" && (
                <>
                  <div className="space-y-2">
                    <Label>Holiday For</Label>
                    <Select
                      value={formData.holidayFor}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          holidayFor: value as
                            | "all"
                            | "students"
                            | "teachers"
                            | "office",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          All (Students, Teachers, Office Staff)
                        </SelectItem>
                        <SelectItem value="students">Students Only</SelectItem>
                        <SelectItem value="teachers">Teachers Only</SelectItem>
                        <SelectItem value="office">
                          Office Staff Only
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Holiday Name</Label>
                    <Input
                      placeholder="e.g., Independence Day, Teacher's Meeting"
                      value={formData.holidayName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          holidayName: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}

              {/* Custom Timetable (only for working days) */}
              {formData.dayType === "working" && (
                <div className="space-y-2">
                  <Label>Timetable</Label>
                  <Select
                    value={formData.customTimetable?.toString() || "default"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        customTimetable:
                          value === "default" ? null : parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">
                        Default (Based on actual day)
                      </SelectItem>
                      {TIMETABLE_DAYS.slice(1).map((day) => (
                        <SelectItem
                          key={day.value}
                          value={day.value!.toString()}
                        >
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose a different day&apos;s timetable to follow (e.g., use
                    Monday&apos;s schedule on Saturday)
                  </p>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes or remarks..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Reset to Default
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending && (
                    <Spinner className="w-4 h-4 mr-2" />
                  )}
                  Save Configuration
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
