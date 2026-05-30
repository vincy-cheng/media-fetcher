/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";
import type { Dispatch, PropsWithChildren, SetStateAction } from "react";
import { useToolStatus } from "@/hooks/useToolStatus";
import type { ToolStatusState } from "@/hooks/useToolStatus";

export type AppShellTab = "single" | "batch";

interface AppShellContextValue {
  activeTab: AppShellTab;
  setActiveTab: Dispatch<SetStateAction<AppShellTab>>;
  showSettings: boolean;
  setShowSettings: Dispatch<SetStateAction<boolean>>;
  toolStatus: ToolStatusState;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

/**
 * Provides shell navigation state (active tab, settings modal, tool status).
 */
export function AppShellProvider({ children }: PropsWithChildren) {
  const [activeTab, setActiveTab] = useState<AppShellTab>("single");
  const [showSettings, setShowSettings] = useState(false);
  const toolStatus = useToolStatus();

  return (
    <AppShellContext.Provider
      value={{ activeTab, setActiveTab, showSettings, setShowSettings, toolStatus }}
    >
      {children}
    </AppShellContext.Provider>
  );
}

/** Returns shell navigation state. Must be used inside AppShellProvider. */
export function useAppShell(): AppShellContextValue {
  const ctx = useContext(AppShellContext);
  if (!ctx) throw new Error("useAppShell must be used within AppShellProvider");
  return ctx;
}
