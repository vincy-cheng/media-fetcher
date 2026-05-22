// src-tauri/src/utils/types.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CookieConfig {
    pub mode: String,
    pub browser: Option<String>,
    pub file_path: Option<String>,
}

impl Default for CookieConfig {
    fn default() -> Self {
        Self { mode: "none".to_string(), browser: None, file_path: None }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DownloadPreferences {
    pub default_format: String,
    pub default_output_dir: String,
    pub default_bitrate: u16,
}

impl Default for DownloadPreferences {
    fn default() -> Self {
        Self {
            default_format: "m4a".to_string(),
            default_output_dir: String::new(),
            default_bitrate: 192,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub cookie_config: CookieConfig,
    pub download_preferences: DownloadPreferences,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VideoInfo {
    pub id: String,
    pub title: String,
    pub duration: f64,
    pub thumbnail: String,
    pub uploader: String,
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(dead_code)]
pub struct DownloadOptions {
    pub url: String,
    pub format: String,
    pub start: Option<f64>,
    pub end: Option<f64>,
    pub output_dir: String,
}

/// Legacy struct kept for any callers that don't need a job_id.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JobProgress {
    pub percent: f64,
    pub stage: String,
    pub message: String,
}

/// Emitted as "download-progress" Tauri event (includes job_id for per-job tracking).
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgressEvent {
    pub job_id: String,
    pub percent: f64,
    pub stage: String,
    pub message: String,
}

/// Emitted as "download-complete" Tauri event.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DownloadCompleteEvent {
    pub job_id: String,
    pub output_path: String,
}

/// Status of a single sidecar binary.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ToolInfo {
    /// The version string if the binary ran successfully, e.g. "2025.04.30".
    pub version: Option<String>,
    /// Non-null when the binary could not be executed.
    pub error: Option<String>,
}

/// Returned by the `check_tools_status` command.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ToolsStatus {
    pub ytdlp: ToolInfo,
    pub ffmpeg: ToolInfo,
}

/// Emitted as the `ytdlp-update-progress` Tauri event during an update.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProgress {
    /// 0–100
    pub percent: u8,
    /// One of: "connecting", "downloading", "installing", "complete", "error"
    pub stage: String,
    pub message: String,
}
