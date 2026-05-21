import { execFile } from 'child_process'
import { promisify } from 'util'
import type { VideoInfo, DownloadOptions } from './types'

const execFileAsync = promisify(execFile)

const YTDLP = process.env.YTDLP_BIN ?? 'yt-dlp'
const FFMPEG = process.env.FFMPEG_BIN ?? 'ffmpeg'

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  const { stdout } = await execFileAsync(YTDLP, [
    '--dump-json', '--no-playlist', '--no-warnings', url,
  ])
  const data = JSON.parse(stdout)
  return {
    id: data.id,
    title: data.title,
    duration: data.duration,
    thumbnail: data.thumbnail,
    uploader: data.uploader,
    url,
  }
}

export async function downloadAudio(
  options: DownloadOptions,
  onProgress?: (pct: number, stage: string) => void,
): Promise<string> {
  const { url, format, start, end, outputDir } = options
  const os = await import('os')
  const path = await import('path')

  const tmpTemplate = path.join(os.tmpdir(), `ytdl_${Date.now()}.%(ext)s`)
  onProgress?.(0, 'downloading')

  await execFileAsync(YTDLP, [
    '-f', 'bestaudio',
    '--no-playlist',
    '--no-warnings',
    '-o', tmpTemplate,
    url,
  ])

  onProgress?.(50, 'converting')

  // Find actual downloaded file
  const fs = await import('fs')
  const prefix = `ytdl_${Date.now()}`
  const tmpFiles = fs.readdirSync(os.tmpdir()).filter(f => f.startsWith('ytdl_'))
  const rawFile = tmpFiles.length ? path.join(os.tmpdir(), tmpFiles[tmpFiles.length - 1]) : null
  if (!rawFile) throw new Error('Downloaded file not found')

  // Get title
  const { stdout: titleOut } = await execFileAsync(YTDLP, [
    '--get-title', '--no-playlist', '--no-warnings', url,
  ])
  const title = titleOut.trim().replace(/[^a-zA-Z0-9 \-_.]/g, '_')
  const outPath = path.join(outputDir, `${title}.${format}`)

  const ffmpegArgs: string[] = ['-y', '-i', rawFile]
  if (start !== undefined) ffmpegArgs.push('-ss', formatTime(start))
  if (end !== undefined) ffmpegArgs.push('-to', formatTime(end))

  const codecMap: Record<string, string[]> = {
    mp3: ['-acodec', 'libmp3lame', '-q:a', '2'],
    m4a: ['-acodec', 'aac'],
    wav: ['-acodec', 'pcm_s16le'],
    ogg: ['-acodec', 'libvorbis'],
    flac: ['-acodec', 'flac'],
  }
  ffmpegArgs.push(...(codecMap[format] ?? []), outPath)

  await execFileAsync(FFMPEG, ffmpegArgs)
  fs.unlinkSync(rawFile)

  onProgress?.(100, 'complete')
  return outPath
}

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
