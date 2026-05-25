import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'
import type { VideoInfo, DownloadOptions } from './types'
import { isVideoFormat } from './types'

const execFileAsync = promisify(execFile)
const ABSOLUTE_MAX_DURATION_SECONDS = 10_800

function resolveBin(envVar: string, name: string): string {
  if (process.env[envVar]) return process.env[envVar]!
  const archMap: Record<string, string> = { arm64: 'aarch64', x64: 'x86_64' }
  const platformMap: Record<string, string> = {
    darwin: 'apple-darwin',
    linux: 'unknown-linux-gnu',
    win32: 'pc-windows-msvc',
  }
  const arch = archMap[process.arch] ?? process.arch
  const platform = platformMap[process.platform] ?? process.platform
  const sidecar = path.resolve(__dirname, '../../src-tauri/binaries', `${name}-${arch}-${platform}`)
  return fs.existsSync(sidecar) ? sidecar : name
}

export const YTDLP = resolveBin('YTDLP_BIN', 'yt-dlp')
export const FFMPEG = resolveBin('FFMPEG_BIN', 'ffmpeg')

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
  signal?: AbortSignal,
): Promise<string> {
  const { url, format, resolution, start, end, outputDir, bitrate, duration } = options
  const os = await import('os')

  if (typeof duration === 'number' && duration > 0 && duration > ABSOLUTE_MAX_DURATION_SECONDS) {
    throw new Error(
      `Video duration (${formatTime(duration)}) exceeds the maximum allowed length of 3 hours`,
    )
  }

  const tempPrefix = `ytdl_dl_${Date.now()}_${randomUUID()}`
  const tmpTemplate = path.join(os.tmpdir(), `${tempPrefix}.%(ext)s`)
  onProgress?.(0, 'downloading')

  const ytFormat = isVideoFormat(format)
    ? (() => {
        const height = parseInt((resolution ?? '1080p').replace('p', ''), 10)
        return `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`
      })()
    : 'bestaudio'

  await execFileAsync(YTDLP, [
    '-f', ytFormat,
    '--no-playlist',
    '--no-warnings',
    '-o', tmpTemplate,
    url,
  ], { signal })

  onProgress?.(50, 'converting')

  const rawFile = findDownloadedTempFile(os.tmpdir(), tempPrefix)

  // Get title
  const { stdout: titleOut } = await execFileAsync(YTDLP, [
    '--get-title', '--no-playlist', '--no-warnings', url,
  ], { signal })
  const title = titleOut.trim().replace(/[^\p{L}\p{N} \-_.]/gu, '_')
  const outPath = path.join(outputDir, `${title}.${format}`)

  const ffmpegArgs: string[] = ['-y', '-i', rawFile]
  if (start !== undefined) ffmpegArgs.push('-ss', formatTime(start))
  if (end !== undefined) ffmpegArgs.push('-to', formatTime(end))

  if (isVideoFormat(format)) {
    if (format === 'mp4') {
      ffmpegArgs.push('-c:v', 'libx264', '-c:a', 'aac', '-movflags', '+faststart')
    } else {
      // webm
      ffmpegArgs.push('-c:v', 'libvpx-vp9', '-c:a', 'libopus')
    }
  } else {
    const lossyBitrate = bitrate ?? 192
    const codecMap: Record<string, string[]> = {
      mp3: ['-acodec', 'libmp3lame', '-b:a', `${lossyBitrate}k`],
      m4a: ['-acodec', 'aac', '-b:a', `${lossyBitrate}k`],
      wav: ['-acodec', 'pcm_s16le'],
      ogg: ['-acodec', 'libvorbis', '-b:a', `${lossyBitrate}k`],
      flac: ['-acodec', 'flac'],
    }
    ffmpegArgs.push(...(codecMap[format] ?? []))
  }
  ffmpegArgs.push(outPath)

  let ffmpegFailed = false
  try {
    await execFileAsync(FFMPEG, ffmpegArgs, { signal })
    onProgress?.(100, 'complete')
    return outPath
  } catch (error) {
    ffmpegFailed = true
    throw error
  } finally {
    try {
      fs.unlinkSync(rawFile)
    } catch (cleanupError) {
      if (!ffmpegFailed) {
        throw cleanupError
      }
      console.error(`Failed to remove temporary file: ${rawFile}`, cleanupError)
    }
  }
}

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function findDownloadedTempFile(tmpDir: string, prefix: string): string {
  const matches = fs.readdirSync(tmpDir)
    .filter((name) => name.startsWith(prefix))
    .sort()
  if (matches.length === 0) {
    throw new Error('Downloaded file not found')
  }
  return path.join(tmpDir, matches[matches.length - 1]!)
}
