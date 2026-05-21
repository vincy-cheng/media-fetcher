import { useState } from 'react'
import { UrlInput } from '@/components/UrlInput'
import { VideoInfoCard } from '@/components/VideoInfoCard'
import { FormatSelector } from '@/components/FormatSelector'
import { OutputFolder } from '@/components/OutputFolder'
import { AudioPreview } from '@/components/AudioPreview'
import { TrimControls } from '@/components/TrimControls'
import { JobQueue } from '@/components/JobQueue'
import { useVideoInfo } from '@/hooks/useVideoInfo'
import { usePreview } from '@/hooks/usePreview'
import { useDownloadJob } from '@/hooks/useDownloadJob'
import type { AudioFormat } from '@/api/types'

export default function App() {
  const { info, loading: infoLoading, error: infoError, fetch: fetchInfo } = useVideoInfo()
  const { audioUrl, loading: previewLoading, error: previewError, load: loadPreview } = usePreview()
  const { jobs, start: startDownload, clear } = useDownloadJob()

  const [format, setFormat] = useState<AudioFormat>('mp3')
  const [outputDir, setOutputDir] = useState('')
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)

  const handleTrimChange = (s: number, e: number) => {
    setTrimStart(s)
    setTrimEnd(e)
  }

  const handlePreview = async () => {
    if (!info) return
    setTrimStart(0)
    setTrimEnd(info.duration)
    await loadPreview(info.url)
  }

  const handleDownload = async () => {
    if (!info || !outputDir) return
    await startDownload({
      url: info.url,
      format,
      start: trimStart > 0 ? trimStart : undefined,
      end: trimEnd < info.duration && trimEnd > 0 ? trimEnd : undefined,
      outputDir,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">YouTube Audio Downloader</h1>
          <p className="text-sm text-gray-500">Download audio in mp3, m4a, wav, ogg, or flac</p>
        </header>

        <UrlInput onSubmit={fetchInfo} loading={infoLoading} />

        {infoError && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{infoError}</p>
        )}

        {info && (
          <VideoInfoCard
            info={info}
            onPreview={handlePreview}
            previewLoading={previewLoading}
          />
        )}

        {previewError && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{previewError}</p>
        )}

        {audioUrl && info && (
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700">Preview & Trim</h3>
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
          <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <FormatSelector value={format} onChange={setFormat} />
            <OutputFolder value={outputDir} onChange={setOutputDir} />
            <button
              type="button"
              onClick={handleDownload}
              disabled={!outputDir}
              className="w-full rounded-md bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Download {format.toUpperCase()}
            </button>
          </div>
        )}

        <JobQueue jobs={jobs} onClear={clear} />
      </div>
    </div>
  )
}
