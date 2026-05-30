import { createContext, useContext } from "react";

export interface PreviewContextValue {
  audioUrl: string | null;
  previewLoading: boolean;
  previewError: string | null;
  trimStart: number;
  trimEnd: number;
  handlePreview: () => Promise<void>;
  cancelPreview: () => void;
  resetPreview: () => void;
  setTrimRange: (start: number, end: number) => void;
}

export const PreviewContext = createContext<PreviewContextValue | null>(null);

/** Returns preview and trim state. Must be used inside SingleDownloadProvider. */
export function usePreviewContext(): PreviewContextValue {
  const ctx = useContext(PreviewContext);
  if (!ctx) throw new Error("usePreviewContext must be used within SingleDownloadProvider");
  return ctx;
}
