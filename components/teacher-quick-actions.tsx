"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BookOpen, Users, MessageSquare, FileText, UserCheck, ClipboardList, Quote,
  Home
} from "lucide-react";
import { useRouter } from "next/navigation";

interface TeacherQuickActionsProps {
  unreadMessages?: number;
  isPrimaryTeacher?: boolean;
  currentPage?: string;
}

export function TeacherQuickActions({ 
  unreadMessages = 0, 
  isPrimaryTeacher = false,
  currentPage = ""
}: TeacherQuickActionsProps) {
  const router = useRouter();

  const actions = [
    {
      id: "classes",
      title: "My Classes & Attendance",
      description: "View classes & mark attendance",
      icon: Users,
      color: "text-blue-500",
      onClick: () => router.push("/teacher/classes"),
    },
    {
      id: "homework",
      title: "Homework",
      description: "Assign & grade homework",
      icon: BookOpen,
      color: "text-green-500",
      onClick: () => router.push("/teacher/homework"),
    },
    {
      id: "home",
      title: "Back Home",
      description: "Return to the main dashboard",
      icon: Home,
      color: "text-purple-500",
      onClick: () => router.push("/teacher"),
    },
    // {
    //   id: "messages",
    //   title: "Messages",
    //   description: `View student messages${unreadMessages > 0 ? ` (${unreadMessages})` : ""}`,
    //   icon: MessageSquare,
    //   color: "text-orange-500",
    //   onClick: () => router.push("/teacher"),
    // },
    // {
    //   id: "leaves",
    //   title: "My Leaves",
    //   description: "Request & track leave",
    //   icon: FileText,
    //   color: "text-red-500",
    //   onClick: () => router.push("/teacher"),
    // },
    // {
    //   id: "substitutes",
    //   title: "Substitute Duties",
    //   description: "View assigned substitutes",
    //   icon: UserCheck,
    //   color: "text-cyan-500",
    //   onClick: () => router.push("/teacher"),
    // },
  ];

  // Add Class Message action only for primary teachers
  // if (isPrimaryTeacher) {
  //   actions.push({
  //     id: "classroom-msg",
  //     title: "Class Message",
  //     description: "Post message to your class",
  //     icon: Quote,
  //     color: "text-pink-500",
  //     onClick: () => router.push("/teacher"),
  //   });
  // }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Access your teaching tools and resources</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            
            return (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto p-4 justify-start hover:border-primary hover:bg-primary/5"
                onClick={action.onClick}
              >
                <Icon className={`h-5 w-5 mr-3 ${action.color}`} />
                <div className="text-left">
                  <div className="font-semibold">{action.title}</div>
                  <div className={`text-sm text-muted-foreground`}>
                    {action.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
