"use client";

import { useContextMenu } from "@/hooks/use-context-menu";
import { type ContextMenuAction } from "@/components/providers/context-menu-provider";
import { AppContextMenu } from "@/components/ui/app-context-menu";
import { ReactNode } from "react";
import {
  RefreshCw,
  Settings,
  BarChart3,
  Users,
  Calendar,
  Bell,
} from "lucide-react";

interface AdminDashboardContextMenuProps {
  children: ReactNode;
  onRefresh: () => void;
  onViewAnalytics?: () => void;
  onViewUsers?: () => void;
  onViewCalendar?: () => void;
  onViewNotifications?: () => void;
  onSettings?: () => void;
}

export function AdminDashboardContextMenu({
  children,
  onRefresh,
  onViewAnalytics,
  onViewUsers,
  onViewCalendar,
  onViewNotifications,
  onSettings,
}: AdminDashboardContextMenuProps) {
  const actions: ContextMenuAction[] = [];

  // Quick navigation items
  if (onViewAnalytics) {
    actions.push({
      label: "View Analytics",
      icon: <BarChart3 className="mr-2 h-4 w-4" />,
      onClick: onViewAnalytics,
      shortcut: "⌘A",
    });
  }

  if (onViewUsers) {
    actions.push({
      label: "Manage Users",
      icon: <Users className="mr-2 h-4 w-4" />,
      onClick: onViewUsers,
      shortcut: "⌘U",
    });
  }

  if (onViewCalendar) {
    actions.push({
      label: "View Calendar",
      icon: <Calendar className="mr-2 h-4 w-4" />,
      onClick: onViewCalendar,
      shortcut: "⌘C",
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

  // Common actions
  actions.push({ separator: true } as ContextMenuAction);
  actions.push({
    label: "Refresh Dashboard",
    icon: <RefreshCw className="mr-2 h-4 w-4" />,
    onClick: onRefresh,
    shortcut: "⌘R",
  });

  if (onSettings) {
    actions.push({ separator: true } as ContextMenuAction);
    actions.push({
      label: "Dashboard Settings",
      icon: <Settings className="mr-2 h-4 w-4" />,
      onClick: onSettings,
    });
  }

  useContextMenu("admin-dashboard", actions);

  return <AppContextMenu actions={actions}>{children}</AppContextMenu>;
}
