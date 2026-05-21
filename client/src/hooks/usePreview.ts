import { useState, useCallback, useRef } from 'react'
import { convertFileSrc } from '@tauri-apps/api/core'
import { extractPreviewAudio } from '@/api/client'

export function usePreview() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tempPathRef = useRef<string | null>(null)

  const load = useCallback(async (url: string) => {
    setLoading(true)
    setError(null)
    setAudioUrl(null)
    try {
      const tempPath = await extractPreviewAudio(url)
      tempPathRef.current = tempPath
      // convertFileSrc turns a local filesystem path into a safe WebView URL
      setAudioUrl(convertFileSrc(tempPath))
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  return { audioUrl, loading, error, load }
}
