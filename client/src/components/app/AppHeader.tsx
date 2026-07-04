import { GearIcon, MoonIcon, SunIcon, ClockIcon, DownloadIcon } from "@radix-ui/react-icons";
import { useDarkModeContext } from "@/providers/DarkModeProvider";
import { useAppShell } from "@/providers/AppShellProvider";

/**
 * Renders the app shell header controls.
 */
export function AppHeader() {
  const { dark, toggleDark } = useDarkModeContext();
  const { setShowSettings, setActiveTab, toolStatus, activeTab } = useAppShell();

  return (
    <header className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Media Fetcher
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Download audio or video in multiple formats
        </p>
      </div>
      <div className="flex gap-3">
        {activeTab === 'history' ? (
          <button
            type="button"
            onClick={() => setActiveTab("single")}
            className="cursor-pointer text-gray-700 hover:text-primary-700 dark:text-gray-300 dark:hover:text-white"
            aria-label="Go to download"
          >
            <DownloadIcon width={20} height={20} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className="cursor-pointer text-gray-700 hover:text-primary-700 dark:text-gray-300 dark:hover:text-white"
            aria-label="View history"
          >
            <ClockIcon width={20} height={20} />
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="relative cursor-pointer text-gray-700 hover:text-primary-700 dark:text-gray-300 dark:hover:text-white"
          aria-label="Open settings"
        >
          <GearIcon width={20} height={20} />
          {toolStatus.hasError && (
            <span
              className="absolute -right-1 -top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500"
              aria-label="Tool error"
            />
          )}
        </button>
        <button
          type="button"
          onClick={toggleDark}
          className="cursor-pointer text-gray-700 hover:text-primary-700 dark:text-gray-300 dark:hover:text-white"
          aria-label="Toggle dark mode"
        >
          {dark ? <SunIcon width={20} height={20} /> : <MoonIcon width={20} height={20} />}
        </button>
      </div>
    </header>
  );
}
