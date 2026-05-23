import type { VideoResolution } from "@/api/types";

const RESOLUTIONS: VideoResolution[] = [
  "360p",
  "480p",
  "720p",
  "1080p",
  "1440p",
  "2160p",
];

interface ResolutionSelectorProps {
  value: VideoResolution;
  onChange: (resolution: VideoResolution) => void;
}

export function ResolutionSelector({
  value,
  onChange,
}: ResolutionSelectorProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Resolution
      </label>
      <span className="text-xs text-gray-400 dark:text-gray-500">
        The actual available resolutions may vary depending on the video.
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as VideoResolution)}
          className="w-full cursor-pointer appearance-none rounded-md border border-primary-200 bg-primary-50 pl-4 pr-10 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          {RESOLUTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg
            className="h-4 w-4 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 9l4-4 4 4M16 15l-4 4-4-4"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
