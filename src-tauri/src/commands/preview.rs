use std::path::PathBuf;
use tauri::AppHandle;
use crate::utils::{
    sidecar::{run_ytdlp, cookie_args},
    types::CookieConfig,
    validation::is_valid_youtube_url,
};

/// Downloads audio-only to a temp file and returns the file path.
/// The frontend calls convertFileSrc(path) to load it in WaveSurfer.
#[tauri::command]
pub async fn extract_preview_audio(
    app: AppHandle,
    url: String,
    cookie_config: Option<CookieConfig>,
) -> Result<String, String> {
    if !is_valid_youtube_url(&url) {
        return Err("Invalid YouTube URL".to_string());
    }

    let tmp_dir = std::env::temp_dir();
    let frag = uuid_fragment();
    let tmp_path: PathBuf = tmp_dir.join(format!("ytdl_preview_{frag}.%(ext)s"));
    let tmp_path_str = tmp_path.to_str().unwrap_or("/tmp/ytdl_preview.%(ext)s").to_string();

    let mut args = vec![
        "-f".to_string(), "bestaudio".to_string(),
        "--no-playlist".to_string(),
        "--no-warnings".to_string(),
        "-o".to_string(), tmp_path_str,
    ];
    args.extend(cookie_args(&cookie_config));
    args.push(url.clone());

    run_ytdlp(&app, args).await?;

    let prefix = format!("ytdl_preview_{frag}");
    let actual = find_file_with_prefix(&tmp_dir, &prefix)?;
    Ok(actual.to_string_lossy().to_string())
}

fn uuid_fragment() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .subsec_nanos()
        .to_string()
}

fn find_file_with_prefix(dir: &PathBuf, prefix: &str) -> Result<PathBuf, String> {
    let entries = std::fs::read_dir(dir).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let name = entry.file_name();
        let name_str = name.to_string_lossy();
        if name_str.starts_with(prefix) {
            return Ok(entry.path());
        }
    }
    Err(format!("Preview file not found (prefix: {prefix})"))
}
