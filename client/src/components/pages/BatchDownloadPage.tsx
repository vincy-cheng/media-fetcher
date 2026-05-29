import { BatchDownload } from "@/components/BatchDownload";
import { useAppShell } from "@/components/app/AppShellContext";

/**
 * Renders the batch-download tab panel boundary with app shell defaults.
 */
export function BatchDownloadPage() {
  const {
    activeTab,
    format,
    resolution,
    bitrate,
    outputDir,
    maxDurationSeconds,
  } = useAppShell();

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
    </div>
  );
}
