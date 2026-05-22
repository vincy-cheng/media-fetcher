// client/src/components/BatchUrlInput.tsx
import { useState } from "react";
import { MAX_BATCH_URLS } from "@/hooks/useBatchDownload";

function isYouTubeUrl(url: string): boolean {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

interface BatchUrlInputProps {
  count: number;
  onAdd: (url: string) => void;
}

export function BatchUrlInput({ count, onAdd }: BatchUrlInputProps) {
  const [value, setValue] = useState("");

  const trimmed = value.trim();
  const isValid = trimmed.length > 0 && isYouTubeUrl(trimmed);
  const atLimit = count >= MAX_BATCH_URLS;

  const handleAdd = () => {
    if (!isValid || atLimit) return;
    onAdd(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAdd();
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 rounded-md border border-primary-200 bg-primary-50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          placeholder="Paste YouTube URL…"
          aria-label="YouTube URL"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={atLimit}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!isValid || atLimit}
          className="cursor-pointer rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {atLimit && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Maximum of {MAX_BATCH_URLS} URLs reached.
        </p>
      )}
    </div>
  );
}
