// client/src/hooks/useDownloadJob.ts
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
    const unlistenPromises: [Promise<() => void>, Promise<() => void>] = [
      onDownloadProgress((progress) => {
        setJobs((prev) =>
          prev.map((j) => j.id === progress.jobId ? { ...j, progress } : j)
        )
      }),
      onDownloadComplete((payload) => {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === payload.jobId
              ? {
                  ...j,
                  outputPath: payload.outputPath,
                  progress: {
                    jobId: payload.jobId,
                    percent: 100,
                    stage: 'complete',
                    message: `Saved: ${payload.outputPath}`,
                  },
                }
              : j
          )
        )
      }),
    ]

    return () => {
      Promise.all(unlistenPromises).then((fns) => fns.forEach((fn) => fn()))
    }
  }, [])

  const start = useCallback(async (options: Omit<DownloadOptions, 'jobId'>) => {
    const id = crypto.randomUUID()
    const newJob: Job = {
      id,
      url: options.url,
      format: options.format,
      progress: { jobId: id, percent: 0, stage: 'downloading', message: 'Starting…' },
    }
    setJobs((prev) => [...prev, newJob])
    try {
      await downloadAudio({ ...options, jobId: id })
    } catch (e) {
      setJobs((prev) => {
        if (!prev.some((j) => j.id === id)) return prev
        return prev.map((j) =>
          j.id === id
            ? { ...j, progress: { jobId: id, percent: 0, stage: 'error', message: String(e) } }
            : j
        )
      })
    }
  }, [])

  const clear = useCallback(() => { setJobs([]) }, [])

  return { jobs, start, clear }
}
