import { useState, useEffect, useCallback } from 'react'
import { getSettings, saveSettings } from '@/api/client'
import type { AppSettings, DownloadPreferences } from '@/api/types'

const DEFAULT_PREFERENCES: DownloadPreferences = {
  defaultFormat: 'm4a',
  defaultOutputDir: '',
  defaultBitrate: 192,
  maxDurationSeconds: null,
}

const DEFAULT_SETTINGS: AppSettings = {
  cookieConfig: { mode: 'none' },
  downloadPreferences: DEFAULT_PREFERENCES,
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getSettings()
      .then((s) => {
        setSettings(s)
        setLoaded(true)
      })
      .catch(() => {
        // fall back to defaults silently
        setLoaded(true)
      })
  }, [])

  const save = useCallback(async (updated: AppSettings): Promise<void> => {
    await saveSettings(updated)
    setSettings(updated)
  }, [])

  return { settings, loaded, save }
}
