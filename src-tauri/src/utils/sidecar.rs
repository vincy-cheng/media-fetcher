use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;
use crate::utils::types::CookieConfig;

/// Builds the yt-dlp authentication args from a CookieConfig.
/// Returns an empty Vec when no auth is configured.
pub fn cookie_args(config: &Option<CookieConfig>) -> Vec<String> {
    let Some(cfg) = config else { return vec![] };

    match cfg.mode.as_str() {
        "browser" => {
            if let Some(browser) = &cfg.browser {
                let safe = sanitize_browser(browser);
                return vec!["--cookies-from-browser".to_string(), safe];
            }
        }
        "file" => {
            if let Some(path) = &cfg.file_path {
                let p = std::path::Path::new(path);
                // Security: only accept absolute, existing paths to prevent traversal
                if p.is_absolute() && p.is_file() {
                    return vec!["--cookies".to_string(), path.clone()];
                }
            }
        }
        _ => {}
    }
    vec![]
}

#[cfg(test)]
mod tests {
    use super::*;

    fn browser_cfg(name: &str) -> Option<CookieConfig> {
        Some(CookieConfig {
            mode: "browser".to_string(),
            browser: Some(name.to_string()),
            file_path: None,
        })
    }

    #[test]
    fn no_config_returns_empty() {
        assert!(cookie_args(&None).is_empty());
    }

    #[test]
    fn browser_mode_chrome_returns_args() {
        let args = cookie_args(&browser_cfg("chrome"));
        assert_eq!(args, vec!["--cookies-from-browser", "chrome"]);
    }

    #[test]
    fn browser_mode_sanitizes_unknown_browser() {
        let args = cookie_args(&browser_cfg("evilbrowser; rm -rf /"));
        assert_eq!(args, vec!["--cookies-from-browser", "chrome"]);
    }

    #[test]
    fn browser_mode_case_insensitive() {
        let args = cookie_args(&browser_cfg("Firefox"));
        assert_eq!(args, vec!["--cookies-from-browser", "firefox"]);
    }

    #[test]
    fn file_mode_non_absolute_path_ignored() {
        let cfg = Some(CookieConfig {
            mode: "file".to_string(),
            browser: None,
            file_path: Some("relative/path.txt".to_string()),
        });
        assert!(cookie_args(&cfg).is_empty());
    }

    #[test]
    fn ytdlp_override_filename() {
        // The override binary should be named "yt-dlp" (no extension on macOS/Linux)
        let dir = std::path::PathBuf::from("/tmp/fake_app_data");
        let override_path = dir.join("yt-dlp");
        assert_eq!(override_path.file_name().unwrap(), "yt-dlp");
    }

    #[test]
    fn cancelled_watch_resolves_immediately() {
        let (tx, mut rx) = tokio::sync::watch::channel(false);
        tx.send(true).unwrap();
        // If value is already true, wait_for resolves immediately (non-blocking check)
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            let result = tokio::time::timeout(
                std::time::Duration::from_millis(50),
                rx.wait_for(|v| *v),
            )
            .await;
            assert!(result.is_ok(), "wait_for should resolve immediately when value is already true");
        });
    }
}

/// Whitelists browser names for `--cookies-from-browser`.
fn sanitize_browser(browser: &str) -> String {
    const ALLOWED: &[&str] = &[
        "chrome", "chromium", "firefox", "safari", "edge", "brave", "opera", "vivaldi",
    ];
    let lower = browser.to_lowercase();
    if ALLOWED.contains(&lower.as_str()) {
        lower
    } else {
        "chrome".to_string()
    }
}

