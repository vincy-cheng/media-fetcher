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
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as AudioFormat)}
        className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
      >
        {FORMATS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>
    </div>
  )
}
