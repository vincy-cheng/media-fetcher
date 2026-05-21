import { useState, useCallback, useRef } from 'react'
import { readFile } from '@tauri-apps/plugin-fs'
import { extractPreviewAudio } from '@/api/client'

export function usePreview() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const blobUrlRef = useRef<string | null>(null)

  const load = useCallback(async (url: string) => {
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
      const bytes = await readFile(tempPath)
      const blob = new Blob([bytes], { type: 'audio/webm' })
      const blobUrl = URL.createObjectURL(blob)
      blobUrlRef.current = blobUrl
      setAudioUrl(blobUrl)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  return { audioUrl, loading, error, load }
}
