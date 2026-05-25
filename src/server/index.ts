import express from 'express'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { getVideoInfo, downloadAudio, YTDLP, FFMPEG } from '../core/downloader'

const app = express()
app.use(express.json())

app.use(express.static(path.join(__dirname, '../../client/dist')))

const activeJobs = new Map<string, AbortController>()
type CompletedFileEntry = {
  filePath: string
  createdAtMs: number
  expiresAtMs: number
}

const COMPLETED_FILE_TTL_MS = 10 * 60 * 1000
const completedFiles = new Map<string, CompletedFileEntry>()

function clearCompletedFile(jobId: string): void {
  const entry = completedFiles.get(jobId)
  if (!entry) return
  completedFiles.delete(jobId)
  try {
    fs.unlinkSync(entry.filePath)
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException
    if (err.code !== 'ENOENT') {
      console.warn(`Failed to delete completed file for job ${jobId}: ${err.message}`)
    }
  }
}

const staleCleanupTimer = setInterval(() => {
  const now = Date.now()
  for (const [jobId, entry] of completedFiles) {
    if (entry.expiresAtMs <= now) {
      clearCompletedFile(jobId)
    }
  }
}, 60_000)
staleCleanupTimer.unref()

app.get('/api/info', async (req, res) => {
  const url = req.query.url as string
  if (!url) return res.status(400).json({ error: 'url is required' })
  try {
    const info = await getVideoInfo(url)
    res.json(info)
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

app.get('/api/tools/status', async (_req, res) => {
  const { execFile } = await import('child_process')
  const { promisify } = await import('util')
  const execFileAsync = promisify(execFile)

  const [ytdlp, ffmpeg] = await Promise.all([
    execFileAsync(YTDLP, ['--version'])
      .then(({ stdout }) => ({ version: stdout.trim(), error: null }))
      .catch((e: Error) => ({ version: null, error: e.message })),
    execFileAsync(FFMPEG, ['-version'])
      .then(({ stdout }) => ({
        version: stdout.split('\n')[0].match(/version (\S+)/)?.[1] ?? 'unknown',
        error: null,
      }))
      .catch((e: Error) => ({ version: null, error: e.message })),
  ])

  res.json({ ytdlp, ffmpeg })
})

app.post('/api/download', async (req, res) => {
  const { url, format, resolution, start, end, jobId, bitrate, duration } = req.body
  if (!url || !format || !jobId) {
    return res.status(400).json({ error: 'url, format, and jobId are required' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.flushHeaders()

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  const controller = new AbortController()
  activeJobs.set(jobId, controller)

  try {
    const outPath = await downloadAudio(
      { url, format, resolution, start, end, outputDir: os.tmpdir(), bitrate, duration },
      (percent, stage) => { send({ jobId, percent, stage, message: `${stage} ${percent}%` }) },
      controller.signal,
    )
    completedFiles.set(jobId, {
      filePath: outPath,
      createdAtMs: Date.now(),
      expiresAtMs: Date.now() + COMPLETED_FILE_TTL_MS,
    })
    send({ jobId, percent: 100, stage: 'complete', message: 'Done', outputPath: path.basename(outPath) })
  } catch (e: unknown) {
    const err = e as { name?: string }
    if (err.name === 'AbortError') {
      send({ jobId, percent: 0, stage: 'cancelled', message: 'Download cancelled' })
    } else {
      send({ jobId, percent: 0, stage: 'error', message: String(e) })
    }
  } finally {
    activeJobs.delete(jobId)
    res.end()
  }
})

app.get('/api/download/file/:jobId', (req, res) => {
  const { jobId } = req.params
  const entry = completedFiles.get(jobId)
  if (!entry) return res.status(404).json({ error: 'File not found or already downloaded' })
  const filePath = entry.filePath

  const filename = path.basename(filePath)
  const encodedFilename = encodeURIComponent(filename)
  res.setHeader('Content-Disposition', `attachment; filename="${filename.replace(/[^\x20-\x7E]/g, '_')}"; filename*=UTF-8''${encodedFilename}`)
  res.setHeader('Content-Type', 'application/octet-stream')

  const stream = fs.createReadStream(filePath)
  stream.pipe(res)
  stream.on('end', () => {
    clearCompletedFile(jobId)
  })
  stream.on('error', () => {
    clearCompletedFile(jobId)
    if (!res.headersSent) {
      res.status(500).end()
      return
    }
    res.end()
  })
  res.on('close', () => {
    if (!res.writableEnded) {
      clearCompletedFile(jobId)
    }
  })
})

app.post('/api/cancel', (req, res) => {
  const { jobId } = req.body
  if (!jobId) return res.status(400).json({ error: 'jobId is required' })
  const controller = activeJobs.get(jobId)
  if (controller) {
    controller.abort()
    activeJobs.delete(jobId)
  }
  res.json({ ok: true })
})

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'))
})

const PORT = Number(process.env.PORT ?? 3001)
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})

export { app }
