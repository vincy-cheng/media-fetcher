function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}

function parseTime(str: string): number {
  const parts = str.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return Number(parts[0]) || 0
}

interface TrimControlsProps {
  start: number
  end: number
  duration: number
  onChange: (start: number, end: number) => void
}

export function TrimControls({ start, end, duration, onChange }: TrimControlsProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Start</label>
        <input
          type="text"
          className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
          value={formatTime(start)}
          onChange={(e) => {
            const s = parseTime(e.target.value)
            if (!isNaN(s) && s < end) onChange(s, end)
          }}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">End</label>
        <input
          type="text"
          className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
          value={formatTime(end)}
          onChange={(e) => {
            const s = parseTime(e.target.value)
            if (!isNaN(s) && s > start && s <= duration) onChange(start, s)
          }}
        />
      </div>
      <button
        type="button"
        onClick={() => onChange(0, duration)}
        className="mt-4 text-xs text-gray-400 hover:text-gray-600 underline"
      >
        Reset
      </button>
    </div>
  )
}
