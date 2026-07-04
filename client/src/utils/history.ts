// client/src/utils/history.ts
import type { JobProgress } from '@/api/types'

export type HistoryType = 'single' | 'batch'

export type HistoryRecord = {
  id: string
  url: string
  type: HistoryType
  stage: JobProgress['stage']
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
  // Deduplicate: skip if same id, type, and stage already exist in last 10 records
  const isDupe = prev.slice(0, 10).some(r => r.id === rec.id && r.type === rec.type && r.stage === rec.stage)
  if (isDupe) return
  prev.unshift(rec)
  saveRaw(prev)
}

export function getHistoryByType(type: HistoryType): HistoryRecord[] {
  return loadRaw().filter(r => r.type === type)
}

export function clearHistory() {
  try {
    localStorage.removeItem(KEY)
  } catch (e) {
    console.error('Failed to clear download history', e)
  }
}
