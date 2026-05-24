import { useState, useCallback, useRef } from 'react'
import { readFile } from '@tauri-apps/plugin-fs'
import { extractPreviewAudio, capabilities } from '@/api/client'

export function usePreview() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const cancelledRef = useRef(false)

  const load = useCallback(async (url: string) => {
    if (!capabilities.canPreview) return
    cancelledRef.current = false
    setLoading(true)
    setError(null)
    setAudioUrl(null)
    // Revoke previous blob URL to free memory
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
    try {
      const tempPath = await extractPreviewAudio(url)
      if (cancelledRef.current) return
      const bytes = await readFile(tempPath)
      if (cancelledRef.current) return
      const blob = new Blob([bytes], { type: 'audio/webm' })
      const blobUrl = URL.createObjectURL(blob)
      blobUrlRef.current = blobUrl
      setAudioUrl(blobUrl)
    } catch (e) {
      if (!cancelledRef.current) setError(String(e))
    } finally {
      if (!cancelledRef.current) setLoading(false)
    }
  }, [])

  const cancel = useCallback(() => {
    cancelledRef.current = true
    setLoading(false)
    setError(null)
  }, [])

  return { audioUrl, loading, error, load, cancel }
}
