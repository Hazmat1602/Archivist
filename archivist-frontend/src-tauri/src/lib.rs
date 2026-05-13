use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

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

fn legacy_config_path() -> Option<PathBuf> {
    dirs::config_dir().map(|d| d.join("Archivist").join("config.json"))
}

fn read_config_from(path: &PathBuf) -> Option<AppConfig> {
    let content = fs::read_to_string(path).ok()?;
    let config: AppConfig = serde_json::from_str(&content).ok()?;
    if config.server_url.is_some() {
        Some(config)
    } else {
        None
    }
}

fn write_config(path: &PathBuf, config: &AppConfig) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let content = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_config(app: tauri::AppHandle) -> AppConfig {
    let primary = config_path(&app);
    if let Some(config) = read_config_from(&primary) {
        return config;
    }
    if let Some(legacy) = legacy_config_path() {
        if let Some(config) = read_config_from(&legacy) {
            let _ = write_config(&primary, &config);
            return config;
        }
    }
    AppConfig::default()
}

#[tauri::command]
fn save_config(app: tauri::AppHandle, server_url: String) -> Result<AppConfig, String> {
    let config = AppConfig {
        server_url: Some(server_url),
    };
    write_config(&config_path(&app), &config)?;
    if let Some(legacy) = legacy_config_path() {
        let _ = write_config(&legacy, &config);
    }
    Ok(config)
}

#[tauri::command]
fn get_config_path(app: tauri::AppHandle) -> String {
    config_path(&app).to_string_lossy().to_string()
}


#[tauri::command]
async fn save_download_file(
    app: tauri::AppHandle,
    file_name: String,
    bytes: Vec<u8>,
) -> Result<bool, String> {
    let (tx, rx) = std::sync::mpsc::channel();

    app.dialog()
        .file()
        .set_file_name(&file_name)
        .save_file(move |path| {
            let _ = tx.send(path);
        });

    let selected_path = rx.recv().map_err(|e| e.to_string())?;
    let Some(file_path) = selected_path else {
        return Ok(false);
    };

    let path = file_path.into_path().map_err(|e| e.to_string())?;
    fs::write(&path, &bytes).map_err(|e| e.to_string())?;
    Ok(true)
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            get_config,
            save_config,
            get_config_path,
            save_download_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
