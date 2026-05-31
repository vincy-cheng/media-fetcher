/// Returns true if the string looks like an HTTP/HTTPS URL.
/// Actual site support is validated by yt-dlp at runtime.
pub fn is_valid_url(url: &str) -> bool {
    url.starts_with("http://") || url.starts_with("https://")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_youtube_url() {
        assert!(is_valid_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ"));
    }

    #[test]
    fn accepts_vimeo_url() {
        assert!(is_valid_url("https://vimeo.com/123456"));
    }

    #[test]
    fn accepts_soundcloud_url() {
        assert!(is_valid_url("https://soundcloud.com/artist/track"));
    }

    #[test]
    fn accepts_http_url() {
        assert!(is_valid_url("http://example.com/video"));
    }

    #[test]
    fn rejects_empty_string() {
        assert!(!is_valid_url(""));
    }

    #[test]
    fn rejects_plain_text() {
        assert!(!is_valid_url("not a url"));
    }
}
