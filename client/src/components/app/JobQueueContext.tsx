import { createContext, useContext } from "react";
import type { Job } from "@/hooks/useDownloadJob";

export interface JobQueueContextValue {
  jobs: Job[];
  history: Job[];
  cancelDownload: (jobId: string) => Promise<void>;
  clearHistory: () => void;
}

export const JobQueueContext = createContext<JobQueueContextValue | null>(null);

/** Returns job queue state. Must be used inside SingleDownloadProvider. */
export function useJobQueue(): JobQueueContextValue {
  const ctx = useContext(JobQueueContext);
  if (!ctx) throw new Error("useJobQueue must be used within SingleDownloadProvider");
  return ctx;
}
