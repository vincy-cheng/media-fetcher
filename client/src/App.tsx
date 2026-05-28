// client/src/App.tsx
import { useState, useEffect, useRef } from "react";
import { useVideoInfo } from "@/hooks/useVideoInfo";
import { usePreview } from "@/hooks/usePreview";
import { useDownloadJob } from "@/hooks/useDownloadJob";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useSettings } from "@/hooks/useSettings";
import { useToolStatus } from "@/hooks/useToolStatus";
import type { Format, VideoResolution, Bitrate } from "@/api/types";
import { ABSOLUTE_MAX_DURATION_SECONDS, isVideoFormat } from "@/api/types";
import {
  AppShellProvider,
  type AppShellContextValue,
} from "@/components/app/AppShellContext";
import { capabilities } from "@/api/client";
import {
  AppShellHeader,
  AppShellSettingsModal,
  AppShellTabs,
  BatchDownloadPanel,
  SingleDownloadPanel,
} from "@/components/app/AppShellSections";
import {
  sanitizeFilenameBaseName,
  hasDisallowedFilenameChars,
} from "@/utils/filename";

export default function App() {
  const {
    info,
    loading: infoLoading,
    error: infoError,
    fetch: fetchInfo,
  } = useVideoInfo();
  const {
    audioUrl,
    loading: previewLoading,
    error: previewError,
    load: loadPreview,
    cancel: cancelPreview,
    reset: resetPreview,
  } = usePreview();
  const {
    jobs,
    history,
    start: startDownload,
    cancel: cancelDownload,
    clear: clearHistory,
  } = useDownloadJob();
  const { dark, toggle: toggleDark } = useDarkMode();
  const { settings, loaded, save: saveSettings } = useSettings();
  const toolStatusState = useToolStatus();
  const { canPreview, canBrowseFolder } = capabilities;

  const [activeTab, setActiveTab] = useState<"single" | "batch">("single");
  const [format, setFormat] = useState<Format>("m4a");
  const [resolution, setResolution] = useState<VideoResolution>("1080p");
  const [outputDir, setOutputDir] = useState("");
  const [bitrate, setBitrate] = useState<Bitrate>(192);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [durationError, setDurationError] = useState<string | null>(null);
  const [customFilename, setCustomFilename] = useState("");
  const [filenameSubmitWarning, setFilenameSubmitWarning] = useState<
    string | null
  >(null);
  const prefilled = useRef(false);

  useEffect(() => {
    if (!loaded || prefilled.current) return;
    prefilled.current = true;
    const prefs = settings.downloadPreferences;
    setFormat(prefs.defaultFormat);
    if (prefs.defaultOutputDir) setOutputDir(prefs.defaultOutputDir);
    setBitrate(prefs.defaultBitrate);
    if (prefs.defaultResolution) setResolution(prefs.defaultResolution);
  }, [loaded, settings]);

  const hasInvalidFilenameChars = hasDisallowedFilenameChars(customFilename);
  const trimmedCustomFilename = customFilename.trim();

  const filenameInvalidCharsWarning = hasInvalidFilenameChars
    ? "Some characters will be replaced with '_'"
    : null;

  const filenameEmptyHint =
    trimmedCustomFilename.length === 0
      ? "Leave empty to use the default title"
      : null;

  const handleTrimChange = (s: number, e: number) => {
    setTrimStart(s);
    setTrimEnd(e);
  };

  const handlePreview = async () => {
    if (!info) return;
    setTrimStart(0);
    setTrimEnd(info.duration);
    await loadPreview(info.url);
  };

  const handleFetchInfo = async (url: string) => {
    resetPreview();
    setTrimStart(0);
    setTrimEnd(0);
    setFilenameSubmitWarning(null);
    const data = await fetchInfo(url);
    if (data) {
      setCustomFilename(sanitizeFilenameBaseName(data.title));
    }
    if (
      data &&
      canPreview &&
      !isVideoFormat(format) &&
      settings.downloadPreferences.autoOpenPreview
    ) {
      setTrimStart(0);
      setTrimEnd(data.duration);
      await loadPreview(data.url);
    }
  };

  const handleDownload = async () => {
    if (!info) return;
    if (canBrowseFolder && !outputDir) return;
    setDurationError(null);

    const sanitizedFallbackTitle = sanitizeFilenameBaseName(info.title);
    const trimmed = customFilename.trim();
    if (!trimmed) {
      setFilenameSubmitWarning(
        `No filename entered — will use: ${sanitizedFallbackTitle}`,
      );
    } else {
      setFilenameSubmitWarning(null);
    }

    const prefs = settings.downloadPreferences;
    const maxSec = prefs.maxDurationSeconds ?? ABSOLUTE_MAX_DURATION_SECONDS;
    if (info.duration > 0 && info.duration > maxSec) {
      const maxMin = Math.round(maxSec / 60);
      setDurationError(
        `This video is too long (limit: ${maxMin} min). Adjust the limit in Settings.`,
      );
      return;
    }

    await startDownload({
      url: info.url,
      format,
      resolution: isVideoFormat(format) ? resolution : undefined,
      start: trimStart > 0 ? trimStart : undefined,
      end: trimEnd < info.duration && trimEnd > 0 ? trimEnd : undefined,
      outputDir,
      bitrate,
      duration: info.duration,
      outputFilename: trimmed || undefined,
    });
  };

  const maxDurationSeconds = settings.downloadPreferences.maxDurationSeconds;

  const contextValue: AppShellContextValue = {
    activeTab,
    setActiveTab,
    dark,
    toggleDark,
    showSettings,
    setShowSettings,
    settings,
    settingsLoaded: loaded,
    saveSettings,
    toolStatus: toolStatusState,
    info,
    infoLoading,
    infoError,
    audioUrl,
    previewLoading,
    previewError,
    jobs,
    history,
    format,
    setFormat,
    resolution,
    setResolution,
    outputDir,
    setOutputDir,
    bitrate,
    setBitrate,
    trimStart,
    trimEnd,
    setTrimStart,
    setTrimEnd,
    setTrimRange: handleTrimChange,
    customFilename,
    setCustomFilename,
    hasInvalidFilenameChars,
    filenameInvalidCharsWarning,
    filenameEmptyHint,
    filenameSubmitWarning,
    durationError,
    handleFetchInfo,
    handlePreview,
    cancelPreview,
    resetPreview,
    handleDownload,
    cancelDownload,
    clearHistory,
    canPreview,
    canBrowseFolder,
    maxDurationSeconds,
  };

  return (
    <AppShellProvider value={contextValue}>
      <div className="min-h-screen bg-primary-100 p-6 dark:bg-gray-900">
        <div className="mx-auto max-w-2xl space-y-6">
          <AppShellHeader />
          <AppShellTabs />
          <SingleDownloadPanel />
          <BatchDownloadPanel />
        </div>

        <AppShellSettingsModal />
      </div>
    </AppShellProvider>
  );
}
