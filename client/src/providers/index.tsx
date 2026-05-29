import type { PropsWithChildren } from "react";
import { SettingsProvider } from "@/providers/SettingsProvider";
import { DarkModeProvider } from "@/providers/DarkModeProvider";
import { AppShellProvider } from "@/providers/AppShellProvider";
import { DownloadOptionsProvider } from "@/providers/DownloadOptionsProvider";

/**
 * Composes all global providers.
 * Order: Settings → DarkMode → AppShell → DownloadOptions
 * SettingsProvider must be outermost so DownloadOptionsProvider can read settings.
 */
export function Providers({ children }: PropsWithChildren) {
  return (
    <SettingsProvider>
      <DarkModeProvider>
        <AppShellProvider>
          <DownloadOptionsProvider>{children}</DownloadOptionsProvider>
        </AppShellProvider>
      </DarkModeProvider>
    </SettingsProvider>
  );
}
