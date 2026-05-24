// client/src/api/IApiClient.ts
import type {
  VideoInfo,
  DownloadOptions,
  JobProgress,
  DownloadCompletePayload,
  AppSettings,
  ToolsStatus,
  UpdateProgress,
} from './types'

export type UnlistenFn = () => void

export interface Capabilities {
  /** yt-dlp update — Tauri sidecar only */
  canUpdate: boolean
  /** Audio preview waveform — requires Tauri readFile */
  canPreview: boolean
  /** Native folder picker dialog — Tauri only */
  canBrowseFolder: boolean
}

export interface IApiClient {
  capabilities: Capabilities

  // Available in both modes
  getVideoInfo(url: string): Promise<VideoInfo>
  downloadMedia(options: DownloadOptions): Promise<string>
  cancelDownload(jobId: string): Promise<void>
  onDownloadProgress(cb: (p: JobProgress) => void): Promise<UnlistenFn>
  onDownloadComplete(cb: (p: DownloadCompletePayload) => void): Promise<UnlistenFn>
  getSettings(): Promise<AppSettings>
  saveSettings(settings: AppSettings): Promise<void>
  checkToolsStatus(): Promise<ToolsStatus>

  // Tauri only — WebApiClient throws descriptive error; guarded by capabilities in UI
  extractPreviewAudio(url: string): Promise<string>
  checkYtdlpUpdate(): Promise<string>
  updateYtdlp(): Promise<void>
  onUpdateProgress(cb: (p: UpdateProgress) => void): Promise<UnlistenFn>
}
