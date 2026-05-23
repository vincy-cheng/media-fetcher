// client/src/App.tsx
import { useState, useEffect, useRef } from "react";
import { UrlInput } from "@/components/UrlInput";
import { VideoInfoCard } from "@/components/VideoInfoCard";
import { FormatSelector } from "@/components/FormatSelector";
import { OutputFolder } from "@/components/OutputFolder";
import { AudioPreview } from "@/components/AudioPreview";
import { TrimControls } from "@/components/TrimControls";
import { JobQueue } from "@/components/JobQueue";
import { SettingsModal } from "@/components/SettingsModal";
import { BatchDownload } from "@/components/BatchDownload";
import { Skeleton } from "@/components/ui/Skeleton";
import { useVideoInfo } from "@/hooks/useVideoInfo";
import { usePreview } from "@/hooks/usePreview";
import { useDownloadJob } from "@/hooks/useDownloadJob";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useSettings } from "@/hooks/useSettings";
import { useToolStatus } from "@/hooks/useToolStatus";
import { ToolStatusBanner } from "@/components/ToolStatusBanner";
import type { Format, VideoResolution, Bitrate } from "@/api/types";
import { ABSOLUTE_MAX_DURATION_SECONDS, isVideoFormat } from "@/api/types";
import { ResolutionSelector } from "@/components/ResolutionSelector";
import { GearIcon, SunIcon, MoonIcon } from "@radix-ui/react-icons";

type Tab = "single" | "batch";

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
  } = usePreview();
  const { jobs, history, start: startDownload, cancel: cancelDownload, clear } = useDownloadJob();
  const { dark, toggle: toggleDark } = useDarkMode();
  const { settings, loaded, save: saveSettings } = useSettings();
  const toolStatusState = useToolStatus();

  const [activeTab, setActiveTab] = useState<Tab>("single");
  const [format, setFormat] = useState<Format>("m4a");
  const [resolution, setResolution] = useState<VideoResolution>("1080p");
  const [outputDir, setOutputDir] = useState("");
  const [bitrate, setBitrate] = useState<Bitrate>(192);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [durationError, setDurationError] = useState<string | null>(null);
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

  const handleDownload = async () => {
    if (!info || !outputDir) return;
    setDurationError(null);

    const prefs = settings.downloadPreferences;
    const maxSec = prefs.maxDurationSeconds ?? ABSOLUTE_MAX_DURATION_SECONDS;
    if (info.duration > 0 && info.duration > maxSec) {
      const maxMin = Math.round(maxSec / 60);
      setDurationError(
        `This video is too long (limit: ${maxMin} min). Adjust the limit in Settings.`
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
    });
  };

  return (
    <div className="min-h-screen bg-primary-50 p-6 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              YouTube Audio Downloader
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Download audio or video in multiple formats
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="relative inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-primary-700 bg-primary-600 px-3 py-1.5 text-sm text-primary-50 hover:bg-primary-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label="Open settings"
            >
              <GearIcon />
              Settings
              {toolStatusState.hasError && (
                <span
                  className="absolute -right-1 -top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500"
                  aria-label="Tool error"
                />
              )}
            </button>
            <button
              type="button"
              onClick={toggleDark}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-primary-700 bg-primary-600 px-3 py-1.5 text-sm text-primary-50 hover:bg-primary-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label="Toggle dark mode"
            >
              {dark ? (
                <>
                  <SunIcon /> Light
                </>
              ) : (
                <>
                  <MoonIcon /> Dark
                </>
              )}
            </button>
          </div>
        </header>

        {toolStatusState.status && toolStatusState.hasError && (
          <ToolStatusBanner
            status={toolStatusState.status}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}

        {/* Tab bar */}
        <div
          className="flex gap-1 rounded-lg border border-primary-200 bg-primary-50 p-1 dark:border-gray-700 dark:bg-gray-800"
          role="tablist"
        >
          {(["single", "batch"] as Tab[]).map((tab) => (
            <button
              key={tab}
              id={`tab-${tab}`}
              type="button"
              onClick={() => setActiveTab(tab)}
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`tabpanel-${tab}`}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 hover:bg-primary-100 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {tab === "single" ? "Single" : "Batch"}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id="tabpanel-single"
          aria-labelledby="tab-single"
          hidden={activeTab !== "single"}
          className="mt-4 space-y-6"
        >
          <UrlInput onSubmit={fetchInfo} loading={infoLoading} />

          {infoError && (
            <p
              role="alert"
              className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-700"
            >
              {infoError}
            </p>
          )}

          {infoLoading && (
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
          )}

          {info && (
            <VideoInfoCard
              info={info}
              onPreview={handlePreview}
              onCancelPreview={cancelPreview}
              previewLoading={previewLoading}
              previewDisabled={infoLoading}
              hidePreview={isVideoFormat(format)}
            />
          )}

          {previewError && (
            <p
              role="alert"
              className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400 mt-4 border border-red-200 dark:border-red-700"
            >
              {previewError}
            </p>
          )}

          {audioUrl && info && !isVideoFormat(format) && (
            <div className="space-y-3 rounded-lg border border-primary-200 bg-primary-50 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Preview & Trim
              </h3>
              <AudioPreview
                audioUrl={audioUrl}
                duration={info.duration}
                start={trimStart}
                end={trimEnd}
                onTrimChange={handleTrimChange}
              />
              <TrimControls
                start={trimStart}
                end={trimEnd}
                duration={info.duration}
                onChange={handleTrimChange}
              />
            </div>
          )}

          {info && (
            <div className="space-y-4 rounded-lg border border-primary-200 bg-primary-50 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <FormatSelector value={format} onChange={setFormat} />
              {isVideoFormat(format) && (
                <ResolutionSelector value={resolution} onChange={setResolution} />
              )}
              <OutputFolder value={outputDir} onChange={setOutputDir} />
              {durationError && (
                <p
                  role="alert"
                  className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-700"
                >
                  {durationError}
                </p>
              )}
              <button
                type="button"
                onClick={handleDownload}
                disabled={!outputDir}
                className="w-full cursor-pointer rounded-md bg-primary-600 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Download {isVideoFormat(format) ? `${format.toUpperCase()} (${resolution})` : format.toUpperCase()}
              </button>
            </div>
          )}

          <JobQueue jobs={jobs} history={history} onClear={clear} onCancel={cancelDownload} />
        </div>

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
            maxDurationSeconds={settings.downloadPreferences.maxDurationSeconds}
          />
        </div>
      </div>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
          toolStatus={toolStatusState.status}
          toolsChecking={toolStatusState.checking}
          latestVersion={toolStatusState.latestVersion}
          updateAvailable={toolStatusState.updateAvailable}
          checkingUpdate={toolStatusState.checkingUpdate}
          updating={toolStatusState.updating}
          updateProgress={toolStatusState.updateProgress}
          updateError={toolStatusState.updateError}
          onCheckForUpdate={toolStatusState.checkForUpdate}
          onStartUpdate={toolStatusState.startUpdate}
        />
      )}
    </div>
  );
}
