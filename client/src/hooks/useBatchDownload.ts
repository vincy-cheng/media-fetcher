// client/src/hooks/useBatchDownload.ts
import { useState, useCallback, useEffect, useRef } from 'react'
import { getVideoInfo, downloadAudio, cancelDownload, onDownloadProgress, onDownloadComplete } from '@/api/client'
import type { VideoInfo, AudioFormat, Bitrate, JobProgress } from '@/api/types'
import { ABSOLUTE_MAX_DURATION_SECONDS } from '@/api/types'
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

/** Stages that mean a download is already running or finished successfully — exclude from Download All */
const NON_RETRIABLE_STAGES = new Set(['complete', 'downloading', 'converting', 'cancelling'])

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

  const cancelItem = useCallback(async (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id &&
        item.progress &&
        (item.progress.stage === 'downloading' || item.progress.stage === 'converting')
          ? {
              ...item,
              progress: { ...item.progress, stage: 'cancelling', message: 'Cancelling…' },
            }
          : item
      )
    )
    await cancelDownload(id)
  }, [])

  const downloadAll = useCallback(
    async (format: AudioFormat, bitrate: Bitrate, outputDir: string, maxDurationSeconds: number | null) => {
      const effectiveMax = maxDurationSeconds ?? ABSOLUTE_MAX_DURATION_SECONDS
      setDownloading(true)
      try {
        const ready = items.filter(
          (item) =>
            item.info &&
            !item.infoLoading &&
            !item.infoError &&
            (!item.progress || !NON_RETRIABLE_STAGES.has(item.progress.stage))
        )

        // Mark items that exceed the duration limit with an error before starting
        const oversized = ready.filter((item) => (item.info?.duration ?? 0) > effectiveMax)
        if (oversized.length > 0) {
          setItems((prev) =>
            prev.map((item) =>
              oversized.some((o) => o.id === item.id)
                ? {
                    ...item,
                    progress: {
                      jobId: item.id,
                      percent: 0,
                      stage: 'error',
                      message: `Video duration exceeds the ${formatDuration(effectiveMax)} limit`,
                    },
                  }
                : item
            )
          )
        }

        const eligible = ready.filter((item) => (item.info?.duration ?? 0) <= effectiveMax)

        await runWithConcurrency(
          eligible.map((item) => () =>
            downloadAudio({
              jobId: item.id,
              url: item.url,
              format,
              bitrate,
              outputDir,
              duration: item.info?.duration,
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

  return { items, downloading, addUrl, retryInfo, removeItem, cancelItem, downloadAll, clearAll }
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
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
