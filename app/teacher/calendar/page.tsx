"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Sun,
  Clock,
  Users,
  PartyPopper,
  GraduationCap,
  Trophy,
  Mic2,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

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

interface Event {
  id: string;
  title: string;
  description: string | null;
  eventType: "academic" | "sports" | "cultural" | "meeting" | "holiday" | "other";
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  startDate: Date;
  endDate: Date;
  location: string | null;
  organizer: string | null;
  targetAudience: string | null;
  maxParticipants: number | null;
  registrationDeadline: Date | null;
  allowRegistration: boolean | null;
  attachments: string | null;
  createdBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  createdByName?: string | null;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TeacherCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Fetch calendar days for current month
  const { data: calendarDaysResult = [], isLoading } = useQuery({
    queryKey: [
      "calendar",
      format(monthStart, "yyyy-MM-dd"),
      format(monthEnd, "yyyy-MM-dd"),
    ],
    queryFn: async () => {
      const { getCalendarDays } = await import("@/actions/calendar");
      const result = await getCalendarDays({
        startDate: format(monthStart, "yyyy-MM-dd"),
        endDate: format(monthEnd, "yyyy-MM-dd"),
      });
      if (!result.success) throw new Error(result.error);
      return result.data as CalendarDay[];
    },
  });

  const calendarDays = Array.isArray(calendarDaysResult)
    ? calendarDaysResult
    : [];

  // Fetch events for current month
  const { data: eventsResult = [] } = useQuery({
    queryKey: [
      "events",
      format(monthStart, "yyyy-MM-dd"),
      format(monthEnd, "yyyy-MM-dd"),
    ],
    queryFn: async () => {
      const { getEvents } = await import("@/actions/events");
      const result = await getEvents({
        startDate: format(monthStart, "yyyy-MM-dd"),
        endDate: format(monthEnd, "yyyy-MM-dd"),
        targetAudience: "teacher",
      });
      if (!result.success) throw new Error(result.error);
      return result.data as Event[];
    },
  });

  const events = Array.isArray(eventsResult) ? eventsResult : [];

  // Generate calendar grid
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfWeek = getDay(monthStart);
  const calendarGrid = Array(firstDayOfWeek).fill(null).concat(daysInMonth);

  const getDayConfig = (date: Date): CalendarDay | undefined => {
    const dateStr = format(date, "yyyy-MM-dd");
    return calendarDays.find((d) => d.date === dateStr);
  };

  const getEventsForDate = (date: Date): Event[] => {
    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return date >= eventStart && date <= eventEnd;
    });
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "academic":
        return <GraduationCap className="w-3 h-3" />;
      case "sports":
        return <Trophy className="w-3 h-3" />;
      case "cultural":
        return <Mic2 className="w-3 h-3" />;
      case "meeting":
        return <Users className="w-3 h-3" />;
      case "holiday":
        return <PartyPopper className="w-3 h-3" />;
      default:
        return <Info className="w-3 h-3" />;
    }
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
      return null; // Don't clutter with "Working" badges
    }

    // Custom configuration
    if (config.dayType === "holiday") {
      const icon =
        config.holidayFor === "teachers" || config.holidayFor === "all" ? (
          <Sun className="w-3 h-3" />
        ) : null;

      // Only show if it applies to teachers
      if (config.holidayFor === "teachers" || config.holidayFor === "all") {
        return (
          <Badge
            variant="destructive"
            className="text-xs flex items-center gap-1"
          >
            {icon}
            Holiday
          </Badge>
        );
      } else if (config.holidayFor === "students") {
        return (
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <Users className="w-3 h-3" />
            Student Holiday
          </Badge>
        );
      }
    }

    if (config.dayDuration === "half") {
      return (
        <Badge variant="default" className="text-xs flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Half Day
        </Badge>
      );
    }

    return null;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
  };

  return (
    <DashboardLayout title="Teacher Portal" description="Calendar & Events">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Calendar & Events</h1>
            <p className="text-sm text-muted-foreground">
              View holidays, events, and important dates
            </p>
          </div>
        </div>

        {/* Legend */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Legend</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-lg">
                Sunday
              </Badge>
              <span className="text-muted-foreground">Weekly holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="destructive"
                className="rounded-lg flex items-center gap-1"
              >
                <Sun className="w-3 h-3" />
                Holiday
              </Badge>
              <span className="text-muted-foreground">Teacher holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="rounded-lg flex items-center gap-1"
              >
                <Users className="w-3 h-3" />
                Student Holiday
              </Badge>
              <span className="text-muted-foreground">Working day for teachers</span>
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
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-primary">
                <GraduationCap className="w-3 h-3" />
                <Trophy className="w-3 h-3" />
                <Mic2 className="w-3 h-3" />
              </div>
              <span className="text-muted-foreground">Events</span>
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
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
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
                    const dateEvents = getEventsForDate(date);
                    const today = isToday(date);

                    return (
                      <div
                        key={format(date, "yyyy-MM-dd")}
                        className={`
                        aspect-square border rounded-lg p-2 flex flex-col items-start justify-between overflow-hidden
                        ${today ? "border-primary border-2 bg-accent" : ""}
                        ${config || dateEvents.length > 0 ? "bg-muted/30" : ""}
                      `}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-sm font-medium ${
                              today ? "text-primary" : ""
                            }`}
                          >
                            {format(date, "d")}
                          </span>
                        </div>
                        <div className="w-full mt-1 space-y-1">
                          {getDayBadge(date)}
                          {config?.holidayName && (config.holidayFor === "teachers" || config.holidayFor === "all") && (
                            <div className="text-xs text-muted-foreground truncate">
                              {config.holidayName}
                            </div>
                          )}
                          {dateEvents.slice(0, 2).map((event) => (
                            <button
                              key={event.id}
                              onClick={() => setSelectedEvent(event)}
                              className="text-xs flex items-center gap-1 text-primary truncate hover:underline w-full text-left"
                              title={event.title}
                            >
                              {getEventIcon(event.eventType)}
                              <span className="truncate">{event.title}</span>
                            </button>
                          ))}
                          {dateEvents.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{dateEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {events.filter((e) => new Date(e.startDate) >= new Date()).length ===
            0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No upcoming events
              </p>
            ) : (
              <div className="space-y-3">
                {events
                  .filter((e) => new Date(e.startDate) >= new Date())
                  .slice(0, 5)
                  .map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="mt-1">{getEventIcon(event.eventType)}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {event.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.startDate), "MMM d, yyyy")}
                          {event.location && ` • ${event.location}`}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {event.eventType}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Details Dialog */}
        {selectedEvent && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <Card
              className="max-w-2xl w-full rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {selectedEvent.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{selectedEvent.eventType}</Badge>
                      <Badge
                        variant={
                          selectedEvent.status === "upcoming"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {selectedEvent.status}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEvent(null)}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedEvent.description || "No description provided"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Start Date</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedEvent.startDate), "PPP")}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">End Date</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedEvent.endDate), "PPP")}
                    </p>
                  </div>
                </div>
                {selectedEvent.location && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Location</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedEvent.location}
                    </p>
                  </div>
                )}
                {selectedEvent.organizer && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Organizer</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedEvent.organizer}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
