import { useState, useCallback } from 'react'
import { getVideoInfo } from '@/api/client'
import type { VideoInfo } from '@/api/types'

export function useVideoInfo() {
  const [info, setInfo] = useState<VideoInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async (url: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getVideoInfo(url)
      setInfo(data)
    } catch (e) {
      setError(String(e))
      setInfo(null)
    } finally {
      setLoading(false)
    }
  }, [])

  return { info, loading, error, fetch }
}
