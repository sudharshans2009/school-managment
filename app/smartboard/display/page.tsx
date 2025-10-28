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

interface SmartboardData {
  classroom: ClassroomInfo;
  schedule: ScheduleItem[];
  attendance: AttendanceData;
  homework: Homework[];
  announcements: Announcement[];
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
      <div className="min-h-screen bg-linear-to-br from-indigo-600 via-blue-600 to-cyan-600 p-6 flex items-center justify-center">
        <div className="text-white text-2xl">Verifying credentials...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-600 via-blue-600 to-cyan-600 p-6 flex items-center justify-center">
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
      <div className="min-h-screen bg-linear-to-br from-indigo-600 via-blue-600 to-cyan-600 p-6">
        <div className="max-w-[1920px] mx-auto">
          <Skeleton className="h-32 w-full rounded-3xl mb-6" />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <Skeleton className="h-96 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-96 w-full rounded-xl" />
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-600 via-blue-600 to-cyan-600 p-6">
      <div className="max-w-[1920px] mx-auto">
        {/* Header - Classroom Info & Time */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-linear-to-br from-blue-500 to-purple-600 p-4 rounded-2xl">
                <BookOpen className="h-12 w-12 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {data.classroom.name}
                </h1>
                <p className="text-xl text-gray-600 mt-1">
                  Grade {data.classroom.grade} - Section {data.classroom.section} • Class Teacher: {data.classroom.classTeacher}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-6xl font-bold text-gray-900 tabular-nums">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
              <p className="text-xl text-gray-600 mt-2">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Schedule & Attendance */}
          <div className="xl:col-span-2 space-y-6">
            {/* Today's Schedule */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
              <CardHeader className="pb-4 border-b">
                <CardTitle className="flex items-center text-3xl">
                  <Clock className="h-8 w-8 mr-3 text-blue-600" />
                  Today&apos;s Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {data.schedule.map((item, index) => {
                    const isCurrent = getCurrentPeriodIndex() === index;
                    const isPast = getCurrentPeriodIndex() > index;
                    
                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300 ${
                          isCurrent
                            ? 'bg-linear-to-r from-blue-50 to-purple-50 border-blue-500 shadow-lg scale-[1.02] ring-4 ring-blue-200'
                            : isPast
                            ? 'bg-gray-50 border-gray-200 opacity-60'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className={`text-center min-w-[100px] ${isCurrent ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-600'}`}>
                            <p className="text-sm font-semibold opacity-75">Period {item.period}</p>
                            <p className="text-xl font-bold">{item.time}</p>
                          </div>
                          
                          <div className="h-12 w-px bg-gray-300"></div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className={`text-2xl font-bold ${isCurrent ? 'text-blue-900' : isPast ? 'text-gray-500' : 'text-gray-900'}`}>
                                {item.subject}
                              </h3>
                              {item.type !== 'Break' && (
                                <Badge variant={item.type === 'Practical' ? 'default' : item.type === 'Activity' ? 'secondary' : 'outline'}>
                                  {item.type}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 mt-2 text-gray-600">
                              <p className="text-base flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {item.teacher}
                              </p>
                              <span className="text-gray-400">•</span>
                              <p className="text-base">{item.room}</p>
                            </div>
                          </div>
                        </div>
                        
                        {isCurrent && (
                          <Badge className="bg-linear-to-r from-blue-600 to-purple-600 text-white text-base px-6 py-2 shadow-lg">
                            ● LIVE NOW
                          </Badge>
                        )}
                        {isPast && (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Attendance Section */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center text-3xl">
                  <TrendingUp className="h-8 w-8 mr-3 text-green-600" />
                  Today&apos;s Attendance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-5 bg-linear-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-300 shadow-md">
                    <CheckCircle className="h-10 w-10 mx-auto text-green-600 mb-3" />
                    <p className="text-4xl font-bold text-green-600">{data.attendance.present}</p>
                    <p className="text-sm font-semibold text-gray-600 mt-2">Present</p>
                  </div>
                  <div className="text-center p-5 bg-linear-to-br from-red-50 to-rose-50 rounded-2xl border-2 border-red-300 shadow-md">
                    <XCircle className="h-10 w-10 mx-auto text-red-600 mb-3" />
                    <p className="text-4xl font-bold text-red-600">{data.attendance.absent}</p>
                    <p className="text-sm font-semibold text-gray-600 mt-2">Absent</p>
                  </div>
                  <div className="text-center p-5 bg-linear-to-br from-yellow-50 to-amber-50 rounded-2xl border-2 border-yellow-300 shadow-md">
                    <Clock className="h-10 w-10 mx-auto text-yellow-600 mb-3" />
                    <p className="text-4xl font-bold text-yellow-600">{data.attendance.late}</p>
                    <p className="text-sm font-semibold text-gray-600 mt-2">Late</p>
                  </div>
                  <div className="text-center p-5 bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-300 shadow-md">
                    <TrendingUp className="h-10 w-10 mx-auto text-blue-600 mb-3" />
                    <p className="text-4xl font-bold text-blue-600">{data.attendance.percentage}%</p>
                    <p className="text-sm font-semibold text-gray-600 mt-2">Rate</p>
                  </div>
                </div>

                {/* Attendance Details */}
                <div className="grid grid-cols-2 gap-4">
                  {data.attendance.absentStudents.length > 0 && (
                    <div className="p-4 bg-red-50 rounded-xl border-2 border-red-200">
                      <h4 className="font-bold text-red-900 mb-3 flex items-center">
                        <XCircle className="h-5 w-5 mr-2" />
                        Absent Students
                      </h4>
                      <ul className="space-y-2">
                        {data.attendance.absentStudents.map((student, idx) => (
                          <li key={idx} className="text-sm text-red-700 flex items-center">
                            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                            {student}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {data.attendance.lateStudents.length > 0 && (
                    <div className="p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                      <h4 className="font-bold text-yellow-900 mb-3 flex items-center">
                        <Clock className="h-5 w-5 mr-2" />
                        Late Arrivals
                      </h4>
                      <ul className="space-y-2">
                        {data.attendance.lateStudents.map((student, idx) => (
                          <li key={idx} className="text-sm text-yellow-700 flex items-center">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
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
          <div className="space-y-6">
            {/* Homework Section */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center text-2xl">
                  <Calendar className="h-7 w-7 mr-3 text-purple-600" />
                  Homework & Assignments
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {data.homework.map((hw) => (
                    <div
                      key={hw.id}
                      className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                        hw.priority === 'high'
                          ? 'bg-red-50 border-red-300'
                          : hw.priority === 'medium'
                          ? 'bg-yellow-50 border-yellow-300'
                          : 'bg-blue-50 border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge 
                          variant={hw.priority === 'high' ? 'destructive' : hw.priority === 'medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {hw.priority.toUpperCase()}
                        </Badge>
                        <span className="text-xs font-bold text-gray-600">{hw.totalMarks} marks</span>
                      </div>
                      
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-purple-600 mb-1">{hw.subject}</p>
                        <h4 className="font-bold text-gray-900 text-sm leading-tight">{hw.title}</h4>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-600 mt-3 pt-3 border-t border-gray-200">
                        <div>
                          <p className="font-semibold text-gray-700">Due: {hw.dueDate}</p>
                          <p className="text-gray-500">{hw.dueTime}</p>
                        </div>
                        <p className="text-gray-500">By: {hw.assignedBy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Admin Messages/Announcements */}
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center text-2xl">
                  <Bell className="h-7 w-7 mr-3 text-orange-600" />
                  School Announcements
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {data.announcements.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                        msg.priority === 'high'
                          ? 'bg-linear-to-br from-red-50 to-orange-50 border-red-300 shadow-sm'
                          : msg.priority === 'medium'
                          ? 'bg-linear-to-br from-yellow-50 to-amber-50 border-yellow-300'
                          : 'bg-linear-to-br from-blue-50 to-cyan-50 border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{msg.icon}</span>
                          <h4 className="font-bold text-gray-900">{msg.title}</h4>
                        </div>
                        {msg.priority === 'high' && (
                          <Badge variant="destructive" className="text-xs animate-pulse">
                            Important
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">
                        {msg.message}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200">
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

            {/* Motivational Quote */}
            <Card className="bg-linear-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-2xl">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold mb-4 leading-relaxed">
                    &ldquo;The beautiful thing about learning is that no one can take it away from you.&rdquo;
                  </p>
                  <p className="text-lg text-purple-100">- B.B. King</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
