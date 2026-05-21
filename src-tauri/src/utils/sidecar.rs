use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;
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

/// Runs yt-dlp sidecar with the given arguments and returns stdout.
pub async fn run_ytdlp(app: &AppHandle, args: Vec<String>) -> Result<String, String> {
    let output = app
        .shell()
        .sidecar("yt-dlp")
        .map_err(|e| format!("yt-dlp sidecar error: {e}"))?
        .args(args)
        .output()
        .await
        .map_err(|e| format!("yt-dlp execution error: {e}"))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

/// Runs ffmpeg sidecar with the given arguments.
pub async fn run_ffmpeg(app: &AppHandle, args: Vec<&str>) -> Result<String, String> {
    let output = app
        .shell()
        .sidecar("ffmpeg")
        .map_err(|e| format!("ffmpeg sidecar error: {e}"))?
        .args(args)
        .output()
        .await
        .map_err(|e| format!("ffmpeg execution error: {e}"))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        // ffmpeg writes info to stderr even on success; return stderr for progress parsing
        Ok(String::from_utf8_lossy(&output.stderr).to_string())
    }
}


