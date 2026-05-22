import { Skeleton } from '@/components/ui/Skeleton'
import type { BatchItem } from '@/hooks/useBatchDownload'

const STAGE_LABELS: Record<string, string> = {
  downloading: 'Downloading',
  converting: 'Converting',
  complete: 'Complete',
  error: 'Error',
}

const STAGE_COLORS: Record<string, string> = {
  downloading: 'bg-blue-500',
  converting: 'bg-indigo-500',
  complete: 'bg-green-500',
  error: 'bg-red-500',
}

interface BatchItemRowProps {
  item: BatchItem
  onRemove: (id: string) => void
  onRetry: (id: string) => void
}

export function BatchItemRow({ item, onRemove, onRetry }: BatchItemRowProps) {
  const isInProgress =
    item.progress &&
    item.progress.stage !== 'complete' &&
    item.progress.stage !== 'error'

  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Thumbnail */}
      {item.infoLoading ? (
        <Skeleton className="h-14 w-20 shrink-0 rounded dark:bg-gray-700" />
      ) : item.info?.thumbnail ? (
        <img
          src={item.info.thumbnail}
          alt=""
          className="h-14 w-20 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="h-14 w-20 shrink-0 rounded bg-gray-100 dark:bg-gray-700" />
      )}

      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-1">
        {/* Title / loading / error */}
        {item.infoLoading ? (
          <div className="space-y-1">
            <Skeleton className="h-3 w-full rounded dark:bg-gray-700" />
            <Skeleton className="h-3 w-2/3 rounded dark:bg-gray-700" />
          </div>
        ) : item.infoError ? (
          <div className="flex items-center gap-2">
            <p className="truncate text-xs text-red-500 dark:text-red-400">{item.infoError}</p>
            <button
              type="button"
              onClick={() => onRetry(item.id)}
              aria-label="Retry fetching video information"
              className="shrink-0 text-xs text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Retry
            </button>
          </div>
        ) : (
          <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
            {item.info?.title ?? item.url}
          </p>
        )}

        {/* Duration */}
        {item.info && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatDuration(item.info.duration)}
          </p>
        )}

        {/* Progress bar */}
        {item.progress && (
          <>
            <div className="flex items-center justify-between gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ${STAGE_COLORS[item.progress.stage] ?? 'bg-gray-400'}`}
              >
                {STAGE_LABELS[item.progress.stage] ?? item.progress.stage}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {item.progress.percent.toFixed(0)}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={item.progress.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={STAGE_LABELS[item.progress.stage] ?? item.progress.stage}
              className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700"
            >
              <div
                className={`h-1.5 rounded-full transition-all ${STAGE_COLORS[item.progress.stage] ?? 'bg-gray-400'}`}
                style={{ width: `${item.progress.percent}%` }}
              />
            </div>
            {item.outputPath && (
              <p className="truncate text-xs font-medium text-green-600 dark:text-green-400">
                {item.outputPath}
              </p>
            )}
            {item.progress.stage === 'error' && (
              <p className="truncate text-xs text-red-500 dark:text-red-400">
                {item.progress.message}
              </p>
            )}
          </>
        )}
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        disabled={!!isInProgress}
        aria-label={`Remove ${item.info?.title ?? item.url}`}
        className="shrink-0 cursor-pointer rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-700 dark:hover:text-gray-300"
      >
        ✕
      </button>
    </div>
  )
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}
