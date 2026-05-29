import { useState } from "react";
import type { PropsWithChildren } from "react";
import { useVideoInfo } from "@/hooks/useVideoInfo";
import { usePreview } from "@/hooks/usePreview";
import { useDownloadJob } from "@/hooks/useDownloadJob";
import { useDownloadOptions } from "@/providers/DownloadOptionsProvider";
import { useSettingsContext } from "@/providers/SettingsProvider";
import { ABSOLUTE_MAX_DURATION_SECONDS, isVideoFormat } from "@/api/types";
import {
  sanitizeFilenameBaseName,
  hasDisallowedFilenameChars,
} from "@/utils/filename";
import { VideoFetchContext } from "@/components/app/VideoFetchContext";
import { PreviewContext } from "@/components/app/PreviewContext";
import { DownloadFormContext } from "@/components/app/DownloadFormContext";
import { JobQueueContext } from "@/components/app/JobQueueContext";

/**
 * Orchestrates all single-download state and exposes it through four focused contexts.
 * Must be placed inside DownloadOptionsProvider and SettingsProvider.
 */
export function SingleDownloadProvider({ children }: PropsWithChildren) {
  const { info, loading: infoLoading, error: infoError, fetch: fetchInfo } = useVideoInfo();
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

  const { format, resolution, outputDir, bitrate, canPreview, canBrowseFolder } =
    useDownloadOptions();
  const { settings } = useSettingsContext();

  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [customFilename, setCustomFilename] = useState("");
  const [durationError, setDurationError] = useState<string | null>(null);
  const [filenameSubmitWarning, setFilenameSubmitWarning] = useState<string | null>(null);

  const setTrimRange = (start: number, end: number) => {
    setTrimStart(start);
    setTrimEnd(end);
  };

  const handleFetchInfo = async (url: string) => {
    resetPreview();
    setTrimStart(0);
    setTrimEnd(0);
    setFilenameSubmitWarning(null);
    setDurationError(null);
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

  const handlePreview = async () => {
    if (!info) return;
    setTrimStart(0);
    setTrimEnd(info.duration);
    await loadPreview(info.url);
  };

  const handleDownload = async () => {
    if (!info) return;
    if (canBrowseFolder && !outputDir) return;
    setDurationError(null);

    const sanitizedFallbackTitle = sanitizeFilenameBaseName(info.title);
    const trimmed = customFilename.trim();
    if (!trimmed) {
      setFilenameSubmitWarning(`No filename entered — will use: ${sanitizedFallbackTitle}`);
    } else {
      setFilenameSubmitWarning(null);
    }

    const maxSec =
      settings.downloadPreferences.maxDurationSeconds ?? ABSOLUTE_MAX_DURATION_SECONDS;
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

  const hasInvalidFilenameChars = hasDisallowedFilenameChars(customFilename);
  const trimmedFilename = customFilename.trim();

  return (
    <VideoFetchContext.Provider value={{ info, infoLoading, infoError, handleFetchInfo }}>
      <PreviewContext.Provider
        value={{
          audioUrl,
          previewLoading,
          previewError,
          trimStart,
          trimEnd,
          handlePreview,
          cancelPreview,
          resetPreview,
          setTrimRange,
        }}
      >
        <DownloadFormContext.Provider
          value={{
            customFilename,
            setCustomFilename,
            hasInvalidFilenameChars,
            filenameInvalidCharsWarning: hasInvalidFilenameChars
              ? "Some characters will be replaced with '_'"
              : null,
            filenameEmptyHint:
              trimmedFilename.length === 0 ? "Leave empty to use the default title" : null,
            filenameSubmitWarning,
            durationError,
            handleDownload,
          }}
        >
          <JobQueueContext.Provider value={{ jobs, history, cancelDownload, clearHistory }}>
            {children}
          </JobQueueContext.Provider>
        </DownloadFormContext.Provider>
      </PreviewContext.Provider>
    </VideoFetchContext.Provider>
  );
}
