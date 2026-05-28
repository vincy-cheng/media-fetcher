import { FormatSelector } from "@/components/FormatSelector";
import { ResolutionSelector } from "@/components/ResolutionSelector";
import { FilenameInput } from "@/components/FilenameInput";
import { OutputFolder } from "@/components/OutputFolder";
import { useAppShell } from "@/components/app/AppShellContext";
import { isVideoFormat } from "@/api/types";

/**
 * Renders context-backed controls for a single download.
 */
export function DownloadSection() {
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
