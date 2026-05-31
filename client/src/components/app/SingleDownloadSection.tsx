import { JobQueue } from "@/components/JobQueue";
import { UrlInput } from "@/components/UrlInput";
import { VideoInfoCard } from "@/components/VideoInfoCard";
import { PreviewSection } from "@/components/app/PreviewSection";
import { TrimSection } from "@/components/TrimSection";
import { DownloadSection } from "@/components/app/DownloadSection";
import { useVideoFetch } from "@/components/app/VideoFetchContext";
import { usePreviewContext } from "@/components/app/PreviewContext";
import { useJobQueue } from "@/components/app/JobQueueContext";
import { useDownloadOptions } from "@/providers/DownloadOptionsProvider";
import { Skeleton } from "@/components/ui/Skeleton";
import { isVideoFormat } from "@/api/types";

/**
 * Renders the single-download workflow body from focused context hooks.
 */
export function SingleDownloadSection() {
  const { handleFetchInfo, infoLoading, infoError, info } = useVideoFetch();
  const { handlePreview, cancelPreview, previewLoading, previewError } = usePreviewContext();
  const { jobs, history, clearHistory, cancelDownload } = useJobQueue();
  const { format, canPreview } = useDownloadOptions();

  return (
    <div className="space-y-6">
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

      <PreviewSection />
      <TrimSection />
      <DownloadSection />

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
