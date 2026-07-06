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
  const raw = loadRaw()
  // Deduplicate by id on read (cleans up any pre-fix duplicates in localStorage)
  const seen = new Set<string>()
  const deduped = raw.filter(r => seen.has(r.id) ? false : (seen.add(r.id), true))
  return deduped.sort((a, b) => b.timestamp - a.timestamp)
}

export function addHistoryRecord(rec: HistoryRecord) {
  const prev = loadRaw()
  // Each job id is a UUID — one record per id is enough
  if (prev.some(r => r.id === rec.id)) return
  prev.unshift(rec)
  saveRaw(prev)
}

export function getHistoryByType(type: HistoryType): HistoryRecord[] {
  return getHistory().filter(r => r.type === type)
}

export function clearHistory() {
  try {
    localStorage.removeItem(KEY)
  } catch (e) {
    console.error('Failed to clear download history', e)
  }
}
