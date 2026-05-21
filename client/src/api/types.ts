// Shared types matching Rust structs in src-tauri/src/utils/types.rs

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
}

export interface JobProgress {
  percent: number
  stage: 'downloading' | 'converting' | 'complete' | 'error'
  message: string
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
