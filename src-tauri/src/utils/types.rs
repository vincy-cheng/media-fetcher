use serde::{Deserialize, Serialize};

/// How yt-dlp should authenticate to bypass bot-detection.
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct CookieConfig {
    /// "none" | "browser" | "file"
    pub mode: String,
    /// e.g. "chrome", "firefox", "safari", "edge", "brave"
    pub browser: Option<String>,
    /// Absolute path to a Netscape cookies.txt file
    pub file_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DownloadPreferences {
    /// "mp3" | "m4a" | "wav" | "ogg" | "flac"
    pub default_format: String,
    /// Absolute path or "" if not set
    pub default_output_dir: String,
    /// Bitrate in kbps. Valid values: 128, 192, 256, 320. Only applied to lossy formats (mp3, m4a, ogg).
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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JobProgress {
    pub percent: f64,
    pub stage: String,
    pub message: String,
}
