// client/src/api/types.ts

export interface VideoInfo {
  id: string
  title: string
  duration: number
  thumbnail: string
  uploader: string
  url: string
}

export type Format = 'mp3' | 'm4a' | 'wav' | 'ogg' | 'flac' | 'mp4' | 'webm'

export type VideoResolution = '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p'

export function isVideoFormat(f: Format): boolean {
  return f === 'mp4' || f === 'webm'
}

export type Bitrate = 128 | 192 | 256 | 320

export interface DownloadOptions {
  url: string
  format: Format
  resolution?: VideoResolution
  start?: number
  end?: number
  outputDir: string
  bitrate?: Bitrate
  /** UUID matching the job_id passed to the Rust download_media command. */
  jobId: string
  /** Video duration in seconds, used for the backend hard-ceiling check. */
  duration?: number
}

export interface JobProgress {
  /** Matches job_id from the Rust event payload. */
  jobId: string
  percent: number
  stage: 'downloading' | 'converting' | 'complete' | 'error' | 'cancelled' | 'cancelling'
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
  defaultFormat: Format
  defaultResolution: VideoResolution
  defaultOutputDir: string
  defaultBitrate: Bitrate
  autoOpenPreview: boolean
  /** User-configured max duration in seconds. null = use the 3-hour absolute ceiling. */
  maxDurationSeconds: number | null
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

/** Absolute max duration in seconds (3 hours). Mirrors the Rust constant. */
export const ABSOLUTE_MAX_DURATION_SECONDS = 10_800
