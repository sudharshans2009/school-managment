"use client";

import { ReactNode } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { type ContextMenuAction } from "@/components/providers/context-menu-provider";

interface AppContextMenuProps {
  children: ReactNode;
  actions: ContextMenuAction[];
  pageId?: string;
}

function renderMenuItems(actions: ContextMenuAction[]) {
  return actions.map((action, index) => {
    if (action.separator) {
      return <ContextMenuSeparator key={`separator-${index}`} />;
    }

    if (action.submenu && action.submenu.length > 0) {
      return (
        <ContextMenuSub key={`${action.label}-${index}`}>
          <ContextMenuSubTrigger>
            {action.icon}
            {action.label}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {renderMenuItems(action.submenu)}
          </ContextMenuSubContent>
        </ContextMenuSub>
      );
    }

    return (
      <ContextMenuItem
        key={`${action.label}-${index}`}
        onClick={action.onClick || (() => {})}
        disabled={action.disabled}
        variant={action.variant}
      >
        {action.icon}
        {action.label}
        {action.shortcut && (
          <ContextMenuShortcut>{action.shortcut}</ContextMenuShortcut>
        )}
      </ContextMenuItem>
    );
  });
}

export function AppContextMenu({
  children,
  actions,
  pageId,
}: AppContextMenuProps) {
  if (!actions || actions.length === 0) {
    return <>{children}</>;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {renderMenuItems(actions)}
      </ContextMenuContent>
    </ContextMenu>
  );
}
