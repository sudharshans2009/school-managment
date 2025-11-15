"use client";

import { useContextMenu } from "@/hooks/use-context-menu";
import { type ContextMenuAction } from "@/components/providers/context-menu-provider";
import { AppContextMenu } from "@/components/ui/app-context-menu";
import { ReactNode } from "react";
import {
  BookOpen,
  ClipboardList,
  Users,
  Calendar,
  RefreshCw,
  FileText,
  Settings,
} from "lucide-react";

interface TeacherClassroomContextMenuProps {
  children: ReactNode;
  onTakeAttendance?: () => void;
  onAssignHomework?: () => void;
  onViewStudents?: () => void;
  onViewSchedule?: () => void;
  onRefresh: () => void;
  onGenerateReport?: () => void;
  onSettings?: () => void;
}

export function TeacherClassroomContextMenu({
  children,
  onTakeAttendance,
  onAssignHomework,
  onViewStudents,
  onViewSchedule,
  onRefresh,
  onGenerateReport,
  onSettings,
}: TeacherClassroomContextMenuProps) {
  const actions: ContextMenuAction[] = [];

  if (onTakeAttendance) {
    actions.push({
      label: "Take Attendance",
      icon: <ClipboardList className="mr-2 h-4 w-4" />,
      onClick: onTakeAttendance,
      shortcut: "⌘A",
    });
  }

  if (onAssignHomework) {
    actions.push({
      label: "Assign Homework",
      icon: <BookOpen className="mr-2 h-4 w-4" />,
      onClick: onAssignHomework,
      shortcut: "⌘H",
    });
  }

  if (actions.length > 0) {
    actions.push({ separator: true } as ContextMenuAction);
  }

  if (onViewStudents) {
    actions.push({
      label: "View Students",
      icon: <Users className="mr-2 h-4 w-4" />,
      onClick: onViewStudents,
    });
  }

  if (onViewSchedule) {
    actions.push({
      label: "View Schedule",
      icon: <Calendar className="mr-2 h-4 w-4" />,
      onClick: onViewSchedule,
    });
  }

  actions.push({ separator: true } as ContextMenuAction);
  actions.push({
    label: "Refresh",
    icon: <RefreshCw className="mr-2 h-4 w-4" />,
    onClick: onRefresh,
    shortcut: "⌘R",
  });

  if (onGenerateReport) {
    actions.push({ separator: true } as ContextMenuAction);
    actions.push({
      label: "Generate Report",
      icon: <FileText className="mr-2 h-4 w-4" />,
      onClick: onGenerateReport,
    });
  }

  if (onSettings) {
    actions.push({ separator: true } as ContextMenuAction);
    actions.push({
      label: "Settings",
      icon: <Settings className="mr-2 h-4 w-4" />,
      onClick: onSettings,
    });
  }

  useContextMenu("teacher-classroom", actions);

  return <AppContextMenu actions={actions}>{children}</AppContextMenu>;
}
