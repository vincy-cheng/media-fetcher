/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";
import type { Dispatch, SetStateAction } from "react";

export interface DownloadFormContextValue {
  customFilename: string;
  setCustomFilename: Dispatch<SetStateAction<string>>;
  hasInvalidFilenameChars: boolean;
  filenameInvalidCharsWarning: string | null;
  filenameEmptyHint: string | null;
  filenameSubmitWarning: string | null;
  durationError: string | null;
  handleDownload: () => Promise<void>;
}

export const DownloadFormContext = createContext<DownloadFormContextValue | null>(null);

/** Returns download form state. Must be used inside SingleDownloadProvider. */
export function useDownloadForm(): DownloadFormContextValue {
  const ctx = useContext(DownloadFormContext);
  if (!ctx) throw new Error("useDownloadForm must be used within SingleDownloadProvider");
  return ctx;
}
