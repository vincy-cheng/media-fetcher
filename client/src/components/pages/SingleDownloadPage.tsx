import { SingleDownloadSection } from "@/components/app/SingleDownloadSection";
import { SingleDownloadProvider } from "@/components/app/SingleDownloadProvider";
import { useActiveTab } from "@/providers/ActiveTabProvider";

/**
 * Renders the single-download tab panel boundary.
 */
export function SingleDownloadPage() {
  const { activeTab } = useActiveTab();

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
      </SingleDownloadProvider>
    </div>
  );
}
