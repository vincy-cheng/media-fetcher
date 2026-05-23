mod commands;
mod utils;

use std::collections::HashMap;
use std::sync::Mutex;
use commands::{
    download::{download_media, cancel_download},
    info::get_video_info,
    preview::extract_preview_audio,
    settings::{get_settings, save_settings},
    tools::{check_tools_status, check_ytdlp_update, update_ytdlp},
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(Mutex::new(HashMap::<String, tokio::sync::watch::Sender<bool>>::new()))
        .invoke_handler(tauri::generate_handler![
            get_video_info,
            extract_preview_audio,
            download_media,
            cancel_download,
            get_settings,
            save_settings,
            check_tools_status,
            check_ytdlp_update,
            update_ytdlp,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
