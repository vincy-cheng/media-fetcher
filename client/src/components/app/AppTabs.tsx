import { useAppShell, type AppShellTab } from "@/providers/AppShellProvider";

const APP_SHELL_TABS: AppShellTab[] = ["single", "batch"];

/**
 * Renders the top-level shell tabs.
 */
export function AppTabs() {
  const { activeTab, setActiveTab } = useAppShell();

  return (
    <div
      className="flex gap-1 rounded-lg border border-primary-200 bg-primary-50 p-1 dark:border-gray-700 dark:bg-gray-800"
      role="tablist"
    >
      {APP_SHELL_TABS.map((tab) => (
        <button
          key={tab}
          id={`tab-${tab}`}
          type="button"
          onClick={() => setActiveTab(tab)}
          role="tab"
          aria-selected={activeTab === tab}
          aria-controls={`tabpanel-${tab}`}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors hover:cursor-pointer ${
            activeTab === tab
              ? "bg-primary-600 text-white"
              : "text-gray-600 hover:bg-primary-100 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          {tab === "single" ? "Single" : "Batch"}
        </button>
      ))}
    </div>
  );
}
