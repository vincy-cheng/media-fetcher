import { useState, useCallback, useEffect } from 'react'
import { downloadAudio, onDownloadProgress, onDownloadComplete } from '@/api/client'
import type { DownloadOptions, JobProgress } from '@/api/types'

export interface Job {
  id: string
  url: string
  format: string
  progress: JobProgress
  outputPath?: string
}

export function useDownloadJob() {
  const [jobs, setJobs] = useState<Job[]>([])
  useEffect(() => {
    let unlistenProgress: (() => void) | undefined
    let unlistenComplete: (() => void) | undefined

    onDownloadProgress((progress) => {
      setJobs((prev) =>
        prev.map((j) =>
          j.progress.stage !== 'complete' ? { ...j, progress } : j
        )
      )
    }).then((fn) => { unlistenProgress = fn })

    onDownloadComplete((outputPath) => {
      setJobs((prev) =>
        prev.map((j) =>
          j.progress.stage !== 'complete'
            ? { ...j, outputPath, progress: { percent: 100, stage: 'complete', message: `Saved: ${outputPath}` } }
            : j
        )
      )
    }).then((fn) => { unlistenComplete = fn })

    return () => {
      unlistenProgress?.()
      unlistenComplete?.()
    }
  }, [])

  const start = useCallback(async (options: DownloadOptions) => {
    const id = crypto.randomUUID()
    const newJob: Job = {
      id,
      url: options.url,
      format: options.format,
      progress: { percent: 0, stage: 'downloading', message: 'Starting…' },
    }
    setJobs((prev) => [...prev, newJob])
    try {
      await downloadAudio(options)
    } catch (e) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === id
            ? { ...j, progress: { percent: 0, stage: 'error', message: String(e) } }
            : j
        )
      )
    }
  }, [])

  const clear = useCallback(() => {
    setJobs([])
  }, [])

  return { jobs, start, clear }
}
