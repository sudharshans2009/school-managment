"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface ContextMenuAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
  shortcut?: string;
  separator?: boolean;
  submenu?: ContextMenuAction[];
}

interface ContextMenuState {
  actions: ContextMenuAction[];
  pageId: string;
}

interface ContextMenuContextType {
  registerContextMenu: (pageId: string, actions: ContextMenuAction[]) => void;
  unregisterContextMenu: (pageId: string) => void;
  getContextMenu: (pageId: string) => ContextMenuAction[] | undefined;
  activeMenus: Map<string, ContextMenuAction[]>;
}

const ContextMenuContext = createContext<ContextMenuContextType | undefined>(
  undefined,
);

export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [activeMenus, setActiveMenus] = useState<
    Map<string, ContextMenuAction[]>
  >(new Map());

  const registerContextMenu = (
    pageId: string,
    actions: ContextMenuAction[],
  ) => {
    setActiveMenus((prev) => {
      const newMap = new Map(prev);
      newMap.set(pageId, actions);
      return newMap;
    });
  };

  const unregisterContextMenu = (pageId: string) => {
    setActiveMenus((prev) => {
      const newMap = new Map(prev);
      newMap.delete(pageId);
      return newMap;
    });
  };

  const getContextMenu = (pageId: string) => {
    return activeMenus.get(pageId);
  };

  return (
    <ContextMenuContext.Provider
      value={{
        registerContextMenu,
        unregisterContextMenu,
        getContextMenu,
        activeMenus,
      }}
    >
      {children}
    </ContextMenuContext.Provider>
  );
}

export function useContextMenuProvider() {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error(
      "useContextMenuProvider must be used within ContextMenuProvider",
    );
  }
  return context;
}
