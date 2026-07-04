import { useEffect, useState } from 'react'
import { getHistoryByType } from '@/utils/history'
import type { HistoryType, HistoryRecord } from '@/utils/history'

interface RecentHistoryProps {
  type: HistoryType
  limit?: number
}

export function RecentHistory({ type, limit = 5 }: RecentHistoryProps) {
  const [records, setRecords] = useState<HistoryRecord[]>([])

  useEffect(() => {
    setRecords(getHistoryByType(type).slice(0, limit))
  }, [type, limit])

  if (records.length === 0) return null

  return (
    <div className="mt-4 rounded-lg bg-white p-3 dark:bg-gray-800">
      <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Recent History</h3>
      <div className="mt-2 flex flex-col gap-1">
        {records.map((r) => (
          <div key={`${r.id}-${r.timestamp}`} className="text-xs text-gray-600 dark:text-gray-400">
            <div className="truncate text-gray-700 dark:text-gray-300">{r.url.replace(/https?:\/\/(www\.)?/, '').split('/')[0]}</div>
            <div className="text-gray-500 dark:text-gray-500">{new Date(r.timestamp).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
