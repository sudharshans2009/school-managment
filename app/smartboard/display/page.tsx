"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Bell, TrendingUp, Users, BookOpen, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

// Types
interface ClassroomInfo {
  id: string;
  name: string;
  grade: string;
  section: string;
  classTeacher: string;
  totalStrength: number;
}

interface ScheduleItem {
  period: number;
  time: string;
  subject: string;
  teacher: string;
  room: string;
  type: string;
}

interface AttendanceData {
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
  absentStudents: string[];
  lateStudents: string[];
}

interface Homework {
  id: string;
  subject: string;
  title: string;
  dueDate: string;
  dueTime: string;
  assignedBy: string;
  priority: string;
  totalMarks: number;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  date: string;
  priority: string;
  postedBy: string;
  icon: string;
}

interface Quote {
  content: string;
  author: string;
  date: string;
}

interface SmartboardData {
  classroom: ClassroomInfo;
  schedule: ScheduleItem[];
  attendance: AttendanceData;
  homework: Homework[];
  announcements: Announcement[];
  quote: Quote | null;
}

export default function SmartboardDisplayPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPeriod, setCurrentPeriod] = useState(0);
  const router = useRouter();

  // Get classroom ID from sessionStorage
  const classroomId = typeof window !== 'undefined' 
    ? sessionStorage.getItem("smartboard_classroom_id") 
    : null;

  // Check authentication on mount
  useEffect(() => {
    const storedClassroomId = sessionStorage.getItem("smartboard_classroom_id");
    const storedClassroomKey = sessionStorage.getItem("smartboard_classroom_key");

    if (!storedClassroomId || !storedClassroomKey) {
      // Redirect to login if not authenticated
      router.push("/smartboard/login");
    }
  }, [router]);

  // Fetch smartboard data
  const { data, isLoading, error } = useQuery<SmartboardData>({
    queryKey: ["smartboard", classroomId],
    queryFn: async () => {
      if (!classroomId) throw new Error("No classroom ID");
      const response = await fetch(`/api/smartboard/${classroomId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch smartboard data");
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!classroomId, // Only run query if classroomId exists
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      // Determine current period based on actual schedule times
      if (data?.schedule) {
        const now = new Date();
        const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const currentIndex = data.schedule.findIndex((item) => {
          const [startTime, endTime] = item.time.split(' - ');
          return currentTimeStr >= startTime && currentTimeStr < endTime;
        });
        
        setCurrentPeriod(currentIndex >= 0 ? currentIndex : -1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [data?.schedule]);

  const getCurrentPeriodIndex = () => {
    return currentPeriod;
  };

  // Show loading while checking authentication
  if (!classroomId) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <div className="text-gray-900 text-2xl font-light">Verifying credentials...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Failed to load smartboard data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-[1920px] mx-auto">
          <Skeleton className="h-24 w-full rounded-2xl mb-4" />
          <Skeleton className="h-28 w-full rounded-2xl mb-4" />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 space-y-4">
              <Skeleton className="h-96 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-96 w-full rounded-xl" />
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-500 via-blue-500 to-indigo-500 p-4">
      <div className="max-w-[1920px] mx-auto">
        {/* Motivational Quote */}
        {data.quote && (
          <div className="bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-lg mb-4 overflow-hidden">
            <div className="p-6 text-center backdrop-blur-sm bg-white/5">
              <p className="text-xl md:text-2xl font-medium text-white/95 leading-relaxed mb-2">
                &ldquo;{data.quote.content}&rdquo;
              </p>
              <p className="text-base text-white/75 font-light">- {data.quote.author}</p>
            </div>
          </div>
        )}

        {/* Header - Classroom Info & Time */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-linear-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-md">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-semibold bg-linear-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  {data.classroom.name}
                </h1>
                <p className="text-base md:text-lg text-gray-600 mt-0.5 font-light">
                  Grade {data.classroom.grade} - Section {data.classroom.section} • Class Teacher: {data.classroom.classTeacher}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-5xl md:text-6xl font-light text-gray-900 tabular-nums tracking-tight">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
              <p className="text-base md:text-lg text-gray-500 mt-1 font-light">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Left Column - Schedule & Attendance */}
          <div className="xl:col-span-2 space-y-4">
            {/* Today's Schedule */}
            <Card className="bg-white/90 backdrop-blur-xl shadow-lg border border-gray-200/50">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-blue-600 flex items-center text-2xl font-semibold">
                  <Clock className="h-6 w-6 mr-3" />
                  Today&apos;s Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {data.schedule.map((item, index) => {
                    const isCurrent = getCurrentPeriodIndex() === index;
                    const isPast = getCurrentPeriodIndex() > index;
                    
                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                          isCurrent
                            ? 'bg-linear-to-r from-blue-50 to-indigo-50 border-blue-400 shadow-md ring-2 ring-blue-200/50'
                            : isPast
                            ? 'bg-gray-50/50 border-gray-200 opacity-50'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className={`text-center min-w-[90px] ${isCurrent ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-600'}`}>
                            <p className="text-xs font-medium opacity-75">Period {item.period}</p>
                            <p className="text-lg font-semibold tracking-tight">{item.time}</p>
                          </div>
                          
                          <div className="h-10 w-px bg-gray-200"></div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className={`text-xl font-semibold ${isCurrent ? 'text-blue-900' : isPast ? 'text-gray-500' : 'text-gray-900'}`}>
                                {item.subject}
                              </h3>
                              {item.type !== 'Break' && (
                                <Badge variant={item.type === 'Practical' ? 'default' : item.type === 'Activity' ? 'secondary' : 'outline'} className="text-xs">
                                  {item.type}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-3 mt-1.5 text-gray-600 text-sm font-light">
                              <p className="flex items-center">
                                <Users className="h-3.5 w-3.5 mr-1.5" />
                                {item.teacher}
                              </p>
                              <span className="text-gray-300">•</span>
                              <p>{item.room}</p>
                            </div>
                          </div>
                        </div>
                        
                        {isCurrent && (
                          <Badge className="bg-linear-to-r from-blue-600 to-indigo-600 text-white text-sm px-4 py-1.5 shadow-md font-medium">
                            ● LIVE
                          </Badge>
                        )}
                        {isPast && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Attendance Section */}
            <Card className="bg-white/90 backdrop-blur-xl shadow-lg border border-gray-200/50">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-green-600 flex items-center text-2xl font-semibold">
                  <TrendingUp className="h-6 w-6 mr-3" />
                  Today&apos;s Attendance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="text-center p-4 bg-linear-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
                    <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <p className="text-3xl font-semibold text-green-600">{data.attendance.present}</p>
                    <p className="text-xs font-medium text-gray-600 mt-1">Present</p>
                  </div>
                  <div className="text-center p-4 bg-linear-to-br from-red-50 to-rose-50 rounded-xl border border-red-200 shadow-sm">
                    <XCircle className="h-8 w-8 mx-auto text-red-600 mb-2" />
                    <p className="text-3xl font-semibold text-red-600">{data.attendance.absent}</p>
                    <p className="text-xs font-medium text-gray-600 mt-1">Absent</p>
                  </div>
                  <div className="text-center p-4 bg-linear-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 shadow-sm">
                    <Clock className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                    <p className="text-3xl font-semibold text-yellow-600">{data.attendance.late}</p>
                    <p className="text-xs font-medium text-gray-600 mt-1">Late</p>
                  </div>
                  <div className="text-center p-4 bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
                    <TrendingUp className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <p className="text-3xl font-semibold text-blue-600">{data.attendance.percentage}%</p>
                    <p className="text-xs font-medium text-gray-600 mt-1">Rate</p>
                  </div>
                </div>

                {/* Attendance Details */}
                <div className="grid grid-cols-2 gap-3">
                  {data.attendance.absentStudents.length > 0 && (
                    <div className="p-3 bg-red-50/80 rounded-xl border border-red-200">
                      <h4 className="font-semibold text-red-900 mb-2 flex items-center text-sm">
                        <XCircle className="h-4 w-4 mr-1.5" />
                        Absent Students
                      </h4>
                      <ul className="space-y-1.5">
                        {data.attendance.absentStudents.map((student, idx) => (
                          <li key={idx} className="text-xs text-red-700 flex items-center font-light">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                            {student}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {data.attendance.lateStudents.length > 0 && (
                    <div className="p-3 bg-yellow-50/80 rounded-xl border border-yellow-200">
                      <h4 className="font-semibold text-yellow-900 mb-2 flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-1.5" />
                        Late Arrivals
                      </h4>
                      <ul className="space-y-1.5">
                        {data.attendance.lateStudents.map((student, idx) => (
                          <li key={idx} className="text-xs text-yellow-700 flex items-center font-light">
                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2"></span>
                            {student}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Homework & Messages */}
          <div className="space-y-4">
            {/* Homework Section */}
            <Card className="bg-white/90 backdrop-blur-xl shadow-lg border border-gray-200/50">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-purple-600 flex items-center text-2xl font-semibold">
                  <Calendar className="h-6 w-6 mr-3" />
                  Homework & Assignments
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {data.homework.map((hw) => (
                    <div
                      key={hw.id}
                      className={`p-3 rounded-xl border transition-all hover:shadow-md ${
                        hw.priority === 'high'
                          ? 'bg-red-50/80 border-red-300'
                          : hw.priority === 'medium'
                          ? 'bg-yellow-50/80 border-yellow-300'
                          : 'bg-blue-50/80 border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge 
                          variant={hw.priority === 'high' ? 'destructive' : hw.priority === 'medium' ? 'default' : 'secondary'}
                          className="text-xs font-medium"
                        >
                          {hw.priority.toUpperCase()}
                        </Badge>
                        <span className="text-xs font-semibold text-gray-600">{hw.totalMarks} marks</span>
                      </div>
                      
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-purple-600 mb-0.5">{hw.subject}</p>
                        <h4 className="font-semibold text-gray-900 text-sm leading-tight">{hw.title}</h4>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200">
                        <div>
                          <p className="font-semibold text-gray-700">Due: {hw.dueDate}</p>
                          <p className="text-gray-500 font-light">{hw.dueTime}</p>
                        </div>
                        <p className="text-gray-500 font-light">By: {hw.assignedBy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Admin Messages/Announcements */}
            <Card className="bg-white/90 backdrop-blur-xl shadow-lg border border-gray-200/50">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-orange-600 flex items-center text-2xl font-semibold">
                  <Bell className="h-6 w-6 mr-3" />
                  School Announcements
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {data.announcements.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl border transition-all hover:shadow-md ${
                        msg.priority === 'high'
                          ? 'bg-linear-to-br from-red-50 to-orange-50 border-red-300 shadow-sm'
                          : msg.priority === 'medium'
                          ? 'bg-linear-to-br from-yellow-50 to-amber-50 border-yellow-300'
                          : 'bg-linear-to-br from-blue-50 to-cyan-50 border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{msg.icon}</span>
                          <h4 className="font-semibold text-gray-900 text-sm">{msg.title}</h4>
                        </div>
                        {msg.priority === 'high' && (
                          <Badge variant="destructive" className="text-xs animate-pulse font-medium">
                            Important
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-700 leading-relaxed mb-2 font-light">
                        {msg.message}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200 font-light">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {msg.date}
                        </span>
                        <span className="font-medium">{msg.postedBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
