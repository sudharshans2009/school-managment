"use client";

import { useEffect } from "react";
import {
  useContextMenuProvider,
  type ContextMenuAction,
} from "@/components/providers/context-menu-provider";

export function useContextMenu(
  pageId: string,
  actions: ContextMenuAction[],
  enabled = true,
) {
  const { registerContextMenu, unregisterContextMenu } =
    useContextMenuProvider();

  useEffect(() => {
    if (enabled && actions.length > 0) {
      registerContextMenu(pageId, actions);
    }

    return () => {
      if (enabled) {
        unregisterContextMenu(pageId);
      }
    };
  }, [pageId, actions, enabled, registerContextMenu, unregisterContextMenu]);

  return {
    pageId,
    actions,
  };
}
