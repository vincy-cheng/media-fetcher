import { SettingsModal } from "@/components/SettingsModal";
import { ToolStatusBanner } from "@/components/ToolStatusBanner";
import { AppHeader } from "@/components/app/AppHeader";
import { AppTabs } from "@/components/app/AppTabs";
import { BatchDownloadPage } from "@/components/pages/BatchDownloadPage";
import { SingleDownloadPage } from "@/components/pages/SingleDownloadPage";
import { HistoryPage } from "@/components/pages/HistoryPage";
import { useAppShell } from "@/providers/AppShellProvider";
import { useSettingsContext } from "@/providers/SettingsProvider";
import { DownloadIcon } from "@radix-ui/react-icons";

/**
 * Pure UI shell — renders the header, tabs, pages, and settings modal.
 * All state comes from providers; no local state here.
 */
export function AppShellLayout() {
  const { showSettings, setShowSettings, toolStatus, activeTab, setActiveTab } = useAppShell();
  const { settings, saveSettings } = useSettingsContext();

  return (
    <div className="min-h-screen bg-primary-100 p-6 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl space-y-6">
        <AppHeader />
        {toolStatus.status && toolStatus.hasError && (
          <ToolStatusBanner
            status={toolStatus.status}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}
        {activeTab === 'history' ? (
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className="cursor-pointer text-gray-700 hover:text-primary-700 dark:text-gray-300 dark:hover:text-white"
            aria-label="Go to download"
          >
            <DownloadIcon width={20} height={20} />
          </button>
        ) : (
          <AppTabs />
        )}
        <SingleDownloadPage />
        <BatchDownloadPage />
        <HistoryPage />
      </div>
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
          toolStatus={toolStatus.status}
          toolsChecking={toolStatus.checking}
          latestVersion={toolStatus.latestVersion}
          updateAvailable={toolStatus.updateAvailable}
          checkingUpdate={toolStatus.checkingUpdate}
          updating={toolStatus.updating}
          updateProgress={toolStatus.updateProgress}
          updateError={toolStatus.updateError}
          onCheckForUpdate={toolStatus.checkForUpdate}
          onStartUpdate={toolStatus.startUpdate}
        />
      )}
    </div>
  );
}
