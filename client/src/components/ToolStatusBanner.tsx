import { useState } from 'react'
import type { ToolsStatus } from '@/api/types'
import { ExclamationTriangleIcon, Cross2Icon } from '@radix-ui/react-icons'

interface ToolStatusBannerProps {
  status: ToolsStatus
  onOpenSettings: () => void
}

export function ToolStatusBanner({ status, onOpenSettings }: ToolStatusBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const brokenTools: string[] = []
  if (status.ytdlp.error) brokenTools.push('yt-dlp')
  if (status.ffmpeg.error) brokenTools.push('ffmpeg')

  if (brokenTools.length === 0) return null

  const toolList = brokenTools.join(' and ')

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm dark:border-red-800 dark:bg-red-950"
    >
      <span className="inline-flex items-center gap-1.5 text-red-800 dark:text-red-200">
        <ExclamationTriangleIcon className="shrink-0" /> <strong>{toolList}</strong>{' '}
        {brokenTools.length === 1 ? 'is' : 'are'} unavailable — downloads will fail.{' '}
        <button
          type="button"
          onClick={onOpenSettings}
          className="cursor-pointer font-medium underline hover:no-underline"
        >
          Check in Settings
        </button>
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss warning"
        className="cursor-pointer text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
      >
        <Cross2Icon />
      </button>
    </div>
  )
}
