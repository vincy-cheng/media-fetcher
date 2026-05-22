use std::path::PathBuf;
use tauri::{AppHandle, Emitter};
use crate::utils::{
    sidecar::{run_ytdlp, run_ffmpeg, cookie_args},
    types::{CookieConfig, DownloadProgressEvent, DownloadCompleteEvent},
    validation::is_valid_youtube_url,
};

#[tauri::command]
pub async fn download_audio(
    app: AppHandle,
    job_id: String,
    url: String,
    format: String,
    start: Option<f64>,
    end: Option<f64>,
    output_dir: String,
    cookie_config: Option<CookieConfig>,
    bitrate: Option<u16>,
) -> Result<String, String> {
    if !is_valid_youtube_url(&url) {
        return Err("Invalid YouTube URL".to_string());
    }

    // Emit: starting download
    let _ = app.emit("download-progress", DownloadProgressEvent {
        job_id: job_id.clone(),
        percent: 0.0,
        stage: "downloading".to_string(),
        message: "Fetching audio stream…".to_string(),
    });

    // Step 1: download raw audio to temp file
    let tmp_dir = std::env::temp_dir();
    let tmp_template = tmp_dir.join(format!("ytdl_dl_{job_id}.%(ext)s"));
    let tmp_template_str = tmp_template.to_string_lossy().to_string();

    let mut dl_args = vec![
        "-f".to_string(), "bestaudio".to_string(),
        "--no-playlist".to_string(),
        "--no-warnings".to_string(),
        "-o".to_string(), tmp_template_str,
    ];
    dl_args.extend(cookie_args(&cookie_config));
    dl_args.push(url.clone());

    run_ytdlp(&app, dl_args).await?;

    let prefix = format!("ytdl_dl_{job_id}");
    let raw_file = find_file_with_prefix(&tmp_dir, &prefix)
        .map_err(|_| "Downloaded audio file not found".to_string())?;

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

    let title_stdout = run_ytdlp(&app, title_args)
        .await
        .unwrap_or_else(|_| "audio".to_string());
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
        _      => {}
    }

    ffmpeg_args.push(output_str.clone());

    let args_ref: Vec<&str> = ffmpeg_args.iter().map(|s| s.as_str()).collect();
    let ffmpeg_result = run_ffmpeg(&app, args_ref).await;
    let _ = std::fs::remove_file(&raw_file);
    ffmpeg_result?;

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
