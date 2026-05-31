// client/src/components/TrimSection.tsx
import { TrimControls } from "@/components/TrimControls";
import { useVideoFetch } from "@/components/app/VideoFetchContext";
import { usePreviewContext } from "@/components/app/PreviewContext";

/**
 * Renders trim start/end inputs whenever media info is loaded.
 * Visible for all output formats (audio and video).
 */
export function TrimSection() {
  const { info } = useVideoFetch();
  const { trimStart, trimEnd, setTrimRange } = usePreviewContext();

  if (!info) return null;

  return (
    <div className="rounded-lg border border-primary-200 bg-primary-50 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        Trim
      </h3>
      <TrimControls
        start={trimStart}
        end={trimEnd}
        duration={info.duration}
        onChange={setTrimRange}
      />
    </div>
  );
}
