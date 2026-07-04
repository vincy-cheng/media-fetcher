import { useEffect, useState } from 'react'
import { getHistory, clearHistory } from '@/utils/history'
import type { HistoryRecord, HistoryType } from '@/utils/history'
import { useAppShell } from '@/providers/AppShellProvider'

interface HistoryPageProps {
  type?: HistoryType
}

export function HistoryPage({ type }: HistoryPageProps) {
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const { activeTab } = useAppShell()

  useEffect(() => {
    const all = getHistory()
    const filtered = type ? all.filter(r => r.type === type) : all
    setRecords(filtered)
  }, [type])

  const handleClear = () => {
    clearHistory()
    setRecords([])
  }

  const tabId = type ? `history-${type}` : 'history-all'
  const hidden = activeTab !== 'history'

  if (records.length === 0) return (
    <div id={tabId} aria-labelledby="tab-history" hidden={hidden} className="mt-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{type ? type.charAt(0).toUpperCase() + type.slice(1) : 'All'} History</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No history yet.</p>
    </div>
  )

  return (
    <div id={tabId} aria-labelledby="tab-history" hidden={hidden} className="mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{type ? type.charAt(0).toUpperCase() + type.slice(1) : 'All'} History</h3>
        <button onClick={handleClear} className="text-sm text-gray-500 underline hover:text-gray-700 dark:hover:text-gray-300">Clear</button>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {records.map((r) => (
          <div key={`${r.type}-${r.id}-${r.timestamp}`} className="rounded-lg border border-primary-200 bg-primary-50 p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{r.url}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(r.timestamp).toLocaleString()}</div>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700">{r.type}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{r.stage}</div>
              {r.outputPath && <div className="ml-auto text-xs font-medium text-emerald-600 dark:text-emerald-400">{r.outputPath}</div>}
            </div>
            {r.message && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">{r.message}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
