use tauri::{AppHandle, Emitter};
use tauri_plugin_shell::ShellExt;
use crate::utils::types::{ToolInfo, ToolsStatus, UpdateProgress};

/// Probe yt-dlp and ffmpeg and return their versions (or errors).
/// Called from React on mount to detect missing/broken binaries.
#[tauri::command]
pub async fn check_tools_status(app: AppHandle) -> Result<ToolsStatus, String> {
    let ytdlp = probe_ytdlp(&app).await;
    let ffmpeg = probe_ffmpeg(&app).await;
    Ok(ToolsStatus { ytdlp, ffmpeg })
}

async fn probe_ytdlp(app: &AppHandle) -> ToolInfo {
    use crate::utils::sidecar::run_ytdlp;
    match run_ytdlp(app, vec!["--version".to_string()]).await {
        Ok(out) => {
            let version = out.trim().to_string();
            let version = if version.is_empty() { None } else { Some(version) };
            ToolInfo { version, error: None }
        }
        Err(e) => ToolInfo { version: None, error: Some(e) },
    }
}

async fn probe_ffmpeg(app: &AppHandle) -> ToolInfo {
    let result = app
        .shell()
        .sidecar("ffmpeg")
        .map_err(|e| e.to_string())
        .map(|cmd| cmd.args(["-version"]));

    let output = match result {
        Ok(cmd) => cmd.output().await,
        Err(e) => return ToolInfo { version: None, error: Some(e) },
    };

    match output {
        Ok(o) => {
            // ffmpeg -version writes "ffmpeg version X.Y ..." to stdout
            let stdout = String::from_utf8_lossy(&o.stdout).to_string();
            let stderr = String::from_utf8_lossy(&o.stderr).to_string();
            let combined = if stdout.is_empty() { stderr } else { stdout };
            let version = combined
                .lines()
                .next()
                .and_then(|l| l.split_whitespace().nth(2))
                .map(|v| v.to_string());
            if o.status.success() || version.is_some() {
                ToolInfo { version, error: None }
            } else {
                ToolInfo { version: None, error: Some(combined) }
            }
        }
        Err(e) => ToolInfo { version: None, error: Some(e.to_string()) },
    }
}

/// Fetch the latest yt-dlp release tag from GitHub.
/// Returns the tag string, e.g. "2025.04.30".
#[tauri::command]
pub async fn check_ytdlp_update() -> Result<String, String> {
    latest_ytdlp_version().await
}

async fn latest_ytdlp_version() -> Result<String, String> {
    let client = reqwest::Client::builder()
        .user_agent("youtube-audio-downloader/1.0")
        .build()
        .map_err(|e| format!("HTTP client error: {e}"))?;

    let resp = client
        .get("https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest")
        .send()
        .await
        .map_err(|e| format!("Network error: {e}"))?;

    let json: serde_json::Value = resp
        .error_for_status()
        .map_err(|e| format!("GitHub API error: {e}"))?
        .json()
        .await
        .map_err(|e| format!("Parse error: {e}"))?;

    json["tag_name"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Missing tag_name in GitHub response".to_string())
}

/// Download and install the latest yt-dlp binary to app_local_data_dir.
/// Emits "update_progress" events with UpdateProgress payloads.
#[tauri::command]
pub async fn update_ytdlp(app: AppHandle) -> Result<(), String> {
    let url = ytdlp_download_url();
    let dest = install_path(&app)?;

    app.emit("update_progress", UpdateProgress { 
        percent: 0, 
        stage: "connecting".to_string(),
        message: "Starting download...".to_string() 
    }).map_err(|e| format!("Emit error: {e}"))?;

    let bytes = download_binary(&url).await?;

    app.emit("update_progress", UpdateProgress { 
        percent: 80, 
        stage: "installing".to_string(),
        message: "Installing...".to_string() 
    }).map_err(|e| format!("Emit error: {e}"))?;

    install_binary(&dest, &bytes)?;

    app.emit("update_progress", UpdateProgress { 
        percent: 100, 
        stage: "complete".to_string(),
        message: "Done!".to_string() 
    }).map_err(|e| format!("Emit error: {e}"))?;

    Ok(())
}

fn ytdlp_download_url() -> String {
    #[cfg(target_os = "macos")]
    return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos".to_string();
    #[cfg(target_os = "windows")]
    return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe".to_string();
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    return "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp".to_string();
}

fn install_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    use tauri::Manager;
    let dir = app.path().app_local_data_dir()
        .map_err(|e| format!("Data dir error: {e}"))?;
    std::fs::create_dir_all(&dir).map_err(|e| format!("Create dir error: {e}"))?;
    Ok(dir.join("yt-dlp"))
}

async fn download_binary(url: &str) -> Result<bytes::Bytes, String> {
    let client = reqwest::Client::builder()
        .user_agent("youtube-audio-downloader/1.0")
        .build()
        .map_err(|e| format!("HTTP client error: {e}"))?;
    let resp = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Download error: {e}"))?;
    resp.error_for_status()
        .map_err(|e| format!("HTTP error: {e}"))?
        .bytes()
        .await
        .map_err(|e| format!("Read error: {e}"))
}

fn install_binary(dest: &std::path::Path, data: &[u8]) -> Result<(), String> {
    std::fs::write(dest, data).map_err(|e| format!("Write error: {e}"))?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(dest, std::fs::Permissions::from_mode(0o755))
            .map_err(|e| format!("Chmod error: {e}"))?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    /// Simulates parsing the ffmpeg -version first line.
    fn parse_ffmpeg_version(output: &str) -> Option<String> {
        output
            .lines()
            .next()
            .and_then(|l| l.split_whitespace().nth(2))
            .map(|v| v.to_string())
    }

    #[test]
    fn parse_ffmpeg_version_standard() {
        let out = "ffmpeg version 7.1 Copyright (C) 2000-2024 the FFmpeg developers\n";
        assert_eq!(parse_ffmpeg_version(out), Some("7.1".to_string()));
    }

    #[test]
    fn parse_ffmpeg_version_empty() {
        assert_eq!(parse_ffmpeg_version(""), None);
    }

    #[test]
    fn parse_ffmpeg_version_too_few_tokens() {
        let out = "ffmpeg version\n";
        assert_eq!(parse_ffmpeg_version(out), None);
    }

    #[test]
    fn extract_tag_from_json() {
        let json: serde_json::Value = serde_json::json!({ "tag_name": "2025.04.30" });
        let tag = json["tag_name"].as_str().map(|s| s.to_string());
        assert_eq!(tag, Some("2025.04.30".to_string()));
    }

    #[test]
    fn missing_tag_returns_none() {
        let json: serde_json::Value = serde_json::json!({ "other": "value" });
        let tag = json["tag_name"].as_str().map(|s| s.to_string());
        assert_eq!(tag, None);
    }

    #[test]
    fn ytdlp_url_is_nonempty() {
        let url = super::ytdlp_download_url();
        assert!(!url.is_empty());
        assert!(url.starts_with("https://"));
    }

    #[test]
    fn install_binary_writes_file() {
        let dir = std::env::temp_dir().join("ytdlp_test");
        std::fs::create_dir_all(&dir).unwrap();
        let dest = dir.join("yt-dlp");
        super::install_binary(&dest, b"fake binary").unwrap();
        let content = std::fs::read(&dest).unwrap();
        assert_eq!(content, b"fake binary");
        std::fs::remove_dir_all(&dir).unwrap();
    }
}
