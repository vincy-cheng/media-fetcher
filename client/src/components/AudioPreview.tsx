import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js";
import { PlayIcon, PauseIcon } from "@radix-ui/react-icons";

interface AudioPreviewProps {
  audioUrl: string;
  duration: number;
  start: number;
  end: number;
  onTrimChange: (start: number, end: number) => void;
}

export function AudioPreview({
  audioUrl,
  start,
  end,
  onTrimChange,
}: AudioPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const regions = RegionsPlugin.create();
    regionsRef.current = regions;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#ffb220",      // primary-400
      progressColor: "#b74706",  // primary-700
      height: 80,
      plugins: [regions],
    });
    wsRef.current = ws;

    ws.load(audioUrl);

    ws.on("ready", () => {
      const dur = ws.getDuration();
      const regionEnd = end > 0 ? Math.min(end, dur) : dur;
      regions.addRegion({
        start: start,
        end: regionEnd,
        color: "rgba(99, 102, 241, 0.2)",
        drag: true,
        resize: true,
      });
    });

    ws.on("play", () => setPlaying(true));
    ws.on("pause", () => setPlaying(false));
    ws.on("finish", () => setPlaying(false));

    regions.on("region-updated", (region) => {
      onTrimChange(region.start, region.end);
    });

    return () => {
      ws.destroy();
    };
  }, [audioUrl]);

  // Sync region when start/end props change externally (from TrimControls)
  useEffect(() => {
    const regionsList = regionsRef.current?.getRegions();
    if (regionsList && regionsList.length > 0) {
      const region = regionsList[0];
      if (
        Math.abs(region.start - start) > 0.5 ||
        Math.abs(region.end - end) > 0.5
      ) {
        region.setOptions({ start, end });
      }
    }
  }, [start, end]);

  const handlePlayPause = () => wsRef.current?.playPause();

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={containerRef}
        className="rounded-md border border-primary-200 bg-primary-50 p-2 dark:border-gray-700 dark:bg-gray-900"
      />
      <button
        type="button"
        onClick={handlePlayPause}
        aria-label={playing ? "Pause" : "Play"}
        className="cursor-pointer self-start rounded bg-primary-300 px-3 py-1 text-sm text-white hover:bg-primary-400"
      >
        {playing ? (
          <PauseIcon className="inline" />
        ) : (
          <PlayIcon className="inline" />
        )}
      </button>
    </div>
  );
}
