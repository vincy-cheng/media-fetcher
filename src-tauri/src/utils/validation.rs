pub fn is_valid_youtube_url(url: &str) -> bool {
    let patterns = [
        "youtube.com/watch?v=",
        "youtu.be/",
        "youtube.com/shorts/",
        "music.youtube.com/watch?v=",
    ];
    patterns.iter().any(|p| url.contains(p))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_standard_watch_url() {
        assert!(is_valid_youtube_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ"));
    }

    #[test]
    fn accepts_short_url() {
        assert!(is_valid_youtube_url("https://youtu.be/dQw4w9WgXcQ"));
    }

    #[test]
    fn accepts_shorts_url() {
        assert!(is_valid_youtube_url("https://www.youtube.com/shorts/abc123"));
    }

    #[test]
    fn accepts_music_url() {
        assert!(is_valid_youtube_url("https://music.youtube.com/watch?v=abc123"));
    }

    #[test]
    fn rejects_non_youtube_url() {
        assert!(!is_valid_youtube_url("https://vimeo.com/123456"));
    }

    #[test]
    fn rejects_empty_string() {
        assert!(!is_valid_youtube_url(""));
    }
}
