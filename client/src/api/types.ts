// client/src/api/types.ts

export interface VideoInfo {
  id: string
  title: string
  duration: number
  thumbnail: string
  uploader: string
  url: string
}

export type AudioFormat = 'mp3' | 'm4a' | 'wav' | 'ogg' | 'flac'

export type Bitrate = 128 | 192 | 256 | 320

export interface DownloadOptions {
  url: string
  format: AudioFormat
  start?: number
  end?: number
  outputDir: string
  bitrate?: Bitrate
  /** UUID matching the job_id passed to the Rust download_audio command. */
  jobId: string
}

export interface JobProgress {
  /** Matches job_id from the Rust event payload. */
  jobId: string
  percent: number
  stage: 'downloading' | 'converting' | 'complete' | 'error'
  message: string
}

export interface DownloadCompletePayload {
  jobId: string
  outputPath: string
}

export interface CookieConfig {
  mode: 'none' | 'browser' | 'file'
  browser?: string
  filePath?: string
}

export interface DownloadPreferences {
  defaultFormat: AudioFormat
  defaultOutputDir: string
  defaultBitrate: Bitrate
}

export interface AppSettings {
  cookieConfig: CookieConfig
  downloadPreferences: DownloadPreferences
}

export interface ToolInfo {
  version: string | null
  error: string | null
}

export interface ToolsStatus {
  ytdlp: ToolInfo
  ffmpeg: ToolInfo
}

export interface UpdateProgress {
  percent: number
  stage: 'connecting' | 'downloading' | 'installing' | 'complete' | 'error'
  message: string
}
