/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef } from "react";
import type { Dispatch, PropsWithChildren, SetStateAction } from "react";
import { capabilities } from "@/api/client";
import { useSettingsContext } from "@/providers/SettingsProvider";
import type { Format, VideoResolution, Bitrate } from "@/api/types";

interface DownloadOptionsContextValue {
  format: Format;
  setFormat: Dispatch<SetStateAction<Format>>;
  resolution: VideoResolution;
  setResolution: Dispatch<SetStateAction<VideoResolution>>;
  outputDir: string;
  setOutputDir: Dispatch<SetStateAction<string>>;
  bitrate: Bitrate;
  setBitrate: Dispatch<SetStateAction<Bitrate>>;
  maxDurationSeconds: number | null;
  canPreview: boolean;
  canBrowseFolder: boolean;
}

const DownloadOptionsContext = createContext<DownloadOptionsContextValue | null>(null);

/**
 * Provides shared download options used by both single and batch tabs.
 * Prefills defaults from settings once they are loaded.
 * Must be inside SettingsProvider.
 */
export function DownloadOptionsProvider({ children }: PropsWithChildren) {
  const { settings, settingsLoaded } = useSettingsContext();
  const prefilled = useRef(false);

  const [format, setFormat] = useState<Format>("m4a");
  const [resolution, setResolution] = useState<VideoResolution>("1080p");
  const [outputDir, setOutputDir] = useState("");
  const [bitrate, setBitrate] = useState<Bitrate>(192);

  useEffect(() => {
    if (!settingsLoaded || prefilled.current) return;
    prefilled.current = true;
    const prefs = settings.downloadPreferences;
    setFormat(prefs.defaultFormat);
    setBitrate(prefs.defaultBitrate);
    if (prefs.defaultOutputDir) setOutputDir(prefs.defaultOutputDir);
    if (prefs.defaultResolution) setResolution(prefs.defaultResolution);
  }, [settingsLoaded, settings]);

  return (
    <DownloadOptionsContext.Provider
      value={{
        format,
        setFormat,
        resolution,
        setResolution,
        outputDir,
        setOutputDir,
        bitrate,
        setBitrate,
        maxDurationSeconds: settings.downloadPreferences.maxDurationSeconds,
        canPreview: capabilities.canPreview,
        canBrowseFolder: capabilities.canBrowseFolder,
      }}
    >
      {children}
    </DownloadOptionsContext.Provider>
  );
}

/** Returns shared download options. Must be used inside DownloadOptionsProvider. */
export function useDownloadOptions(): DownloadOptionsContextValue {
  const ctx = useContext(DownloadOptionsContext);
  if (!ctx) throw new Error("useDownloadOptions must be used within DownloadOptionsProvider");
  return ctx;
}
