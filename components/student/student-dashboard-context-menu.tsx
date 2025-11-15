"use client";

import { useContextMenu } from "@/hooks/use-context-menu";
import { type ContextMenuAction } from "@/components/providers/context-menu-provider";
import { AppContextMenu } from "@/components/ui/app-context-menu";
import { ReactNode } from "react";
import {
  BookOpen,
  Calendar,
  Bell,
  User,
  RefreshCw,
  FileText,
  HelpCircle,
} from "lucide-react";

interface StudentDashboardContextMenuProps {
  children: ReactNode;
  onViewHomework?: () => void;
  onViewSchedule?: () => void;
  onViewNotifications?: () => void;
  onViewProfile?: () => void;
  onRefresh: () => void;
  onViewGrades?: () => void;
  onHelp?: () => void;
}

export function StudentDashboardContextMenu({
  children,
  onViewHomework,
  onViewSchedule,
  onViewNotifications,
  onViewProfile,
  onRefresh,
  onViewGrades,
  onHelp,
}: StudentDashboardContextMenuProps) {
  const actions: ContextMenuAction[] = [];

  if (onViewHomework) {
    actions.push({
      label: "My Homework",
      icon: <BookOpen className="mr-2 h-4 w-4" />,
      onClick: onViewHomework,
      shortcut: "⌘H",
    });
  }

  if (onViewSchedule) {
    actions.push({
      label: "My Schedule",
      icon: <Calendar className="mr-2 h-4 w-4" />,
      onClick: onViewSchedule,
      shortcut: "⌘S",
    });
  }

  if (onViewGrades) {
    actions.push({
      label: "My Grades",
      icon: <FileText className="mr-2 h-4 w-4" />,
      onClick: onViewGrades,
      shortcut: "⌘G",
    });
  }

  if (actions.length > 0) {
    actions.push({ separator: true } as ContextMenuAction);
  }

  if (onViewNotifications) {
    actions.push({
      label: "Notifications",
      icon: <Bell className="mr-2 h-4 w-4" />,
      onClick: onViewNotifications,
    });
  }

  if (onViewProfile) {
    actions.push({
      label: "My Profile",
      icon: <User className="mr-2 h-4 w-4" />,
      onClick: onViewProfile,
    });
  }

  actions.push({ separator: true } as ContextMenuAction);
  actions.push({
    label: "Refresh",
    icon: <RefreshCw className="mr-2 h-4 w-4" />,
    onClick: onRefresh,
    shortcut: "⌘R",
  });

  if (onHelp) {
    actions.push({ separator: true } as ContextMenuAction);
    actions.push({
      label: "Help",
      icon: <HelpCircle className="mr-2 h-4 w-4" />,
      onClick: onHelp,
    });
  }

  useContextMenu("student-dashboard", actions);

  return <AppContextMenu actions={actions}>{children}</AppContextMenu>;
}
