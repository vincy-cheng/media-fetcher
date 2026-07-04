import { useEffect, useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons'
import { getHistoryByType } from '@/utils/history'
import type { HistoryType, HistoryRecord } from '@/utils/history'

interface RecentHistoryProps {
  type: HistoryType
  limit?: number
}

const STAGE_COLORS: Record<string, string> = {
  complete: 'bg-emerald-500',
  error: 'bg-red-500',
  cancelled: 'bg-gray-400',
}

export function RecentHistory({ type, limit = 5 }: RecentHistoryProps) {
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const refresh = () => setRecords(getHistoryByType(type).slice(0, limit))
    refresh()
    document.addEventListener('visibilitychange', refresh)
    return () => document.removeEventListener('visibilitychange', refresh)
  }, [type, limit])

  if (records.length === 0) return null

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
        >
          {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
          Recent History ({records.length})
        </button>
      </div>
      {open && (
        <div className="mt-2 flex flex-col gap-2">
          {records.map((r) => (
            <div key={`${r.id}-${r.timestamp}`} className="rounded-lg border border-primary-200 bg-primary-50 p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-gray-600 dark:text-gray-400">{r.url}</span>
                <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{new Date(r.timestamp).toLocaleString()}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ${STAGE_COLORS[r.stage] ?? 'bg-gray-400'}`}>
                  {r.stage}
                </span>
                {r.outputPath && <span className="ml-auto truncate text-xs font-medium text-emerald-600 dark:text-emerald-400">{r.outputPath}</span>}
              </div>
              {r.message && <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{r.message}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
