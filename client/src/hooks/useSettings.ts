import { useState, useEffect, useCallback } from 'react'
import { getSettings, saveSettings } from '@/api/client'
import type { AppSettings, DownloadPreferences } from '@/api/types'

const DEFAULT_PREFERENCES: DownloadPreferences = {
  defaultFormat: 'm4a',
  defaultResolution: '1080p',
  defaultOutputDir: '',
  defaultBitrate: 192,
  autoOpenPreview: false,
  maxDurationSeconds: null,
}

const DEFAULT_SETTINGS: AppSettings = {
  cookieConfig: { mode: 'none' },
  downloadPreferences: DEFAULT_PREFERENCES,
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  const normalizeSettings = useCallback((s: AppSettings): AppSettings => {
    return {
      ...DEFAULT_SETTINGS,
      ...s,
      cookieConfig: { ...DEFAULT_SETTINGS.cookieConfig, ...s.cookieConfig },
      downloadPreferences: {
        ...DEFAULT_PREFERENCES,
        ...s.downloadPreferences,
      },
    }
  }, [])

  useEffect(() => {
    getSettings()
      .then((s) => {
        setSettings(normalizeSettings(s))
        setLoaded(true)
      })
      .catch(() => {
        // fall back to defaults silently
        setLoaded(true)
      })
  }, [normalizeSettings])

  const save = useCallback(async (updated: AppSettings): Promise<void> => {
    const normalized = normalizeSettings(updated)
    await saveSettings(normalized)
    setSettings(normalized)
  }, [normalizeSettings])

  return { settings, loaded, save }
}
