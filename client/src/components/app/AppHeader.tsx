import { GearIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { ToolStatusBanner } from "@/components/ToolStatusBanner";
import { useAppShell } from "@/components/app/AppShellContext";

/**
 * Renders the app shell header and global tool status affordances.
 */
export function AppHeader() {
  const { dark, toggleDark, setShowSettings, toolStatus } = useAppShell();

  return (
    <>
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Media Fetcher
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Download audio or video in multiple formats
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="relative inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-primary-700 bg-primary-600 px-3 py-1.5 text-sm text-primary-50 hover:bg-primary-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Open settings"
          >
            <GearIcon />
            Settings
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
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-primary-700 bg-primary-600 px-3 py-1.5 text-sm text-primary-50 hover:bg-primary-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Toggle dark mode"
          >
            {dark ? (
              <>
                <SunIcon /> Light
              </>
            ) : (
              <>
                <MoonIcon /> Dark
              </>
            )}
          </button>
        </div>
      </header>

      {toolStatus.status && toolStatus.hasError && (
        <ToolStatusBanner
          status={toolStatus.status}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}
    </>
  );
}
