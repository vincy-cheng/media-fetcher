/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";
import type { PropsWithChildren } from "react";
import { useDarkMode } from "@/hooks/useDarkMode";

interface DarkModeContextValue {
  dark: boolean;
  toggleDark: () => void;
}

const DarkModeContext = createContext<DarkModeContextValue | null>(null);

/**
 * Provides global dark mode state. Must wrap the entire app.
 */
export function DarkModeProvider({ children }: PropsWithChildren) {
  const { dark, toggle } = useDarkMode();
  return (
    <DarkModeContext.Provider value={{ dark, toggleDark: toggle }}>
      {children}
    </DarkModeContext.Provider>
  );
}

/** Returns dark mode state. Must be used inside DarkModeProvider. */
export function useDarkModeContext(): DarkModeContextValue {
  const ctx = useContext(DarkModeContext);
  if (!ctx) throw new Error("useDarkModeContext must be used within DarkModeProvider");
  return ctx;
}
