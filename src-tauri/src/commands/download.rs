use std::path::PathBuf;
use tauri::{AppHandle, Emitter, State};
use tokio::sync::watch;
use crate::utils::{
    sidecar::{run_ytdlp, run_ffmpeg, cookie_args},
    types::{CancellationRegistry, CookieConfig, DownloadProgressEvent, DownloadCompleteEvent},
    validation::is_valid_youtube_url,
};

/// Absolute maximum video duration (3 hours). Enforced regardless of user settings.
const ABSOLUTE_MAX_DURATION_SECONDS: f64 = 10_800.0;

#[tauri::command]
pub async fn cancel_download(
    job_id: String,
    registry: State<'_, CancellationRegistry>,
) -> Result<(), String> {
    if let Ok(mut map) = registry.lock() {
        if let Some(tx) = map.remove(&job_id) {
            let _ = tx.send(true);
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn download_media(
    app: AppHandle,
    job_id: String,
    url: String,
    format: String,
    resolution: Option<String>,
    start: Option<f64>,
    end: Option<f64>,
    output_dir: String,
    cookie_config: Option<CookieConfig>,
    bitrate: Option<u16>,
    duration: Option<f64>,
    registry: State<'_, CancellationRegistry>,
) -> Result<String, String> {
    if !is_valid_youtube_url(&url) {
        return Err("Invalid YouTube URL".to_string());
    }

    // Duration safety check (backend hard ceiling)
    if let Some(d) = duration {
        if d > 0.0 && d > ABSOLUTE_MAX_DURATION_SECONDS {
            return Err(format!(
                "Video duration ({}) exceeds the maximum allowed length of 3 hours",
                format_time(d)
            ));
        }
    }

    // Create cancellation channel for this job
    let (cancel_tx, cancel_rx) = watch::channel(false);
    if let Ok(mut map) = registry.lock() {
        map.insert(job_id.clone(), cancel_tx);
    }

    // Helper: emit a cancelled event, remove from registry, return Err
    let emit_cancelled = |app: &AppHandle, job_id: &str| {
        let _ = app.emit("download-progress", DownloadProgressEvent {
            job_id: job_id.to_string(),
            percent: 0.0,
            stage: "cancelled".to_string(),
            message: "Download cancelled".to_string(),
        });
    };

    // Emit: starting download
    let _ = app.emit("download-progress", DownloadProgressEvent {
        job_id: job_id.clone(),
        percent: 0.0,
        stage: "downloading".to_string(),
        message: "Fetching stream…".to_string(),
    });

    // Step 1: download raw audio to temp file
    let tmp_dir = std::env::temp_dir();
    let tmp_template = tmp_dir.join(format!("ytdl_dl_{job_id}.%(ext)s"));
    let tmp_template_str = tmp_template.to_string_lossy().to_string();

    let yt_format = if is_video_format(&format) {
        let height = resolution_to_height(resolution.as_deref().unwrap_or("1080p"));
        format!("bestvideo[height<={height}]+bestaudio/best[height<={height}]")
    } else {
        "bestaudio".to_string()
    };

    let mut dl_args = vec![
        "-f".to_string(), yt_format,
        "--no-playlist".to_string(),
        "--no-warnings".to_string(),
        "-o".to_string(), tmp_template_str,
    ];
    dl_args.extend(cookie_args(&cookie_config));
    dl_args.push(url.clone());

    match run_ytdlp(&app, dl_args, cancel_rx.clone()).await {
        Ok(_) => {}
        Err(e) if e == "cancelled" => {
            // Try to remove partial temp file
            if let Ok(f) = find_file_with_prefix(&tmp_dir, &format!("ytdl_dl_{job_id}")) {
                let _ = std::fs::remove_file(f);
            }
            remove_from_registry(&registry, &job_id);
            emit_cancelled(&app, &job_id);
            return Err("cancelled".to_string());
        }
        Err(e) => {
            remove_from_registry(&registry, &job_id);
            return Err(e);
        }
    }

    let prefix = format!("ytdl_dl_{job_id}");
    let raw_file = match find_file_with_prefix(&tmp_dir, &prefix) {
        Ok(f) => f,
        Err(_) => {
            remove_from_registry(&registry, &job_id);
            return Err("Downloaded audio file not found".to_string());
        }
    };

    // Emit: converting
    let _ = app.emit("download-progress", DownloadProgressEvent {
        job_id: job_id.clone(),
        percent: 50.0,
        stage: "converting".to_string(),
        message: format!("Converting to {format}…"),
    });

    // Step 2: fetch video title for output filename
    let mut title_args = vec![
        "--get-title".to_string(),
        "--no-playlist".to_string(),
        "--no-warnings".to_string(),
    ];
    title_args.extend(cookie_args(&cookie_config));
    title_args.push(url.clone());

    let title_stdout = match run_ytdlp(&app, title_args, cancel_rx.clone()).await {
        Ok(s) => s,
        Err(e) if e == "cancelled" => {
            let _ = std::fs::remove_file(&raw_file);
            remove_from_registry(&registry, &job_id);
            emit_cancelled(&app, &job_id);
            return Err("cancelled".to_string());
        }
        Err(_) => "audio".to_string(), // title fetch failure is non-fatal
    };
    let title = sanitize_filename(title_stdout.trim());

    let output_path = PathBuf::from(&output_dir).join(format!("{title}.{format}"));
    let output_str = output_path.to_string_lossy().to_string();
    let raw_str = raw_file.to_string_lossy().to_string();

    // Step 3: ffmpeg convert + optional trim
    let mut ffmpeg_args: Vec<String> = vec![
        "-y".to_string(),
        "-i".to_string(), raw_str.clone(),
    ];

    if let Some(s) = start {
        ffmpeg_args.extend(["-ss".to_string(), format_time(s)]);
    }
    if let Some(e) = end {
        ffmpeg_args.extend(["-to".to_string(), format_time(e)]);
    }

    let lossy_bitrate = bitrate.unwrap_or(192);
    match format.as_str() {
        "mp3"  => ffmpeg_args.extend([
            "-acodec".to_string(), "libmp3lame".to_string(),
            "-b:a".to_string(), format!("{lossy_bitrate}k"),
        ]),
        "m4a"  => ffmpeg_args.extend([
            "-acodec".to_string(), "aac".to_string(),
            "-b:a".to_string(), format!("{lossy_bitrate}k"),
        ]),
        "wav"  => ffmpeg_args.extend(["-acodec".to_string(), "pcm_s16le".to_string()]),
        "ogg"  => ffmpeg_args.extend([
            "-acodec".to_string(), "libvorbis".to_string(),
            "-b:a".to_string(), format!("{lossy_bitrate}k"),
        ]),
        "flac" => ffmpeg_args.extend(["-acodec".to_string(), "flac".to_string()]),
        "mp4"  => ffmpeg_args.extend([
            "-c:v".to_string(), "libx264".to_string(),
            "-c:a".to_string(), "aac".to_string(),
            "-movflags".to_string(), "+faststart".to_string(),
        ]),
        "webm" => ffmpeg_args.extend([
            "-c:v".to_string(), "libvpx-vp9".to_string(),
            "-c:a".to_string(), "libopus".to_string(),
        ]),
        _      => {}
    }

    ffmpeg_args.push(output_str.clone());

    let args_ref: Vec<&str> = ffmpeg_args.iter().map(|s| s.as_str()).collect();
    let ffmpeg_result = run_ffmpeg(&app, args_ref, cancel_rx.clone()).await;
    let _ = std::fs::remove_file(&raw_file); // always clean up raw file

    match ffmpeg_result {
        Err(e) if e == "cancelled" => {
            // Remove partial output file
            let _ = std::fs::remove_file(&output_path);
            remove_from_registry(&registry, &job_id);
            emit_cancelled(&app, &job_id);
            return Err("cancelled".to_string());
        }
        Err(e) => {
            remove_from_registry(&registry, &job_id);
            return Err(e);
        }
        Ok(_) => {}
    }

    remove_from_registry(&registry, &job_id);

    let _ = app.emit("download-progress", DownloadProgressEvent {
        job_id: job_id.clone(),
        percent: 100.0,
        stage: "complete".to_string(),
        message: format!("Saved to {output_str}"),
    });
    let _ = app.emit("download-complete", DownloadCompleteEvent {
        job_id: job_id.clone(),
        output_path: output_str.clone(),
    });

    Ok(output_str)
}

fn remove_from_registry(registry: &State<'_, CancellationRegistry>, job_id: &str) {
    if let Ok(mut map) = registry.lock() {
        map.remove(job_id);
    }
}

fn find_file_with_prefix(dir: &PathBuf, prefix: &str) -> Result<PathBuf, String> {
    let entries = std::fs::read_dir(dir).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let name = entry.file_name();
        if name.to_string_lossy().starts_with(prefix) {
            return Ok(entry.path());
        }
    }
    Err(format!("File not found with prefix: {prefix}"))
}

fn format_time(seconds: f64) -> String {
    let h = (seconds / 3600.0) as u64;
    let m = ((seconds % 3600.0) / 60.0) as u64;
    let s = (seconds % 60.0) as u64;
    format!("{h:02}:{m:02}:{s:02}")
}

fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| if c.is_alphanumeric() || c == ' ' || c == '-' || c == '_' || c == '.' { c } else { '_' })
        .collect::<String>()
        .trim()
        .to_string()
}

