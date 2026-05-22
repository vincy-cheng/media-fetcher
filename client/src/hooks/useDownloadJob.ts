// client/src/hooks/useDownloadJob.ts
import { useState, useCallback, useEffect } from 'react'
import { downloadAudio, cancelDownload, onDownloadProgress, onDownloadComplete } from '@/api/client'
import type { DownloadOptions, JobProgress } from '@/api/types'

export interface Job {
  id: string
  url: string
  format: string
  progress: JobProgress
  outputPath?: string
}

const TERMINAL_STAGES = new Set(['complete', 'error', 'cancelled'])

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
      const msg = String(e)
      setJobs((prev) => {
        if (!prev.some((j) => j.id === id)) return prev
        return prev.map((j) => {
          if (j.id !== id) return j
          if (j.progress.stage === 'cancelled') return j
          return {
            ...j,
            progress: { jobId: id, percent: 0, stage: 'error', message: msg },
          }
        })
      })
    }
  }, [])

  const cancel = useCallback(async (jobId: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId && (j.progress.stage === 'downloading' || j.progress.stage === 'converting')
          ? { ...j, progress: { ...j.progress, stage: 'cancelling', message: 'Cancelling…' } }
          : j
      )
    )
    await cancelDownload(jobId)
  }, [])

  // Only clear terminal (completed/error/cancelled) jobs — keep active ones
  const clearHistory = useCallback(() => {
    setJobs((prev) => prev.filter((j) => !TERMINAL_STAGES.has(j.progress.stage)))
  }, [])

  const activeJobs = jobs.filter((j) => !TERMINAL_STAGES.has(j.progress.stage))
  const history = jobs.filter((j) => TERMINAL_STAGES.has(j.progress.stage))

  return { jobs: activeJobs, history, start, cancel, clear: clearHistory }
}
