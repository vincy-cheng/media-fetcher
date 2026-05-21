// Shared types matching Rust structs in src-tauri/src/utils/types.rs

export interface VideoInfo {
  id: string
  title: string
  duration: number
  thumbnail: string
  uploader: string
  url: string
}

export interface DownloadOptions {
  url: string
  format: AudioFormat
  start?: number
  end?: number
  outputDir: string
}

export interface JobProgress {
  percent: number
  stage: 'downloading' | 'converting' | 'complete' | 'error'
  message: string
}

export type AudioFormat = 'mp3' | 'm4a' | 'wav' | 'ogg' | 'flac'
