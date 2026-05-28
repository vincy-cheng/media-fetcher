import { useState, useEffect, useRef } from "react";
import { capabilities } from "@/api/client";
import { AudioPreview } from "@/components/AudioPreview";
import { BatchDownload } from "@/components/BatchDownload";
import { FilenameInput } from "@/components/FilenameInput";
import { FormatSelector } from "@/components/FormatSelector";
import { JobQueue } from "@/components/JobQueue";
import { OutputFolder } from "@/components/OutputFolder";
import { ResolutionSelector } from "@/components/ResolutionSelector";
import { SettingsModal } from "@/components/SettingsModal";
import { TrimControls } from "@/components/TrimControls";
import { ToolStatusBanner } from "@/components/ToolStatusBanner";
import { UrlInput } from "@/components/UrlInput";
import { VideoInfoCard } from "@/components/VideoInfoCard";
import { AppHeader } from "@/components/app/AppHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { AppTabs } from "@/components/app/AppTabs";
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
  useAppShell,
  type AppShellContextValue,
} from "@/components/app/AppShellContext";
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
      <AppShellLayout />
    </AppShellProvider>
  );
}

/**
 * Renders the app shell using shared state from context.
 */
function AppShellLayout() {
  const { setShowSettings, toolStatus } = useAppShell();

  return (
    <div className="min-h-screen bg-primary-100 p-6 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl space-y-6">
        <AppHeader />
        {toolStatus.status && toolStatus.hasError && (
          <ToolStatusBanner
            status={toolStatus.status}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}
        <AppTabs />
        <SingleDownloadPanel />
        <BatchDownloadPanel />
      </div>
      <AppSettingsModal />
    </div>
  );
}

/**
 * Renders the single-download workflow.
 */
function SingleDownloadPanel() {
  const {
    activeTab,
    handleFetchInfo,
    infoLoading,
    infoError,
    info,
    handlePreview,
    cancelPreview,
    previewLoading,
    canPreview,
    format,
    previewError,
    jobs,
    history,
    clearHistory,
    cancelDownload,
  } = useAppShell();

  return (
    <div
      role="tabpanel"
      id="tabpanel-single"
      aria-labelledby="tab-single"
      hidden={activeTab !== "single"}
      className="mt-4 space-y-6"
    >
      <UrlInput onSubmit={handleFetchInfo} loading={infoLoading} />

      {infoError && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400"
        >
          {infoError}
        </p>
      )}

      {infoLoading && <VideoInfoLoadingSkeleton />}

      {info && (
        <VideoInfoCard
          info={info}
          onPreview={handlePreview}
          onCancelPreview={cancelPreview}
          previewLoading={previewLoading}
          previewDisabled={infoLoading}
          hidePreview={isVideoFormat(format) || !canPreview}
        />
      )}

      {previewError && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400"
        >
          {previewError}
        </p>
      )}

      <PreviewTrimPanel />
      <DownloadOptionsPanel />

      <JobQueue
        jobs={jobs}
        history={history}
        onClear={clearHistory}
        onCancel={cancelDownload}
      />
    </div>
  );
}

/**
 * Renders the preview and trim controls for audio formats.
 */
function PreviewTrimPanel() {
  const { canPreview, audioUrl, info, format, trimStart, trimEnd, setTrimRange } =
    useAppShell();

  if (!canPreview || !audioUrl || !info || isVideoFormat(format)) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-lg border border-primary-200 bg-primary-50 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Preview & Trim
      </h3>
      <AudioPreview
        audioUrl={audioUrl}
        duration={info.duration}
        start={trimStart}
        end={trimEnd}
        onTrimChange={setTrimRange}
      />
      <TrimControls
        start={trimStart}
        end={trimEnd}
        duration={info.duration}
        onChange={setTrimRange}
      />
    </div>
  );
}

/**
 * Renders the single-download option controls.
 */
function DownloadOptionsPanel() {
  const {
    info,
    format,
    setFormat,
    resolution,
    setResolution,
    customFilename,
    setCustomFilename,
    filenameInvalidCharsWarning,
    filenameEmptyHint,
    filenameSubmitWarning,
    canBrowseFolder,
    outputDir,
    setOutputDir,
    durationError,
    handleDownload,
  } = useAppShell();

  if (!info) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-lg border border-primary-200 bg-primary-50 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <FormatSelector value={format} onChange={setFormat} />
      {isVideoFormat(format) && (
        <ResolutionSelector value={resolution} onChange={setResolution} />
      )}
      <FilenameInput
        value={customFilename}
        extension={format}
        onChange={setCustomFilename}
        invalidCharsWarning={filenameInvalidCharsWarning}
        emptyHint={filenameEmptyHint}
        emptyOnDownloadWarning={filenameSubmitWarning}
      />
      {canBrowseFolder && (
        <OutputFolder value={outputDir} onChange={setOutputDir} />
      )}
      {durationError && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400"
        >
          {durationError}
        </p>
      )}
      <button
        type="button"
        onClick={handleDownload}
        disabled={canBrowseFolder && !outputDir}
        className="w-full cursor-pointer rounded-md bg-primary-600 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Download{" "}
        {isVideoFormat(format)
          ? `${format.toUpperCase()} (${resolution})`
          : format.toUpperCase()}
      </button>
    </div>
  );
}

/**
 * Renders the batch-download panel with context-provided defaults.
 */
function BatchDownloadPanel() {
  const {
    activeTab,
    format,
    resolution,
    bitrate,
    outputDir,
    maxDurationSeconds,
  } = useAppShell();

  return (
    <div
      role="tabpanel"
      id="tabpanel-batch"
      aria-labelledby="tab-batch"
      hidden={activeTab !== "batch"}
    >
      <BatchDownload
        defaultFormat={format}
        defaultResolution={resolution}
        defaultBitrate={bitrate}
        defaultOutputDir={outputDir}
        maxDurationSeconds={maxDurationSeconds}
      />
    </div>
  );
}

/**
 * Renders the settings modal from context-backed state.
 */
function AppSettingsModal() {
  const { showSettings, settings, saveSettings, setShowSettings, toolStatus } =
    useAppShell();

  if (!showSettings) {
    return null;
  }

  return (
    <SettingsModal
      settings={settings}
      onSave={saveSettings}
      onClose={() => setShowSettings(false)}
      toolStatus={toolStatus.status}
      toolsChecking={toolStatus.checking}
      latestVersion={toolStatus.latestVersion}
      updateAvailable={toolStatus.updateAvailable}
      checkingUpdate={toolStatus.checkingUpdate}
      updating={toolStatus.updating}
      updateProgress={toolStatus.updateProgress}
      updateError={toolStatus.updateError}
      onCheckForUpdate={toolStatus.checkForUpdate}
      onStartUpdate={toolStatus.startUpdate}
    />
  );
}

/**
 * Renders the loading skeleton while video metadata is being fetched.
 */
function VideoInfoLoadingSkeleton() {
  return (
    <div className="flex gap-4 rounded-lg border border-primary-200 bg-primary-50 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <Skeleton className="h-24 w-40 shrink-0 rounded bg-primary-200 dark:bg-gray-700" />
      <div className="flex flex-1 flex-col justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded bg-primary-200 dark:bg-gray-700" />
          <Skeleton className="h-4 w-3/4 rounded bg-primary-200 dark:bg-gray-700" />
          <Skeleton className="h-3 w-1/3 rounded bg-primary-200 dark:bg-gray-700" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full bg-primary-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}
