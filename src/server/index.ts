import express from 'express'
import path from 'path'
import { getVideoInfo, downloadAudio } from '../core/downloader'

const app = express()
app.use(express.json())

// Serve built client in production
app.use(express.static(path.join(__dirname, '../../client/dist')))

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

app.post('/api/download', async (req, res) => {
  const { url, format, start, end, outputDir } = req.body
  if (!url || !format || !outputDir) {
    return res.status(400).json({ error: 'url, format, and outputDir are required' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.flushHeaders()

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  try {
    const out = await downloadAudio({ url, format, start, end, outputDir }, (percent, stage) => {
      send({ percent, stage, message: `${stage} ${percent}%` })
    })
    send({ percent: 100, stage: 'complete', message: `Saved: ${out}`, outputPath: out })
  } catch (e) {
    send({ percent: 0, stage: 'error', message: String(e) })
  } finally {
    res.end()
  }
})

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'))
})

const PORT = Number(process.env.PORT ?? 3001)
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})

export { app }
