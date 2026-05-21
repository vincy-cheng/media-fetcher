import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import type { VideoInfo, DownloadOptions, JobProgress, AppSettings } from './types'

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  return invoke<VideoInfo>('get_video_info', { url })
}

export async function extractPreviewAudio(url: string): Promise<string> {
  return invoke<string>('extract_preview_audio', { url })
}

export async function downloadAudio(options: DownloadOptions): Promise<string> {
  return invoke<string>('download_audio', {
    url: options.url,
    format: options.format,
    start: options.start ?? null,
    end: options.end ?? null,
    outputDir: options.outputDir,
    bitrate: options.bitrate ?? null,
  })
}

export function onDownloadProgress(cb: (progress: JobProgress) => void): Promise<UnlistenFn> {
  return listen<JobProgress>('download-progress', (e) => cb(e.payload))
}

export function onDownloadComplete(cb: (outputPath: string) => void): Promise<UnlistenFn> {
  return listen<string>('download-complete', (e) => cb(e.payload))
}

export async function getSettings(): Promise<AppSettings> {
  return invoke<AppSettings>('get_settings')
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  return invoke<void>('save_settings', { settings })
}
