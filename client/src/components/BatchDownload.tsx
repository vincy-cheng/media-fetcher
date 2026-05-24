// client/src/components/BatchDownload.tsx
import { useState, useEffect, useRef } from "react";
import { BatchUrlInput } from "@/components/BatchUrlInput";
import { BatchItemRow } from "@/components/BatchItemRow";
import { FormatSelector } from "@/components/FormatSelector";
import { ResolutionSelector } from "@/components/ResolutionSelector";
import { OutputFolder } from "@/components/OutputFolder";
import { useBatchDownload } from "@/hooks/useBatchDownload";
import type { Format, VideoResolution, Bitrate } from "@/api/types";
import { isVideoFormat } from "@/api/types";
import { capabilities } from "@/api/client";

const PAGE_SIZE = 5;
const NON_RETRIABLE = new Set([
  "complete",
  "downloading",
  "converting",
  "cancelling",
]);

interface BatchDownloadProps {
  defaultFormat: Format;
  defaultResolution: VideoResolution;
  defaultBitrate: Bitrate;
  defaultOutputDir: string;
  maxDurationSeconds: number | null;
}

export function BatchDownload({
  defaultFormat,
  defaultResolution,
  defaultBitrate,
  defaultOutputDir,
  maxDurationSeconds,
}: BatchDownloadProps) {
  const {
    items,
    downloading,
    addUrl,
    retryInfo,
    removeItem,
    cancelItem,
    downloadAll,
    clearAll,
  } = useBatchDownload();
  const [format, setFormat] = useState<Format>(defaultFormat);
  const [resolution, setResolution] = useState<VideoResolution>(defaultResolution);
  const [bitrate] = useState<Bitrate>(defaultBitrate);
  const [outputDir, setOutputDir] = useState(defaultOutputDir);
  const [completedPage, setCompletedPage] = useState(1);

  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !defaultOutputDir) return;
    prefilled.current = true;
    setOutputDir(defaultOutputDir);
  }, [defaultOutputDir]);

  // Only truly completed downloads go to the completed section
  const completedItems = items.filter((i) => i.progress?.stage === "complete");
  // Everything else (pending, loading, error, cancelled, in-progress) stays in the queue
  const activeItems = items.filter((i) => i.progress?.stage !== "complete");

  const readyCount = activeItems.filter(
    (i) =>
      i.info &&
      !i.infoLoading &&
      !i.infoError &&
      (!i.progress || !NON_RETRIABLE.has(i.progress.stage)),
  ).length;
  const canDownload =
    readyCount > 0 &&
    (outputDir.trim().length > 0 || !capabilities.canBrowseFolder) &&
    !downloading;

  const totalPages = Math.ceil(completedItems.length / PAGE_SIZE);
  const pagedCompleted = completedItems.slice(
    (completedPage - 1) * PAGE_SIZE,
    completedPage * PAGE_SIZE,
  );

  // Reset to last valid page if items are removed
  useEffect(() => {
    if (completedPage > totalPages && totalPages > 0)
      setCompletedPage(totalPages);
  }, [completedPage, totalPages]);

  const handleDownloadAll = () => {
    if (!canDownload) return;
    downloadAll(format, isVideoFormat(format) ? resolution : undefined, bitrate, outputDir, maxDurationSeconds);
  };

  return (
    <div className="space-y-4">
      <BatchUrlInput count={activeItems.length} onAdd={addUrl} />

      {activeItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {activeItems.length} queued
              {activeItems.length > 1 ? "s" : ""}
              {readyCount < activeItems.length &&
                ` · ${readyCount} pending for download`}
            </span>
            <button
              type="button"
              onClick={clearAll}
              disabled={downloading}
              className="cursor-pointer text-xs text-gray-400 underline hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-500 dark:hover:text-gray-300"
            >
              Clear All
            </button>
          </div>

          {activeItems.map((item) => (
            <BatchItemRow
              key={item.id}
              item={item}
              onRemove={removeItem}
              onRetry={retryInfo}
              onCancel={cancelItem}
            />
          ))}
        </div>
      )}

      <FormatSelector value={format} onChange={setFormat} />
      {isVideoFormat(format) && (
        <ResolutionSelector value={resolution} onChange={setResolution} />
      )}
      {capabilities.canBrowseFolder && (
      <OutputFolder value={outputDir} onChange={setOutputDir} />
      )}

      <button
        type="button"
        onClick={handleDownloadAll}
        disabled={!canDownload}
        className="w-full cursor-pointer rounded-md bg-primary-600 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {downloading
          ? "Downloading…"
          : `Download All (${readyCount}) as ${format.toUpperCase()}`}
      </button>

      {completedItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Completed ({completedItems.length})
            </span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          </div>

          {pagedCompleted.map((item) => (
            <BatchItemRow
              key={item.id}
              item={item}
              onRemove={removeItem}
              onRetry={retryInfo}
              onCancel={cancelItem}
            />
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCompletedPage((p) => Math.max(1, p - 1))}
                disabled={completedPage === 1}
                className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                ‹ Prev
              </button>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {completedPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCompletedPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={completedPage === totalPages}
                className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
