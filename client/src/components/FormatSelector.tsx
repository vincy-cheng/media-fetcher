import type { Format } from '@/api/types'

interface FormatSelectorProps {
  value: Format
  onChange: (format: Format) => void
}

export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Output Format</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as Format)}
          className="w-full cursor-pointer appearance-none rounded-md border border-primary-200 bg-primary-50 pl-4 pr-10 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          <optgroup label="Audio">
            <option value="mp3">MP3</option>
            <option value="m4a">M4A (AAC)</option>
            <option value="wav">WAV</option>
            <option value="ogg">OGG Vorbis</option>
            <option value="flac">FLAC</option>
          </optgroup>
          <optgroup label="Video">
            <option value="mp4">MP4</option>
            <option value="webm">WebM</option>
          </optgroup>
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
