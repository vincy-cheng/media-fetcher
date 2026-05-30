/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";
import type { PropsWithChildren } from "react";
import { useSettings } from "@/hooks/useSettings";
import type { AppSettings } from "@/api/types";

interface SettingsContextValue {
  settings: AppSettings;
  settingsLoaded: boolean;
  saveSettings: (updated: AppSettings) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/**
 * Provides shared settings state to all consumers.
 * Must wrap any component that calls useSettingsContext().
 */
export function SettingsProvider({ children }: PropsWithChildren) {
  const { settings, loaded, save } = useSettings();
  return (
    <SettingsContext.Provider
      value={{ settings, settingsLoaded: loaded, saveSettings: save }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

/** Returns shared settings state. Must be used inside SettingsProvider. */
export function useSettingsContext(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettingsContext must be used within SettingsProvider");
  return ctx;
}
