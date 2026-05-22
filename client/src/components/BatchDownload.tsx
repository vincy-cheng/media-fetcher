// client/src/components/BatchDownload.tsx
import { useState } from 'react'
import { BatchUrlInput } from '@/components/BatchUrlInput'
import { BatchItemRow } from '@/components/BatchItemRow'
import { FormatSelector } from '@/components/FormatSelector'
import { OutputFolder } from '@/components/OutputFolder'
import { useBatchDownload } from '@/hooks/useBatchDownload'
import type { AudioFormat, Bitrate } from '@/api/types'

interface BatchDownloadProps {
  defaultFormat: AudioFormat
  defaultBitrate: Bitrate
  defaultOutputDir: string
}

export function BatchDownload({ defaultFormat, defaultBitrate, defaultOutputDir }: BatchDownloadProps) {
  const { items, downloading, addUrl, retryInfo, removeItem, downloadAll, clearAll } = useBatchDownload()
  const [format, setFormat] = useState<AudioFormat>(defaultFormat)
  const [bitrate] = useState<Bitrate>(defaultBitrate)
  const [outputDir, setOutputDir] = useState(defaultOutputDir)

  const readyCount = items.filter((i) => i.info && !i.infoLoading && !i.infoError).length
  const canDownload = readyCount > 0 && outputDir.trim().length > 0 && !downloading

  const handleDownloadAll = () => {
    if (!canDownload) return
    downloadAll(format, bitrate, outputDir)
  }

  return (
    <div className="space-y-4">
      <BatchUrlInput count={items.length} onAdd={addUrl} />

      {items.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {items.length} URL{items.length !== 1 ? 's' : ''} queued
              {readyCount < items.length && ` (${readyCount} ready)`}
            </span>
            <button
              type="button"
              onClick={clearAll}
              disabled={downloading}
              className="cursor-pointer text-xs text-gray-400 underline hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-500 dark:hover:text-gray-300"
            >
              Clear all
            </button>
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {items.map((item) => (
              <BatchItemRow
                key={item.id}
                item={item}
                onRemove={removeItem}
                onRetry={retryInfo}
              />
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 space-y-4">
        <FormatSelector value={format} onChange={setFormat} />
        <OutputFolder value={outputDir} onChange={setOutputDir} />
        <button
          type="button"
          onClick={handleDownloadAll}
          disabled={!canDownload}
          className="w-full cursor-pointer rounded-md bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {downloading
            ? 'Downloading…'
            : `Download All ${format.toUpperCase()}${readyCount > 0 ? ` (${readyCount})` : ''}`}
        </button>
      </div>
    </div>
  )
}
