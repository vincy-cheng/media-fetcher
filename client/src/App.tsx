// client/src/App.tsx
import { useState, useEffect, useRef } from 'react'
import { UrlInput } from '@/components/UrlInput'
import { VideoInfoCard } from '@/components/VideoInfoCard'
import { FormatSelector } from '@/components/FormatSelector'
import { OutputFolder } from '@/components/OutputFolder'
import { AudioPreview } from '@/components/AudioPreview'
import { TrimControls } from '@/components/TrimControls'
import { JobQueue } from '@/components/JobQueue'
import { SettingsModal } from '@/components/SettingsModal'
import { BatchDownload } from '@/components/BatchDownload'
import { Skeleton } from '@/components/ui/Skeleton'
import { useVideoInfo } from '@/hooks/useVideoInfo'
import { usePreview } from '@/hooks/usePreview'
import { useDownloadJob } from '@/hooks/useDownloadJob'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useSettings } from '@/hooks/useSettings'
import type { AudioFormat, Bitrate } from '@/api/types'

type Tab = 'single' | 'batch'

export default function App() {
  const { info, loading: infoLoading, error: infoError, fetch: fetchInfo } = useVideoInfo()
  const { audioUrl, loading: previewLoading, error: previewError, load: loadPreview } = usePreview()
  const { jobs, start: startDownload, clear } = useDownloadJob()
  const { dark, toggle: toggleDark } = useDarkMode()
  const { settings, loaded, save: saveSettings } = useSettings()

  const [activeTab, setActiveTab] = useState<Tab>('single')
  const [format, setFormat] = useState<AudioFormat>('m4a')
  const [outputDir, setOutputDir] = useState('')
  const [bitrate, setBitrate] = useState<Bitrate>(192)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const prefilled = useRef(false)

  useEffect(() => {
    if (!loaded || prefilled.current) return
    prefilled.current = true
    const prefs = settings.downloadPreferences
    setFormat(prefs.defaultFormat)
    if (prefs.defaultOutputDir) setOutputDir(prefs.defaultOutputDir)
    setBitrate(prefs.defaultBitrate)
  }, [loaded, settings])

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
      bitrate,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">YouTube Audio Downloader</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Download audio in mp3, m4a, wav, ogg, or flac</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label="Open settings"
            >
              ⚙️ Settings
            </button>
            <button
              type="button"
              onClick={toggleDark}
              className="cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label="Toggle dark mode"
            >
              {dark ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </header>

        {/* Tab bar */}
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800" role="tablist">
          {(['single', 'batch'] as Tab[]).map((tab) => (
            <button
              key={tab}
              id={`tab-${tab}`}
              type="button"
              onClick={() => setActiveTab(tab)}
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`tabpanel-${tab}`}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {tab === 'single' ? 'Single' : 'Batch'}
            </button>
          ))}
        </div>

        <div role="tabpanel" id="tabpanel-single" aria-labelledby="tab-single" hidden={activeTab !== 'single'}>
            <UrlInput onSubmit={fetchInfo} loading={infoLoading} />

            {infoError && (
              <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">{infoError}</p>
            )}

            {infoLoading && (
              <div className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <Skeleton className="h-24 w-40 shrink-0 rounded dark:bg-gray-700" />
                <div className="flex flex-1 flex-col justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full rounded dark:bg-gray-700" />
                    <Skeleton className="h-4 w-3/4 rounded dark:bg-gray-700" />
                    <Skeleton className="h-3 w-1/3 rounded dark:bg-gray-700" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full dark:bg-gray-700" />
                </div>
              </div>
            )}

            {info && (
              <VideoInfoCard
                info={info}
                onPreview={handlePreview}
                previewLoading={previewLoading}
              />
            )}

            {previewError && (
              <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">{previewError}</p>
            )}

            {audioUrl && info && (
              <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Preview & Trim</h3>
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
              <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <FormatSelector value={format} onChange={setFormat} />
                <OutputFolder value={outputDir} onChange={setOutputDir} />
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!outputDir}
                  className="w-full cursor-pointer rounded-md bg-primary-600 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Download {format.toUpperCase()}
                </button>
              </div>
            )}

            <JobQueue jobs={jobs} onClear={clear} />
          </div>

        <div role="tabpanel" id="tabpanel-batch" aria-labelledby="tab-batch" hidden={activeTab !== 'batch'}>
          <BatchDownload
            defaultFormat={format}
            defaultBitrate={bitrate}
            defaultOutputDir={outputDir}
          />
        </div>
      </div>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
