import { useEffect, useState } from 'react'
import { getHistory, clearHistory, HistoryRecord } from '@/utils/history'

export function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([])

  useEffect(() => {
    setRecords(getHistory())
  }, [])

  const handleClear = () => {
    clearHistory()
    setRecords([])
  }

  if (records.length === 0) return (
    <div id="tabpanel-history" aria-labelledby="tab-history" className="mt-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">History</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No history yet.</p>
    </div>
  )

  return (
    <div id="tabpanel-history" aria-labelledby="tab-history" className="mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">History</h3>
        <button onClick={handleClear} className="text-sm text-gray-500 underline">Clear</button>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {records.map((r) => (
          <div key={`${r.type}-${r.id}-${r.timestamp}`} className="rounded-lg border border-primary-200 bg-primary-50 p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{r.url}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(r.timestamp).toLocaleString()}</div>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="rounded-full bg-gray-200 px-2 py-0.5 text-xs">{r.type}</div>
              <div className="text-xs text-gray-500">{r.stage}</div>
              {r.outputPath && <div className="ml-auto text-xs font-medium text-emerald-600">{r.outputPath}</div>}
            </div>
            {r.message && <p className="mt-1 text-xs text-gray-500 truncate">{r.message}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
