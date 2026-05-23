// src-tauri/src/utils/types.rs
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tokio::sync::watch;

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

fn default_resolution_value() -> String {
    "1080p".to_string()
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DownloadPreferences {
    pub default_format: String,
    #[serde(default = "default_resolution_value")]
    pub default_resolution: String,
    pub default_output_dir: String,
    pub default_bitrate: u16,
    /// User-configurable max duration in seconds. None means use the absolute 3-hour ceiling.
    #[serde(default)]
    pub max_duration_seconds: Option<u32>,
}

impl Default for DownloadPreferences {
    fn default() -> Self {
        Self {
            default_format: "m4a".to_string(),
            default_resolution: "1080p".to_string(),
            default_output_dir: String::new(),
            default_bitrate: 192,
            max_duration_seconds: None,
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
    pub version: Option<String>,
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
    pub percent: u8,
    pub stage: String,
    pub message: String,
}

/// Maps job_id → a watch sender. Sending `true` cancels the job.
pub type CancellationRegistry = Mutex<HashMap<String, watch::Sender<bool>>>;
