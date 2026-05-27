// client/src/api/TauriApiClient.ts
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
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

export class TauriApiClient implements IApiClient {
  capabilities: Capabilities = {
    canUpdate: true,
    canPreview: true,
    canBrowseFolder: true,
  }

  async getVideoInfo(url: string): Promise<VideoInfo> {
    return invoke<VideoInfo>('get_video_info', { url })
  }

  async extractPreviewAudio(url: string): Promise<string> {
    return invoke<string>('extract_preview_audio', { url })
  }

  async downloadMedia(options: DownloadOptions): Promise<string> {
    return invoke<string>('download_media', {
      jobId: options.jobId,
      url: options.url,
      format: options.format,
      resolution: options.resolution ?? null,
      start: options.start ?? null,
      end: options.end ?? null,
      outputDir: options.outputDir,
      outputFilename: options.outputFilename ?? null,
      bitrate: options.bitrate ?? null,
      duration: options.duration ?? null,
    })
  }

  async cancelDownload(jobId: string): Promise<void> {
    return invoke<void>('cancel_download', { jobId })
  }

  onDownloadProgress(cb: (p: JobProgress) => void): Promise<UnlistenFn> {
    return listen<JobProgress>('download-progress', (e) => cb(e.payload))
  }

  onDownloadComplete(cb: (p: DownloadCompletePayload) => void): Promise<UnlistenFn> {
    return listen<DownloadCompletePayload>('download-complete', (e) => cb(e.payload))
  }

  async getSettings(): Promise<AppSettings> {
    return invoke<AppSettings>('get_settings')
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    return invoke<void>('save_settings', { settings })
  }

  async checkToolsStatus(): Promise<ToolsStatus> {
    return invoke<ToolsStatus>('check_tools_status')
  }

  async checkYtdlpUpdate(): Promise<string> {
    return invoke<string>('check_ytdlp_update')
  }

  async updateYtdlp(): Promise<void> {
    return invoke<void>('update_ytdlp')
  }

  onUpdateProgress(cb: (p: UpdateProgress) => void): Promise<UnlistenFn> {
    return listen<UpdateProgress>('update_progress', (e) => cb(e.payload))
  }
}
