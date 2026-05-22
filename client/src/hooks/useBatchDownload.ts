// client/src/hooks/useBatchDownload.ts
import { useState, useCallback, useEffect, useRef } from 'react'
import { getVideoInfo, downloadAudio, onDownloadProgress, onDownloadComplete } from '@/api/client'
import type { VideoInfo, AudioFormat, Bitrate, JobProgress } from '@/api/types'
import type { UnlistenFn } from '@tauri-apps/api/event'

export const MAX_BATCH_URLS = 20
export const MAX_CONCURRENT_DOWNLOADS = 3

export interface BatchItem {
  id: string
  url: string
  info?: VideoInfo
  infoLoading: boolean
  infoError?: string
  progress?: JobProgress
  outputPath?: string
}

export function useBatchDownload() {
  const [items, setItems] = useState<BatchItem[]>([])
  const [downloading, setDownloading] = useState(false)
  const itemsRef = useRef<BatchItem[]>([])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    let mounted = true
    let unlistenFns: UnlistenFn[] = []
    const partialFns: UnlistenFn[] = []

    Promise.all([
      onDownloadProgress((progress) => {
        setItems((prev) =>
          prev.map((item) =>
            item.id === progress.jobId ? { ...item, progress } : item
          )
        )
      }).then((fn) => {
        partialFns.push(fn)
        return fn
      }),
      onDownloadComplete((payload) => {
        setItems((prev) =>
          prev.map((item) =>
            item.id === payload.jobId
              ? {
                  ...item,
                  outputPath: payload.outputPath,
                  progress: {
                    jobId: payload.jobId,
                    percent: 100,
                    stage: 'complete',
                    message: `Saved: ${payload.outputPath}`,
                  },
                }
              : item
          )
        )
      }).then((fn) => {
        partialFns.push(fn)
        return fn
      }),
    ])
      .then((fns) => {
        if (mounted) {
          unlistenFns = fns
        } else {
          fns.forEach((fn) => fn())
        }
      })
      .catch(() => {
        partialFns.forEach((fn) => fn())
      })

    return () => {
      mounted = false
      unlistenFns.forEach((fn) => fn())
    }
  }, [])

  const fetchInfo = useCallback((id: string, url: string) => {
    getVideoInfo(url)
      .then((info) => {
        setItems((prev) =>
          prev.map((item) => item.id === id ? { ...item, info, infoLoading: false } : item)
        )
      })
      .catch((e) => {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, infoLoading: false, infoError: String(e) } : item
          )
        )
      })
  }, [])

  const addUrl = useCallback(
    (url: string) => {
      if (itemsRef.current.length >= MAX_BATCH_URLS) return
      const id = crypto.randomUUID()
      setItems((prev) => {
        if (prev.length >= MAX_BATCH_URLS) return prev
        return [...prev, { id, url, infoLoading: true }]
      })
      fetchInfo(id, url)
    },
    [fetchInfo]
  )

  const retryInfo = useCallback((id: string) => {
    const item = itemsRef.current.find((i) => i.id === id)
    if (!item) return
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, infoLoading: true, infoError: undefined } : i))
    )
    fetchInfo(id, item.url)
  }, [fetchInfo])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const downloadAll = useCallback(
    async (format: AudioFormat, bitrate: Bitrate, outputDir: string) => {
      setDownloading(true)
      try {
        const ready = items.filter((item) => item.info && !item.infoLoading && !item.infoError)
        await runWithConcurrency(
          ready.map((item) => () =>
            downloadAudio({
              jobId: item.id,
              url: item.url,
              format,
              bitrate,
              outputDir,
            })
          ),
          MAX_CONCURRENT_DOWNLOADS
        )
      } finally {
        setDownloading(false)
      }
    },
    [items]
  )

  const clearAll = useCallback(() => {
    setItems([])
  }, [])

  return { items, downloading, addUrl, retryInfo, removeItem, downloadAll, clearAll }
}

/**
 * Run an array of async tasks with at most `limit` running concurrently.
 * All tasks are attempted; individual failures do not stop others.
 */
async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length)
  let next = 0

  async function worker() {
    while (next < tasks.length) {
      const i = next++
      try {
        results[i] = { status: 'fulfilled', value: await tasks[i]() }
      } catch (reason) {
        results[i] = { status: 'rejected', reason }
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker))
  return results
}
