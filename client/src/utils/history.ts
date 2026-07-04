// client/src/utils/history.ts
export type HistoryType = 'single' | 'batch'

export interface HistoryRecord {
  id: string
  url: string
  type: HistoryType
  stage: string
  message?: string
  percent?: number
  outputPath?: string
  timestamp: number
}

const KEY = 'downloadHistory_v1'
const MAX_RECORDS = 1000

function loadRaw(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw) as HistoryRecord[]
  } catch (e) {
    console.error('Failed to read download history', e)
    return []
  }
}

function saveRaw(records: HistoryRecord[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(records.slice(0, MAX_RECORDS)))
  } catch (e) {
    console.error('Failed to save download history', e)
  }
}

export function getHistory(): HistoryRecord[] {
  return loadRaw()
}

export function addHistoryRecord(rec: HistoryRecord) {
  const prev = loadRaw()
  prev.unshift(rec)
  saveRaw(prev)
}

export function clearHistory() {
  try {
    localStorage.removeItem(KEY)
  } catch (e) {
    console.error('Failed to clear download history', e)
  }
}
