"use client";

import { useContextMenu } from "@/hooks/use-context-menu";
import { type ContextMenuAction } from "@/components/providers/context-menu-provider";
import { AppContextMenu } from "@/components/ui/app-context-menu";
import { ReactNode } from "react";
import {
  UserPlus,
  Upload,
  RefreshCw,
  Download,
  Filter,
  Settings,
} from "lucide-react";

interface AdminStudentsContextMenuProps {
  children: ReactNode;
  onAddStudent: () => void;
  onBulkUpload: () => void;
  onRefresh: () => void;
  onExport?: () => void;
  onFilter?: () => void;
  onSettings?: () => void;
}

export function AdminStudentsContextMenu({
  children,
  onAddStudent,
  onBulkUpload,
  onRefresh,
  onExport,
  onFilter,
  onSettings,
}: AdminStudentsContextMenuProps) {
  const actions: ContextMenuAction[] = [
    {
      label: "Add New Student",
      icon: <UserPlus className="mr-2 h-4 w-4" />,
      onClick: onAddStudent,
      shortcut: "⌘N",
    },
    {
      label: "Bulk Upload CSV",
      icon: <Upload className="mr-2 h-4 w-4" />,
      onClick: onBulkUpload,
      shortcut: "⌘U",
    },
    { separator: true } as ContextMenuAction,
    {
      label: "Refresh List",
      icon: <RefreshCw className="mr-2 h-4 w-4" />,
      onClick: onRefresh,
      shortcut: "⌘R",
    },
  ];

  if (onExport) {
    actions.push({
      label: "Export to CSV",
      icon: <Download className="mr-2 h-4 w-4" />,
      onClick: onExport,
      shortcut: "⌘E",
    });
  }

  if (onFilter) {
    actions.push({
      separator: true,
    } as ContextMenuAction);
    actions.push({
      label: "Filter Students",
      icon: <Filter className="mr-2 h-4 w-4" />,
      onClick: onFilter,
    });
  }

  if (onSettings) {
    actions.push({
      separator: true,
    } as ContextMenuAction);
    actions.push({
      label: "Page Settings",
      icon: <Settings className="mr-2 h-4 w-4" />,
      onClick: onSettings,
    });
  }

  useContextMenu("admin-students", actions);

  return <AppContextMenu actions={actions}>{children}</AppContextMenu>;
}
