import type { Job } from "@/hooks/useDownloadJob";

const STAGE_LABELS: Record<string, string> = {
  downloading: "Downloading",
  converting: "Converting",
  complete: "Complete",
  error: "Error",
};

const STAGE_COLORS: Record<string, string> = {
  downloading: "bg-primary-500",
  converting: "bg-zinc-500",
  complete: "bg-emerald-500",
  error: "bg-red-500",
};

interface JobQueueProps {
  jobs: Job[];
  onClear?: () => void;
}

export function JobQueue({ jobs, onClear }: JobQueueProps) {
  if (jobs.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Downloads
        </h3>
        {onClear && (
          <button
            onClick={onClear}
            className="cursor-pointer text-xs text-gray-400 underline hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            Clear History
          </button>
        )}
      </div>
      {jobs.map((job) => (
        <div
          key={job.id}
          className="rounded-lg border border-primary-200 bg-primary-50 p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="truncate text-xs text-gray-600 dark:text-gray-400">
              {job.url}
            </span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-white ${STAGE_COLORS[job.progress.stage] ?? "bg-gray-400"}`}
            >
              {STAGE_LABELS[job.progress.stage] ?? job.progress.stage}
            </span>
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
            <span>
              <p className="mt-1 truncate text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {job.outputPath}
              </p>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
