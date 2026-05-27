type FilenameInputProps = {
  value: string
  extension: string
  onChange: (next: string) => void
  invalidCharsWarning?: string | null
  emptyHint?: string | null
  emptyOnDownloadWarning?: string | null
}

export function FilenameInput({
  value,
  extension,
  onChange,
  invalidCharsWarning,
  emptyHint,
  emptyOnDownloadWarning,
}: FilenameInputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Output filename
      </label>
      <div className="flex items-center rounded-md border border-primary-300 bg-white dark:border-gray-600 dark:bg-gray-900">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent px-3 py-2 text-sm text-gray-900 outline-none dark:text-gray-100"
          placeholder="Video title"
          aria-label="Output filename base name"
        />
        <span className="shrink-0 border-l border-primary-200 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          .{extension}
        </span>
      </div>
      {emptyHint && <p className="text-xs text-gray-500 dark:text-gray-400">{emptyHint}</p>}
      {invalidCharsWarning && (
        <p className="rounded-md border border-yellow-300 bg-yellow-50 p-2 text-xs text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
          {invalidCharsWarning}
        </p>
      )}
      {emptyOnDownloadWarning && (
        <p className="rounded-md border border-yellow-300 bg-yellow-50 p-2 text-xs text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
          {emptyOnDownloadWarning}
        </p>
      )}
    </div>
  )
}
