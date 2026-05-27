import { useState } from "react";

interface UrlInputProps {
  onSubmit: (url: string) => void | Promise<void>;
  loading?: boolean;
}

export function UrlInput({ onSubmit, loading }: UrlInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        className="flex-1 rounded-md border border-primary-200 bg-primary-50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
        placeholder="Paste YouTube URL…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData("text").trim();
          if (pasted.includes("youtube.com") || pasted.includes("youtu.be")) {
            e.preventDefault();
            setValue(pasted);
          }
        }}
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="cursor-pointer rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Loading…" : "Fetch"}
      </button>
    </form>
  );
}
