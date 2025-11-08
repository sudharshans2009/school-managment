use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportResult {
    pub success: bool,
    pub file_path: String,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportSettings {
    pub export_directory: String,
    pub auto_open: bool,
    pub include_timestamp: bool,
}

/// Export CSV data to the configured directory
#[tauri::command]
pub async fn export_csv_to_directory(
    app: AppHandle,
    filename: String,
    csv_content: String,
) -> Result<ExportResult, String> {
    // Get export settings from database
    let settings = match crate::settings_db::get_export_settings(&app).await {
        Ok(s) => s,
        Err(e) => {
            return Err(format!("Failed to get export settings: {}", e));
        }
    };

    // Build the full file path
    let export_dir = PathBuf::from(&settings.export_directory);

    // Create directory if it doesn't exist
    if let Err(e) = fs::create_dir_all(&export_dir) {
        return Err(format!("Failed to create export directory: {}", e));
    }

    // Add timestamp to filename if configured
    let final_filename = if settings.include_timestamp {
        let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
        let name_parts: Vec<&str> = filename.rsplitn(2, '.').collect();
        if name_parts.len() == 2 {
            format!("{}_{}.{}", name_parts[1], timestamp, name_parts[0])
        } else {
            format!("{}_{}", filename, timestamp)
        }
    } else {
        filename.clone()
    };

    let file_path = export_dir.join(&final_filename);

    // Write CSV content to file
    match fs::write(&file_path, csv_content.as_bytes()) {
        Ok(_) => {
            let path_str = file_path.to_string_lossy().to_string();

            // Auto-open if configured
            if settings.auto_open {
                #[cfg(target_os = "windows")]
                {
                    let _ = std::process::Command::new("cmd")
                        .args(&["/C", "start", "", &path_str])
                        .spawn();
                }

                #[cfg(target_os = "macos")]
                {
                    let _ = std::process::Command::new("open").arg(&path_str).spawn();
                }

                #[cfg(target_os = "linux")]
                {
                    let _ = std::process::Command::new("xdg-open")
                        .arg(&path_str)
                        .spawn();
                }
            }

            Ok(ExportResult {
                success: true,
                file_path: path_str,
                message: format!("CSV exported successfully to {}", final_filename),
            })
        }
        Err(e) => Err(format!("Failed to write CSV file: {}", e)),
    }
}

/// Export multiple CSV files in a batch
#[tauri::command]
pub async fn export_csv_batch(
    app: AppHandle,
    exports: Vec<(String, String)>, // Vec of (filename, content)
) -> Result<Vec<ExportResult>, String> {
    let mut results = Vec::new();

    for (filename, content) in exports {
        match export_csv_to_directory(app.clone(), filename.clone(), content).await {
            Ok(result) => results.push(result),
            Err(e) => results.push(ExportResult {
                success: false,
                file_path: String::new(),
                message: format!("Failed to export {}: {}", filename, e),
            }),
        }
    }

    Ok(results)
}

/// Get the current export directory
#[tauri::command]
pub async fn get_export_directory(app: AppHandle) -> Result<String, String> {
    match crate::settings_db::get_export_settings(&app).await {
        Ok(settings) => Ok(settings.export_directory),
        Err(e) => Err(format!("Failed to get export directory: {}", e)),
    }
}

/// Open the export directory in file explorer
#[tauri::command]
pub async fn open_export_directory(app: AppHandle) -> Result<(), String> {
    let settings = crate::settings_db::get_export_settings(&app)
        .await
        .map_err(|e| format!("Failed to get export settings: {}", e))?;

    let export_dir = PathBuf::from(&settings.export_directory);

    // Create directory if it doesn't exist
    fs::create_dir_all(&export_dir)
        .map_err(|e| format!("Failed to create export directory: {}", e))?;

    let path_str = export_dir.to_string_lossy().to_string();

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&path_str)
            .spawn()
            .map_err(|e| format!("Failed to open directory: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path_str)
            .spawn()
            .map_err(|e| format!("Failed to open directory: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path_str)
            .spawn()
            .map_err(|e| format!("Failed to open directory: {}", e))?;
    }

    Ok(())
}
