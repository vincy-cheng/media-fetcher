import { SingleDownloadSection } from "@/components/app/SingleDownloadSection";
import { SingleDownloadProvider } from "@/components/app/SingleDownloadProvider";
import { RecentHistory } from "@/components/RecentHistory";
import { useAppShell } from "@/providers/AppShellProvider";

/**
 * Renders the single-download tab panel boundary.
 */
export function SingleDownloadPage() {
  const { activeTab } = useAppShell();

  return (
    <div
      role="tabpanel"
      id="tabpanel-single"
      aria-labelledby="tab-single"
      hidden={activeTab !== "single"}
      className="mt-4"
    >
      <SingleDownloadProvider>
        <SingleDownloadSection />
        <RecentHistory type="single" />
      </SingleDownloadProvider>
    </div>
  );
}
