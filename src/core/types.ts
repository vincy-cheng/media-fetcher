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

export interface DownloadOptions {
  url: string
  format: Format
  resolution?: VideoResolution
  start?: number
  end?: number
  outputDir: string
}

export interface JobProgress {
  percent: number
  stage: 'downloading' | 'converting' | 'complete' | 'error'
  message: string
}
