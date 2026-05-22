import { useState } from "react";
import { Cross2Icon, ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import type { Job } from "@/hooks/useDownloadJob";

const STAGE_LABELS: Record<string, string> = {
  downloading: "Downloading",
  converting: "Converting",
  complete: "Complete",
  error: "Error",
  cancelled: "Cancelled",
  cancelling: "Cancelling…",
};

const STAGE_COLORS: Record<string, string> = {
  downloading: "bg-primary-500",
  converting: "bg-zinc-500",
  complete: "bg-emerald-500",
  error: "bg-red-500",
  cancelled: "bg-gray-400",
  cancelling: "bg-yellow-500",
};

interface JobQueueProps {
  jobs: Job[];
  history?: Job[];
  onClear?: () => void;
  onCancel?: (jobId: string) => void;
}

const CANCELLABLE_STAGES = new Set(["downloading", "converting"]);

function JobCard({ job, onCancel }: { job: Job; onCancel?: (id: string) => void }) {
  return (
    <div className="rounded-lg border border-primary-200 bg-primary-50 p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-xs text-gray-600 dark:text-gray-400">
          {job.url}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ${STAGE_COLORS[job.progress.stage] ?? "bg-gray-400"}`}
          >
            {STAGE_LABELS[job.progress.stage] ?? job.progress.stage}
          </span>
          {onCancel && CANCELLABLE_STAGES.has(job.progress.stage) && (
            <button
              type="button"
              onClick={() => onCancel(job.id)}
              aria-label="Cancel download"
              className="cursor-pointer rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <Cross2Icon />
            </button>
          )}
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700">
        <div
          className={`h-2 rounded-full transition-all ${STAGE_COLORS[job.progress.stage] ?? "bg-gray-400"}`}
          style={{ width: `${job.progress.percent}%` }}
        />
      </div>
      <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
        {job.progress.message}
      </p>
      {job.outputPath && (
        <p className="mt-1 truncate text-xs font-medium text-emerald-600 dark:text-emerald-400">
          {job.outputPath}
        </p>
      )}
    </div>
  );
}

export function JobQueue({ jobs, history = [], onClear, onCancel }: JobQueueProps) {
  const [historyOpen, setHistoryOpen] = useState(false);

  if (jobs.length === 0 && history.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {jobs.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Downloading
          </h3>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onCancel={onCancel} />
          ))}
        </>
      )}

      {history.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setHistoryOpen((o) => !o)}
              className="flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              {historyOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              History ({history.length})
            </button>
            {onClear && historyOpen && (
              <button
                type="button"
                onClick={onClear}
                className="cursor-pointer text-xs text-gray-400 underline hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                Clear
              </button>
            )}
          </div>
          {historyOpen && (
            <div className="mt-2 flex flex-col gap-2">
              {history.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
