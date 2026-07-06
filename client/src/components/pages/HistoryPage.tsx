import { useEffect, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import { getHistory, clearHistory } from '@/utils/history'
import type { HistoryRecord } from '@/utils/history'
import { useAppShell } from '@/providers/AppShellProvider'

const PAGE_SIZE = 10

export function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [page, setPage] = useState(1)
  const { activeTab } = useAppShell()

  useEffect(() => {
    if (activeTab === 'history') {
      setRecords(getHistory())
      setPage(1)
    }
  }, [activeTab])

  const handleClear = () => {
    clearHistory()
    setRecords([])
    setPage(1)
  }

  const hidden = activeTab !== 'history'
  const totalPages = Math.ceil(records.length / PAGE_SIZE)
  const start = (page - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  const pageRecords = records.slice(start, end)

  if (records.length === 0) return (
    <div id="tabpanel-history" aria-labelledby="tab-history" hidden={hidden} className="mt-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">History</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No history yet.</p>
    </div>
  )

  return (
    <div id="tabpanel-history" aria-labelledby="tab-history" hidden={hidden} className="mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">History</h3>
        <button onClick={handleClear} className="text-sm text-gray-500 underline hover:text-gray-700 dark:hover:text-gray-300">Clear</button>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {pageRecords.map((r) => (
          <div key={`${r.type}-${r.id}-${r.timestamp}`} className="rounded-lg border border-primary-200 bg-primary-50 p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{r.url}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(r.timestamp).toLocaleString()}</div>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700 font-medium">{r.type}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{r.stage}</div>
              {r.outputPath && <div className="ml-auto text-xs font-medium text-emerald-600 dark:text-emerald-400">{r.outputPath}</div>}
            </div>
            {r.message && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">{r.message}</p>}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 text-sm text-gray-600 disabled:text-gray-300 hover:text-gray-800 disabled:hover:text-gray-300 dark:text-gray-400 dark:disabled:text-gray-600 dark:hover:text-gray-200"
            aria-label="Previous page"
          >
            <ChevronLeftIcon /> Prev
          </button>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 text-sm text-gray-600 disabled:text-gray-300 hover:text-gray-800 disabled:hover:text-gray-300 dark:text-gray-400 dark:disabled:text-gray-600 dark:hover:text-gray-200"
            aria-label="Next page"
          >
            Next <ChevronRightIcon />
          </button>
        </div>
      )}
    </div>
  )
}
