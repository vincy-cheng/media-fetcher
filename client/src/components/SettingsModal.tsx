import { useState } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import type { AppSettings, AudioFormat, Bitrate } from '@/api/types'

const FORMATS: { value: AudioFormat; label: string }[] = [
  { value: 'mp3', label: 'MP3' },
  { value: 'm4a', label: 'M4A' },
  { value: 'wav', label: 'WAV' },
  { value: 'ogg', label: 'OGG' },
  { value: 'flac', label: 'FLAC' },
]

const BITRATES: Bitrate[] = [128, 192, 256, 320]

const LOSSLESS: AudioFormat[] = ['wav', 'flac']

interface SettingsModalProps {
  settings: AppSettings
  onSave: (updated: AppSettings) => Promise<void>
  onClose: () => void
}

export function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const prefs = settings.downloadPreferences
  const [format, setFormat] = useState<AudioFormat>(prefs.defaultFormat)
  const [outputDir, setOutputDir] = useState(prefs.defaultOutputDir)
  const [bitrate, setBitrate] = useState<Bitrate>(prefs.defaultBitrate)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)

  const isLossless = LOSSLESS.includes(format)

  const handleBrowse = async () => {
    setPicking(true)
    try {
      const selected = await open({ directory: true, multiple: false })
      if (typeof selected === 'string') setOutputDir(selected)
    } catch {
      // user cancelled
    } finally {
      setPicking(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await onSave({
        ...settings,
        downloadPreferences: {
          defaultFormat: format,
          defaultOutputDir: outputDir,
          defaultBitrate: bitrate,
        },
      })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5">
          {/* Default Format */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Default Format</label>
            <div className="flex gap-2 flex-wrap">
              {FORMATS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFormat(f.value)}
                  className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                    format === f.value
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Default Output Folder */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="outputDir" className="text-sm font-medium text-gray-700 dark:text-gray-300">Default Output Folder</label>
            <div className="flex gap-2">
              <input
                id="outputDir"
                type="text"
                value={outputDir}
                onChange={(e) => setOutputDir(e.target.value)}
                placeholder="/Users/you/Downloads"
                className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
              />
              <button
                type="button"
                onClick={handleBrowse}
                disabled={picking}
                className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Browse
              </button>
            </div>
          </div>

          {/* Default Bitrate (lossy formats only) */}
          {!isLossless && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Default Bitrate
              </label>
              <div className="flex gap-2">
                {BITRATES.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBitrate(b)}
                    className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                      bitrate === b
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {b}
                  </button>
                ))}
                <span className="self-center text-xs text-gray-400 dark:text-gray-500">kbps</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
