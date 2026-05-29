import { AudioPreview } from "@/components/AudioPreview";
import { TrimControls } from "@/components/TrimControls";
import { useVideoFetch } from "@/components/app/VideoFetchContext";
import { usePreviewContext } from "@/components/app/PreviewContext";
import { useDownloadOptions } from "@/providers/DownloadOptionsProvider";
import { isVideoFormat } from "@/api/types";

/**
 * Renders preview and trim controls for audio downloads when previewing is available.
 */
export function PreviewSection() {
  const { info } = useVideoFetch();
  const { audioUrl, trimStart, trimEnd, setTrimRange } = usePreviewContext();
  const { canPreview, format } = useDownloadOptions();

  if (!canPreview || !audioUrl || !info || isVideoFormat(format)) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-lg border border-primary-200 bg-primary-50 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Preview & Trim
      </h3>
      <AudioPreview
        audioUrl={audioUrl}
        duration={info.duration}
        start={trimStart}
        end={trimEnd}
        onTrimChange={setTrimRange}
      />
      <TrimControls
        start={trimStart}
        end={trimEnd}
        duration={info.duration}
        onChange={setTrimRange}
      />
    </div>
  );
}
