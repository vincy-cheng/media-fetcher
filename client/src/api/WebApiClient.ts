// client/src/api/WebApiClient.ts
import type {
  VideoInfo,
  DownloadOptions,
  JobProgress,
  DownloadCompletePayload,
  AppSettings,
  ToolsStatus,
  UpdateProgress,
} from './types'
import type { IApiClient, Capabilities, UnlistenFn } from './IApiClient'

const SETTINGS_KEY = 'media-fetcher-settings'

const DEFAULT_SETTINGS: AppSettings = {
  cookieConfig: { mode: 'none' },
  downloadPreferences: {
    defaultFormat: 'm4a',
    defaultResolution: '1080p',
    defaultOutputDir: '',
    defaultBitrate: 192,
    maxDurationSeconds: null,
  },
}

export class WebApiClient implements IApiClient {
  capabilities: Capabilities = {
    canUpdate: false,
    canPreview: false,
    canBrowseFolder: false,
  }

  private bus = new EventTarget()

  async getVideoInfo(url: string): Promise<VideoInfo> {
    const res = await fetch(`/api/info?url=${encodeURIComponent(url)}`)
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error((body as { error?: string }).error ?? res.statusText)
    }
    return res.json() as Promise<VideoInfo>
  }

  async extractPreviewAudio(_url: string): Promise<string> { // eslint-disable-line @typescript-eslint/no-unused-vars
    throw new Error('Audio preview is not available in web mode')
  }

  async downloadMedia(options: DownloadOptions): Promise<string> {
    const jobId = options.jobId

    const res = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: options.url,
        format: options.format,
        resolution: options.resolution,
        start: options.start,
        end: options.end,
        jobId,
      }),
    })

    if (!res.ok || !res.body) {
      const body = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error((body as { error?: string }).error ?? res.statusText)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        let data: JobProgress & { outputPath?: string }
        try {
          data = JSON.parse(line.slice(6)) as JobProgress & { outputPath?: string }
        } catch {
          continue
        }

        if (data.stage === 'complete') {
          this.bus.dispatchEvent(
            new CustomEvent<DownloadCompletePayload>('download-complete', {
              detail: { jobId, outputPath: data.outputPath ?? jobId },
            }),
          )
          const a = document.createElement('a')
          a.href = `/api/download/file/${jobId}`
          a.click()
        } else {
          this.bus.dispatchEvent(
            new CustomEvent<JobProgress>('download-progress', {
              detail: { ...data, jobId } as JobProgress,
            }),
          )
        }
      }
    }

    return jobId
  }

  async cancelDownload(jobId: string): Promise<void> {
    await fetch('/api/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    })
  }

  onDownloadProgress(cb: (p: JobProgress) => void): Promise<UnlistenFn> {
    const handler = (e: Event) => cb((e as CustomEvent<JobProgress>).detail)
    this.bus.addEventListener('download-progress', handler)
    return Promise.resolve(() => this.bus.removeEventListener('download-progress', handler))
  }

  onDownloadComplete(cb: (p: DownloadCompletePayload) => void): Promise<UnlistenFn> {
    const handler = (e: Event) => cb((e as CustomEvent<DownloadCompletePayload>).detail)
    this.bus.addEventListener('download-complete', handler)
    return Promise.resolve(() => this.bus.removeEventListener('download-complete', handler))
  }

  async getSettings(): Promise<AppSettings> {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      return raw ? (JSON.parse(raw) as AppSettings) : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }

  async checkToolsStatus(): Promise<ToolsStatus> {
    const res = await fetch('/api/tools/status')
    if (!res.ok) throw new Error(res.statusText)
    return res.json() as Promise<ToolsStatus>
  }

  async checkYtdlpUpdate(): Promise<string> {
    throw new Error('yt-dlp update check is not available in web mode')
  }

  async updateYtdlp(): Promise<void> {
    throw new Error('yt-dlp update is not available in web mode')
  }

  onUpdateProgress(_cb: (p: UpdateProgress) => void): Promise<UnlistenFn> { // eslint-disable-line @typescript-eslint/no-unused-vars
    throw new Error('yt-dlp update progress is not available in web mode')
  }
}
