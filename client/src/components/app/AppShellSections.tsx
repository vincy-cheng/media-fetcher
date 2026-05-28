import { GearIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { ToolStatusBanner } from "@/components/ToolStatusBanner";
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
import { FilenameInput } from "@/components/FilenameInput";
import { ResolutionSelector } from "@/components/ResolutionSelector";
import { isVideoFormat } from "@/api/types";
import { useAppShell, type AppShellTab } from "@/components/app/AppShellContext";

/**
 * Renders the shared app shell header and tool status banner.
 */
export function AppShellHeader() {
  const { dark, toggleDark, setShowSettings, toolStatus } = useAppShell();

  return (
    <>
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Media Fetcher
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
            {toolStatus.hasError && (
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

      {toolStatus.status && toolStatus.hasError && (
        <ToolStatusBanner
          status={toolStatus.status}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}
    </>
  );
}

/**
 * Renders the top-level single/batch tab switcher.
 */
export function AppShellTabs() {
  const { activeTab, setActiveTab } = useAppShell();

  return (
    <div
      className="flex gap-1 rounded-lg border border-primary-200 bg-primary-50 p-1 dark:border-gray-700 dark:bg-gray-800"
      role="tablist"
    >
      {(["single", "batch"] as AppShellTab[]).map((tab) => (
        <button
          key={tab}
          id={`tab-${tab}`}
          type="button"
          onClick={() => setActiveTab(tab)}
          role="tab"
          aria-selected={activeTab === tab}
          aria-controls={`tabpanel-${tab}`}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors hover:cursor-pointer ${
            activeTab === tab
              ? "bg-primary-600 text-white"
              : "text-gray-600 hover:bg-primary-100 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          {tab === "single" ? "Single" : "Batch"}
        </button>
      ))}
    </div>
  );
}

/**
 * Renders the single-download workflow using app shell context.
 */
export function SingleDownloadPanel() {
  const {
    activeTab,
    info,
    infoLoading,
    infoError,
    handleFetchInfo,
    handlePreview,
    cancelPreview,
    previewLoading,
    previewError,
    format,
    setFormat,
    resolution,
    setResolution,
    customFilename,
    setCustomFilename,
    filenameInvalidCharsWarning,
    filenameEmptyHint,
    filenameSubmitWarning,
    canPreview,
    audioUrl,
    trimStart,
    trimEnd,
    setTrimRange,
    outputDir,
    setOutputDir,
    canBrowseFolder,
    durationError,
    handleDownload,
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

      {canPreview && audioUrl && info && !isVideoFormat(format) && (
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
      )}

      {info && (
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
      )}

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
 * Renders the batch-download workflow using app shell context.
 */
export function BatchDownloadPanel() {
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
 * Renders the settings modal from shared shell state.
 */
export function AppShellSettingsModal() {
  const { showSettings, setShowSettings, settings, saveSettings, toolStatus } =
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
