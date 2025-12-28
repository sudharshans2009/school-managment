use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize)]
pub struct FileInfo {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub modified: u64,
}

#[tauri::command]
pub async fn save_file(
    app: AppHandle,
    filename: String,
    content: String,
) -> Result<String, String> {
    // This would use tauri-plugin-dialog to show save dialog
    // For now, save to app data directory
    
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app directory: {}", e))?;
    
    let file_path = app_dir.join(&filename);
    
    fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write file: {}", e))?;
    
    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn read_file(file_path: String) -> Result<String, String> {
    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    Ok(content)
}

#[tauri::command]
pub async fn get_file_info(file_path: String) -> Result<FileInfo, String> {
    let path = PathBuf::from(&file_path);
    let metadata = fs::metadata(&path)
        .map_err(|e| format!("Failed to get file metadata: {}", e))?;
    
    let modified = metadata.modified()
        .map_err(|e| format!("Failed to get modified time: {}", e))?
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| format!("Failed to convert time: {}", e))?
        .as_secs();
    
    Ok(FileInfo {
        name: path.file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string(),
        path: file_path,
        size: metadata.len(),
        modified,
    })
}

#[tauri::command]
pub async fn select_file_dialog(_app: AppHandle) -> Result<Option<String>, String> {
    // Placeholder for file dialog - would use tauri-plugin-dialog
    log::info!("File dialog requested");
    Ok(None)
}

#[tauri::command]
pub async fn select_folder_dialog(_app: AppHandle) -> Result<Option<String>, String> {
    // Placeholder for folder dialog - would use tauri-plugin-dialog
    log::info!("Folder dialog requested");
    Ok(None)
}
