import type { VideoInfo } from '@/api/types'

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}

interface VideoInfoCardProps {
  info: VideoInfo
  onPreview?: () => void
  previewLoading?: boolean
}

export function VideoInfoCard({ info, onPreview, previewLoading }: VideoInfoCardProps) {
  return (
    <div className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {info.thumbnail && (
        <img
          src={info.thumbnail}
          alt={info.title}
          className="h-24 w-40 rounded object-cover"
        />
      )}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h2 className="line-clamp-2 text-base font-semibold dark:text-gray-100">{info.title}</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{info.uploader}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {formatDuration(info.duration)}
          </span>
          {onPreview && (
            <button
              onClick={onPreview}
              disabled={previewLoading}
              className="cursor-pointer rounded bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
            >
              {previewLoading ? 'Loading preview…' : '▶ Preview'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
