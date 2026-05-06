use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Default)]
struct AppConfig {
    server_url: Option<String>,
}

fn config_path(app: &tauri::AppHandle) -> PathBuf {
    let config_dir = app
        .path()
        .app_config_dir()
        .expect("failed to resolve app config directory");
    fs::create_dir_all(&config_dir).ok();
    config_dir.join("config.json")
}

#[tauri::command]
fn get_config(app: tauri::AppHandle) -> AppConfig {
    let path = config_path(&app);
    match fs::read_to_string(&path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => AppConfig::default(),
    }
}

#[tauri::command]
fn save_config(app: tauri::AppHandle, server_url: String) -> Result<AppConfig, String> {
    let path = config_path(&app);
    let config = AppConfig {
        server_url: Some(server_url),
    };
    let content = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(config)
}

#[tauri::command]
fn get_config_path(app: tauri::AppHandle) -> String {
    config_path(&app).to_string_lossy().to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_config,
            save_config,
            get_config_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
