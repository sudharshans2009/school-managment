use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExportSettings {
    pub export_directory: String,
    pub auto_open: bool,
    pub include_timestamp: bool,
}

impl Default for ExportSettings {
    fn default() -> Self {
        // Default to Documents/SchoolManagement/Exports
        let default_dir = if let Some(doc_dir) = dirs::document_dir() {
            doc_dir
                .join("SchoolManagement")
                .join("Exports")
                .to_string_lossy()
                .to_string()
        } else {
            "./exports".to_string()
        };

        Self {
            export_directory: default_dir,
            auto_open: false,
            include_timestamp: true,
        }
    }
}

pub struct SettingsDatabase {
    conn: Mutex<Connection>,
}

impl SettingsDatabase {
    pub fn new(app: &AppHandle) -> Result<Self> {
        let app_dir = app
            .path()
            .app_data_dir()
            .expect("Failed to get app data directory");

        std::fs::create_dir_all(&app_dir).expect("Failed to create app data directory");

        let db_path = app_dir.join("settings.db");
        let conn = Connection::open(db_path)?;

        // Create tables
        conn.execute(
            "CREATE TABLE IF NOT EXISTS export_settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                export_directory TEXT NOT NULL,
                auto_open INTEGER NOT NULL,
                include_timestamp INTEGER NOT NULL
            )",
            [],
        )?;

        // Insert default settings if not exists
        conn.execute(
            "INSERT OR IGNORE INTO export_settings (id, export_directory, auto_open, include_timestamp)
             VALUES (1, ?1, ?2, ?3)",
            params![
                ExportSettings::default().export_directory,
                ExportSettings::default().auto_open as i32,
                ExportSettings::default().include_timestamp as i32,
            ],
        )?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    pub fn get_export_settings(&self) -> Result<ExportSettings> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT export_directory, auto_open, include_timestamp FROM export_settings WHERE id = 1"
        )?;

        let settings = stmt.query_row([], |row| {
            Ok(ExportSettings {
                export_directory: row.get(0)?,
                auto_open: row.get::<_, i32>(1)? != 0,
                include_timestamp: row.get::<_, i32>(2)? != 0,
            })
        })?;

        Ok(settings)
    }

    pub fn update_export_settings(&self, settings: &ExportSettings) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE export_settings SET 
                export_directory = ?1,
                auto_open = ?2,
                include_timestamp = ?3
             WHERE id = 1",
            params![
                &settings.export_directory,
                settings.auto_open as i32,
                settings.include_timestamp as i32,
            ],
        )?;
        Ok(())
    }
}

// Global state management
use once_cell::sync::OnceCell;

static SETTINGS_DB: OnceCell<SettingsDatabase> = OnceCell::new();

pub fn init_settings_db(app: &AppHandle) -> Result<()> {
    SETTINGS_DB
        .set(SettingsDatabase::new(app)?)
        .map_err(|_| rusqlite::Error::InvalidQuery)?;
    Ok(())
}

pub async fn get_export_settings(app: &AppHandle) -> Result<ExportSettings, String> {
    if SETTINGS_DB.get().is_none() {
        init_settings_db(app).map_err(|e| e.to_string())?;
    }

    SETTINGS_DB
        .get()
        .ok_or("Database not initialized")?
        .get_export_settings()
        .map_err(|e| e.to_string())
}

// Tauri commands for settings management
#[tauri::command]
pub async fn get_settings(app: AppHandle) -> Result<ExportSettings, String> {
    get_export_settings(&app).await
}

#[tauri::command]
pub async fn update_settings(app: AppHandle, settings: ExportSettings) -> Result<(), String> {
    if SETTINGS_DB.get().is_none() {
        init_settings_db(&app).map_err(|e| e.to_string())?;
    }

    SETTINGS_DB
        .get()
        .ok_or("Database not initialized")?
        .update_export_settings(&settings)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn reset_settings(app: AppHandle) -> Result<ExportSettings, String> {
    let default_settings = ExportSettings::default();
    update_settings(app.clone(), default_settings.clone()).await?;
    Ok(default_settings)
}

#[tauri::command]
pub async fn select_export_directory(_app: AppHandle) -> Result<Option<String>, String> {
    // For now, return None - folder picker requires tauri-plugin-dialog
    // Users can manually type the path in the settings
    // TODO: Add tauri-plugin-dialog for native folder picker
    Ok(None)
}
