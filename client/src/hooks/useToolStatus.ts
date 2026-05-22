import { useState, useEffect, useCallback } from 'react'
import {
  checkToolsStatus,
  checkYtdlpUpdate,
  updateYtdlp,
  onUpdateProgress,
} from '@/api/client'
import type { ToolsStatus, UpdateProgress } from '@/api/types'

export interface ToolStatusState {
  status: ToolsStatus | null
  checking: boolean
  /** True when any binary has an error */
  hasError: boolean
  /** Latest yt-dlp version string from GitHub, null until checked */
  latestVersion: string | null
  /** True when an update is available (latestVersion > current version) */
  updateAvailable: boolean
  checkingUpdate: boolean
  updating: boolean
  updateProgress: UpdateProgress | null
  updateError: string | null
  recheck: () => void
  checkForUpdate: () => Promise<void>
  startUpdate: () => Promise<void>
}

export function useToolStatus(): ToolStatusState {
  const [status, setStatus] = useState<ToolsStatus | null>(null)
  const [checking, setChecking] = useState(false)
  const [latestVersion, setLatestVersion] = useState<string | null>(null)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [updateProgress, setUpdateProgress] = useState<UpdateProgress | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const runCheck = useCallback(async () => {
    setChecking(true)
    try {
      const result = await checkToolsStatus()
      setStatus(result)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setStatus({
        ytdlp: { version: null, error: msg },
        ffmpeg: { version: null, error: msg },
      })
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => { runCheck() }, [runCheck])

  const checkForUpdate = useCallback(async () => {
    setCheckingUpdate(true)
    try {
      const tag = await checkYtdlpUpdate()
      setLatestVersion(tag)
    } catch (e) {
      setUpdateError(e instanceof Error ? e.message : String(e))
    } finally {
      setCheckingUpdate(false)
    }
  }, [])

  const startUpdate = useCallback(async () => {
    setUpdating(true)
    setUpdateError(null)
    setUpdateProgress({ percent: 0, stage: 'connecting', message: 'Starting…' })

    const unlisten = await onUpdateProgress((progress) => {
      setUpdateProgress(progress)
      if (progress.stage === 'error') {
        setUpdateError(progress.message)
      }
    })

    try {
      await updateYtdlp()
      await runCheck()
      setLatestVersion(null)
    } catch (e) {
      setUpdateError(e instanceof Error ? e.message : String(e))
    } finally {
      unlisten()
      setUpdating(false)
    }
  }, [runCheck])

  const hasError = Boolean(status && (status.ytdlp.error || status.ffmpeg.error))

  const updateAvailable = Boolean(
    latestVersion &&
    status?.ytdlp.version &&
    latestVersion > status.ytdlp.version
  )

  return {
    status,
    checking,
    hasError,
    latestVersion,
    updateAvailable,
    checkingUpdate,
    updating,
    updateProgress,
    updateError,
    recheck: runCheck,
    checkForUpdate,
    startUpdate,
  }
}
