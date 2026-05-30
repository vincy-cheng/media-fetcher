import { createContext, useContext } from "react";
import type { VideoInfo } from "@/api/types";

export interface VideoFetchContextValue {
  info: VideoInfo | null;
  infoLoading: boolean;
  infoError: string | null;
  handleFetchInfo: (url: string) => Promise<void>;
}

export const VideoFetchContext = createContext<VideoFetchContextValue | null>(null);

/** Returns video fetch state. Must be used inside SingleDownloadProvider. */
export function useVideoFetch(): VideoFetchContextValue {
  const ctx = useContext(VideoFetchContext);
  if (!ctx) throw new Error("useVideoFetch must be used within SingleDownloadProvider");
  return ctx;
}
