use tauri::AppHandle;
use crate::utils::{
    sidecar::{run_ytdlp, cookie_args},
    types::{VideoInfo, CookieConfig},
    validation::is_valid_url,
};

#[tauri::command]
pub async fn get_video_info(
    app: AppHandle,
    url: String,
    cookie_config: Option<CookieConfig>,
) -> Result<VideoInfo, String> {
    if !is_valid_url(&url) {
        return Err("Invalid URL".to_string());
    }

    let mut args = vec![
        "--dump-json".to_string(),
        "--no-playlist".to_string(),
        "--no-warnings".to_string(),
    ];
    args.extend(cookie_args(&cookie_config));
    args.push(url.clone());

    // No cancellation needed for info fetch — use a never-fired receiver.
    let (_tx, cancel_rx) = tokio::sync::watch::channel(false);
    let stdout = run_ytdlp(&app, args, cancel_rx).await?;

    let json: serde_json::Value =
        serde_json::from_str(&stdout).map_err(|e| format!("Failed to parse video info: {e}"))?;

    Ok(VideoInfo {
        id: json["id"].as_str().unwrap_or("").to_string(),
        title: json["title"].as_str().unwrap_or("Unknown").to_string(),
        duration: json["duration"].as_f64().unwrap_or(0.0),
        thumbnail: json["thumbnail"].as_str().unwrap_or("").to_string(),
        uploader: json["uploader"].as_str().unwrap_or("").to_string(),
        url: url.clone(),
    })
}
