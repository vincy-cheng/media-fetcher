import { SingleDownloadSection } from "@/components/app/SingleDownloadSection";
import { useAppShell } from "@/components/app/AppShellContext";

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
      <SingleDownloadSection />
    </div>
  );
}
