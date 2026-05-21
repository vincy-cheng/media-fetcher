import { useEffect, useRef } from 'react'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js'

interface AudioPreviewProps {
  audioUrl: string
  duration: number
  start: number
  end: number
  onTrimChange: (start: number, end: number) => void
}

export function AudioPreview({ audioUrl, start, end, onTrimChange }: AudioPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WaveSurfer | null>(null)
  const regionsRef = useRef<RegionsPlugin | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const regions = RegionsPlugin.create()
    regionsRef.current = regions

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#6366f1',
      progressColor: '#4f46e5',
      height: 80,
      plugins: [regions],
    })
    wsRef.current = ws

    ws.load(audioUrl)

    ws.on('ready', () => {
      const dur = ws.getDuration()
      const regionEnd = end > 0 ? Math.min(end, dur) : dur
      regions.addRegion({
        start: start,
        end: regionEnd,
        color: 'rgba(99, 102, 241, 0.2)',
        drag: true,
        resize: true,
      })
    })

    regions.on('region-updated', (region) => {
      onTrimChange(region.start, region.end)
    })

    return () => {
      ws.destroy()
    }
  }, [audioUrl])

  // Sync region when start/end props change externally (from TrimControls)
  useEffect(() => {
    const regionsList = regionsRef.current?.getRegions()
    if (regionsList && regionsList.length > 0) {
      const region = regionsList[0]
      if (Math.abs(region.start - start) > 0.5 || Math.abs(region.end - end) > 0.5) {
        region.setOptions({ start, end })
      }
    }
  }, [start, end])

  const handlePlayPause = () => wsRef.current?.playPause()

  return (
    <div className="flex flex-col gap-2">
      <div ref={containerRef} className="rounded-md border border-gray-200 bg-gray-50 p-2" />
      <button
        type="button"
        onClick={handlePlayPause}
        className="self-start rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700"
      >
        ▶ / ⏸
      </button>
    </div>
  )
}