fn is_video_format(format: &str) -> bool {
    format == "mp4" || format == "webm"
}

fn resolution_to_height(resolution: &str) -> u32 {
    resolution.trim_end_matches('p').parse().unwrap_or(1080)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn format_time_hours_minutes_seconds() {
        assert_eq!(format_time(3661.0), "01:01:01");
        assert_eq!(format_time(0.0), "00:00:00");
        assert_eq!(format_time(3600.0), "01:00:00");
    }

    #[test]
    fn absolute_max_duration_is_three_hours() {
        assert_eq!(ABSOLUTE_MAX_DURATION_SECONDS, 10_800.0);
        // anything over 3 hours should fail the check
        assert!(10_801.0 > ABSOLUTE_MAX_DURATION_SECONDS);
        // exactly 3 hours is allowed
        assert!(!(10_800.0 > ABSOLUTE_MAX_DURATION_SECONDS));
    }

    #[test]
    fn sanitize_filename_replaces_special_chars() {
        assert_eq!(sanitize_filename("Hello: World!"), "Hello_ World_");
        assert_eq!(sanitize_filename("  trim  "), "trim");
    }

    #[test]
    fn is_video_format_identifies_mp4_and_webm() {
        assert!(is_video_format("mp4"));
        assert!(is_video_format("webm"));
        assert!(!is_video_format("mp3"));
        assert!(!is_video_format("m4a"));
        assert!(!is_video_format("flac"));
    }

    #[test]
    fn resolution_to_height_parses_common_values() {
        assert_eq!(resolution_to_height("720p"), 720);
        assert_eq!(resolution_to_height("1080p"), 1080);
        assert_eq!(resolution_to_height("2160p"), 2160);
        assert_eq!(resolution_to_height("bad"), 1080); // fallback
    }
}
