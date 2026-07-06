import { BatchDownload } from "@/components/BatchDownload";
import { RecentHistory } from "@/components/RecentHistory";
import { useAppShell } from "@/providers/AppShellProvider";
import { useDownloadOptions } from "@/providers/DownloadOptionsProvider";

/**
 * Renders the batch-download tab panel boundary with app shell defaults.
 */
export function BatchDownloadPage() {
  const { activeTab } = useAppShell();
  const {
    format,
    resolution,
    bitrate,
    outputDir,
    maxDurationSeconds,
  } = useDownloadOptions();

  return (
    <div
      role="tabpanel"
      id="tabpanel-batch"
      aria-labelledby="tab-batch"
      hidden={activeTab !== "batch"}
    >
      <BatchDownload
        defaultFormat={format}
        defaultResolution={resolution}
        defaultBitrate={bitrate}
        defaultOutputDir={outputDir}
        maxDurationSeconds={maxDurationSeconds}
      />
      <RecentHistory type="batch" />
    </div>
  );
}
