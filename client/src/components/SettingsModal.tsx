import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import type {
  AppSettings,
  AudioFormat,
  Bitrate,
  ToolsStatus,
  UpdateProgress,
} from "@/api/types";

const FORMATS: { value: AudioFormat; label: string }[] = [
  { value: "mp3", label: "MP3" },
  { value: "m4a", label: "M4A" },
  { value: "wav", label: "WAV" },
  { value: "ogg", label: "OGG" },
  { value: "flac", label: "FLAC" },
];

const BITRATES: Bitrate[] = [128, 192, 256, 320];

const LOSSLESS: AudioFormat[] = ["wav", "flac"];

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (updated: AppSettings) => Promise<void>;
  onClose: () => void;
  // Tools
  toolStatus: ToolsStatus | null;
  toolsChecking: boolean;
  latestVersion: string | null;
  updateAvailable: boolean;
  checkingUpdate: boolean;
  updating: boolean;
  updateProgress: UpdateProgress | null;
  updateError: string | null;
  onCheckForUpdate: () => Promise<void>;
  onStartUpdate: () => Promise<void>;
}

type SettingsTab = "preferences" | "tools";

export function SettingsModal({
  settings,
  onSave,
  onClose,
  toolStatus,
  toolsChecking,
  latestVersion,
  updateAvailable,
  checkingUpdate,
  updating,
  updateProgress,
  updateError,
  onCheckForUpdate,
  onStartUpdate,
}: SettingsModalProps) {
  const prefs = settings.downloadPreferences;
  const [activeTab, setActiveTab] = useState<SettingsTab>("preferences");
  const [format, setFormat] = useState<AudioFormat>(prefs.defaultFormat);
  const [outputDir, setOutputDir] = useState(prefs.defaultOutputDir);
  const [bitrate, setBitrate] = useState<Bitrate>(prefs.defaultBitrate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  // Convert stored seconds to minutes for display; null means "no limit"
  const [maxDurationMinutes, setMaxDurationMinutes] = useState<string>(
    prefs.maxDurationSeconds != null
      ? String(Math.round(prefs.maxDurationSeconds / 60))
      : ""
  );

  const isLossless = LOSSLESS.includes(format);

  const handleBrowse = async () => {
    setPicking(true);
    try {
      const selected = await open({ directory: true, multiple: false });
      if (typeof selected === "string") setOutputDir(selected);
    } catch {
      // user cancelled
    } finally {
      setPicking(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave({
        ...settings,
        downloadPreferences: {
          defaultFormat: format,
          defaultOutputDir: outputDir,
          defaultBitrate: bitrate,
          maxDurationSeconds:
            maxDurationMinutes.trim() !== "" && Number(maxDurationMinutes) > 0
              ? Number(maxDurationMinutes) * 60
              : null,
        },
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-lg border border-primary-200 bg-primary-50 p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close settings"
          >
            <Cross2Icon />
          </button>
        </div>

        {/* Tab bar */}
        <div
          className="mb-5 flex gap-1 rounded-lg border border-primary-200 bg-primary-100 p-1 dark:border-gray-700 dark:bg-gray-800"
          role="tablist"
        >
          {(["preferences", "tools"] as SettingsTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-primary-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-primary-100 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {tab === "preferences" ? "Preferences" : "Tools"}
            </button>
          ))}
        </div>

        {/* Tab content — min-h prevents jarring height change between tabs */}
        <div className="min-h-[280px]">
          {/* Preferences tab */}
          {activeTab === "preferences" && (
            <div className="space-y-5">
              {/* Default Format */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Default Format
                </label>
                <div className="flex gap-2 flex-wrap">
                  {FORMATS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setFormat(f.value)}
                      className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                        format === f.value
                          ? "border-primary-800 bg-primary-600 text-white"
                          : "border-primary-200 bg-primary-50 text-gray-700 hover:bg-primary-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Output Folder */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="outputDir"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Default Output Folder
                </label>
                <div className="flex gap-2">
                  <input
                    id="outputDir"
                    type="text"
                    value={outputDir}
                    onChange={(e) => setOutputDir(e.target.value)}
                    placeholder="/Users/you/Downloads"
                    className="flex-1 rounded-md border border-primary-200 bg-primary-50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                  />
                  <button
                    type="button"
                    onClick={handleBrowse}
                    disabled={picking}
                    className="cursor-pointer rounded-md border border-primary-200 bg-primary-300 px-3 py-2 text-sm text-primary-800 hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    Browse
                  </button>
                </div>
              </div>

              {/* Default Bitrate (lossy formats only) */}
              {!isLossless && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Default Bitrate
                  </label>
                  <div className="flex gap-2">
                    {BITRATES.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBitrate(b)}
                        className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                          bitrate === b
                            ? "border-primary-800 bg-primary-600 text-white"
                            : "border-primary-200 bg-primary-50 text-gray-700 hover:bg-primary-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                    <span className="self-center text-xs text-gray-400 dark:text-gray-500">
                      kbps
                    </span>
                  </div>
                </div>
              )}

              {/* Max Video Duration */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="maxDuration"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Max Video Duration
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="maxDuration"
                    type="number"
                    min="1"
                    max="180"
                    value={maxDurationMinutes}
                    onChange={(e) => setMaxDurationMinutes(e.target.value)}
                    placeholder="No limit (3h max)"
                    className="w-32 rounded-md border border-primary-200 bg-primary-50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    minutes
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Leave empty for no custom limit (absolute max: 3 hours).
                </p>
              </div>

              {/* Error */}
              {error && (
                <p className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="cursor-pointer rounded-md border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-primary-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="cursor-pointer rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          )}

          {/* Tools tab */}
          {activeTab === "tools" && (
            <div className="space-y-3 rounded-lg border border-primary-200 p-3 dark:border-gray-700">
              {/* yt-dlp row */}
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    yt-dlp
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {toolsChecking ? (
                      "Checking…"
                    ) : toolStatus?.ytdlp.error ? (
                      <span className="text-red-600 dark:text-red-400">
                        Error: {toolStatus.ytdlp.error}
                      </span>
                    ) : toolStatus?.ytdlp.version ? (
                      `v${toolStatus.ytdlp.version}`
                    ) : (
                      "Unknown"
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {!updating && (
                    <button
                      type="button"
                      onClick={onCheckForUpdate}
                      disabled={checkingUpdate}
                      className="cursor-pointer text-xs text-blue-600 hover:underline disabled:opacity-50 dark:text-blue-400"
                    >
                      {checkingUpdate
                        ? "Checking…"
                        : latestVersion
                          ? `Latest: v${latestVersion}`
                          : "Check for update"}
                    </button>
                  )}
                  {updateAvailable && !updating && (
                    <button
                      type="button"
                      onClick={onStartUpdate}
                      className="cursor-pointer rounded bg-blue-600 px-2 py-0.5 text-xs text-white hover:bg-blue-700"
                    >
                      Update to v{latestVersion}
                    </button>
                  )}
                </div>
              </div>

              {/* Update progress bar */}
              {updating && updateProgress && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>{updateProgress.message}</span>
                    <span>{updateProgress.percent}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${updateProgress.percent}%` }}
                    />
                  </div>
                </div>
              )}

              {updateError && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  Update failed: {updateError}
                </p>
              )}

              {/* ffmpeg row */}
              <div className="flex items-center justify-between gap-3 border-t border-primary-200 pt-2 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    ffmpeg
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {toolsChecking ? (
                      "Checking…"
                    ) : toolStatus?.ffmpeg.error ? (
                      <span className="text-red-600 dark:text-red-400">
                        Error: {toolStatus.ffmpeg.error}
                      </span>
                    ) : toolStatus?.ffmpeg.version ? (
                      `v${toolStatus.ffmpeg.version}`
                    ) : (
                      "Unknown"
                    )}
                  </p>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Bundled (read-only)
                </span>
              </div>
            </div>
          )}
        </div>
        {/* end min-h tab content wrapper */}
      </div>
    </div>
  );
}