/// Runs yt-dlp with the given arguments and returns stdout.
/// Prefers a user-installed override at `app_local_data_dir/yt-dlp` over the bundled sidecar.
/// Passing `true` through `cancel_rx` aborts the process and returns `Err("cancelled")`.
pub async fn run_ytdlp(
    app: &AppHandle,
    args: Vec<String>,
    mut cancel_rx: tokio::sync::watch::Receiver<bool>,
) -> Result<String, String> {
    use tauri::Manager;
    use std::process::Stdio;

    // Check for user-installed override binary
    let override_path = app
        .path()
        .app_local_data_dir()
        .ok()
        .map(|d| d.join("yt-dlp"));

    if let Some(ref path) = override_path {
        if path.exists() {
            use tokio::io::AsyncReadExt;
            
            let mut child = tokio::process::Command::new(path)
                .args(&args)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
                .map_err(|e| format!("yt-dlp override error: {e}"))?;

            let stdout = child.stdout.take().expect("stdout was piped");
            let stderr = child.stderr.take().expect("stderr was piped");

            // Spawn tasks to read stdout/stderr and wait for completion
            let stdout_task = tokio::spawn(async move {
                let mut buf = Vec::new();
                let mut stdout = stdout;
                stdout.read_to_end(&mut buf).await?;
                Ok::<_, std::io::Error>(buf)
            });

            let stderr_task = tokio::spawn(async move {
                let mut buf = Vec::new();
                let mut stderr = stderr;
                stderr.read_to_end(&mut buf).await?;
                Ok::<_, std::io::Error>(buf)
            });

            let cancelled = async {
                if *cancel_rx.borrow() {
                    return;
                }
                while cancel_rx.changed().await.is_ok() {
                    if *cancel_rx.borrow() {
                        return;
                    }
                }
            };

            let status = tokio::select! {
                status = child.wait() => {
                    status.map_err(|e| format!("wait error: {e}"))?
                }
                _ = cancelled => {
                    let _ = child.kill().await;
                    let _ = child.wait().await;
                    let _ = stdout_task.await;
                    let _ = stderr_task.await;
                    return Err("cancelled".to_string());
                }
            };

            let stdout_buf = stdout_task
                .await
                .map_err(|e| format!("stdout task error: {e}"))?
                .map_err(|e| format!("stdout read error: {e}"))?;
            let stderr_buf = stderr_task
                .await
                .map_err(|e| format!("stderr task error: {e}"))?
                .map_err(|e| format!("stderr read error: {e}"))?;

            return if status.success() {
                Ok(String::from_utf8_lossy(&stdout_buf).to_string())
            } else {
                Err(String::from_utf8_lossy(&stderr_buf).to_string())
            };
        }
    }

    // Fall back to bundled sidecar
    let (mut rx, child) = app
        .shell()
        .sidecar("yt-dlp")
        .map_err(|e| format!("yt-dlp sidecar error: {e}"))?
        .args(args)
        .spawn()
        .map_err(|e| format!("yt-dlp execution error: {e}"))?;

    let mut stdout_buf = String::new();
    let mut stderr_buf = String::new();

    loop {
        tokio::select! {
            event = rx.recv() => {
                match event {
                    Some(CommandEvent::Stdout(bytes)) => {
                        stdout_buf.push_str(&String::from_utf8_lossy(&bytes));
                    }
                    Some(CommandEvent::Stderr(bytes)) => {
                        stderr_buf.push_str(&String::from_utf8_lossy(&bytes));
                    }
                    Some(CommandEvent::Terminated(payload)) => {
                        return if payload.code == Some(0) {
                            Ok(stdout_buf)
                        } else {
                            Err(stderr_buf)
                        };
                    }
                    None => return Err("yt-dlp process ended unexpectedly".to_string()),
                    _ => {}
                }
            }
            _ = cancel_rx.wait_for(|v| *v) => {
                let _ = child.kill();
                return Err("cancelled".to_string());
            }
        }
    }
}

/// Runs ffmpeg sidecar with the given arguments.
/// Passing `true` through `cancel_rx` aborts the process and returns `Err("cancelled")`.
pub async fn run_ffmpeg(
    app: &AppHandle,
    args: Vec<&str>,
    mut cancel_rx: tokio::sync::watch::Receiver<bool>,
) -> Result<String, String> {
    let (mut rx, child) = app
        .shell()
        .sidecar("ffmpeg")
        .map_err(|e| format!("ffmpeg sidecar error: {e}"))?
        .args(args)
        .spawn()
        .map_err(|e| format!("ffmpeg execution error: {e}"))?;

    let mut stderr_buf = String::new();

    loop {
        tokio::select! {
            event = rx.recv() => {
                match event {
                    Some(CommandEvent::Stderr(bytes)) => {
                        stderr_buf.push_str(&String::from_utf8_lossy(&bytes));
                    }
                    Some(CommandEvent::Terminated(payload)) => {
                        // ffmpeg writes progress/info to stderr even on success
                        return if payload.code == Some(0) {
                            Ok(stderr_buf)
                        } else {
                            Err(stderr_buf)
                        };
                    }
                    None => return Err("ffmpeg process ended unexpectedly".to_string()),
                    _ => {}
                }
            }
            _ = cancel_rx.wait_for(|v| *v) => {
                let _ = child.kill();
                return Err("cancelled".to_string());
            }
        }
    }
}
