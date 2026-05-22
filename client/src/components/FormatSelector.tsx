import type { AudioFormat } from '@/api/types'

const FORMATS: { value: AudioFormat; label: string }[] = [
  { value: 'mp3', label: 'MP3' },
  { value: 'm4a', label: 'M4A (AAC)' },
  { value: 'wav', label: 'WAV' },
  { value: 'ogg', label: 'OGG Vorbis' },
  { value: 'flac', label: 'FLAC' },
]

interface FormatSelectorProps {
  value: AudioFormat
  onChange: (format: AudioFormat) => void
}

export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Output Format</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as AudioFormat)}
          className="w-full cursor-pointer appearance-none rounded-md border border-gray-300 bg-white pl-4 pr-10 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4M16 15l-4 4-4-4" />
          </svg>
        </div>
      </div>
    </div>
  )
}
