/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";
import type { Dispatch, PropsWithChildren, SetStateAction } from "react";
import type {
  AppSettings,
  Bitrate,
  Format,
  VideoInfo,
  VideoResolution,
} from "@/api/types";
import type { Job } from "@/hooks/useDownloadJob";
import type { ToolStatusState } from "@/hooks/useToolStatus";

export type AppShellTab = "single" | "batch";

export interface AppShellContextValue {
  activeTab: AppShellTab;
  setActiveTab: Dispatch<SetStateAction<AppShellTab>>;
  dark: boolean;
  toggleDark: () => void;
  showSettings: boolean;
  setShowSettings: Dispatch<SetStateAction<boolean>>;
  settings: AppSettings;
  settingsLoaded: boolean;
  saveSettings: (updated: AppSettings) => Promise<void>;
  toolStatus: ToolStatusState;
  info: VideoInfo | null;
  infoLoading: boolean;
  infoError: string | null;
  audioUrl: string | null;
  previewLoading: boolean;
  previewError: string | null;
  jobs: Job[];
  history: Job[];
  format: Format;
  setFormat: Dispatch<SetStateAction<Format>>;
  resolution: VideoResolution;
  setResolution: Dispatch<SetStateAction<VideoResolution>>;
  outputDir: string;
  setOutputDir: Dispatch<SetStateAction<string>>;
  bitrate: Bitrate;
  setBitrate: Dispatch<SetStateAction<Bitrate>>;
  trimStart: number;
  trimEnd: number;
  setTrimStart: Dispatch<SetStateAction<number>>;
  setTrimEnd: Dispatch<SetStateAction<number>>;
  setTrimRange: (start: number, end: number) => void;
  customFilename: string;
  setCustomFilename: Dispatch<SetStateAction<string>>;
  hasInvalidFilenameChars: boolean;
  filenameInvalidCharsWarning: string | null;
  filenameEmptyHint: string | null;
  filenameSubmitWarning: string | null;
  durationError: string | null;
  handleFetchInfo: (url: string) => Promise<void>;
  handlePreview: () => Promise<void>;
  cancelPreview: () => void;
  resetPreview: () => void;
  handleDownload: () => Promise<void>;
  cancelDownload: (jobId: string) => Promise<void>;
  clearHistory: () => void;
  canPreview: boolean;
  canBrowseFolder: boolean;
  maxDurationSeconds: number | null;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export interface AppShellProviderProps extends PropsWithChildren {
  value: AppShellContextValue;
}

/**
 * Provides shared app shell state and actions to the app UI.
 */
export function AppShellProvider({
  children,
  value,
}: AppShellProviderProps) {
  return (
    <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>
  );
}

/**
 * Reads the app shell context and fails loudly when used outside the provider.
 */
export function useAppShell(): AppShellContextValue {
  const context = useContext(AppShellContext);

  if (!context) {
    throw new Error("useAppShell must be used within an AppShellProvider");
  }

  return context;
}
