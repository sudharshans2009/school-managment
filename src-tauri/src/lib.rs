mod csv_export;
mod settings_db;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Setup logging in debug mode
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Initialize settings database
            if let Err(e) = settings_db::init_settings_db(&app.handle()) {
                log::error!("Failed to initialize settings database: {}", e);
            }

            Ok(())
        })
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // CSV Export commands
            csv_export::export_csv_to_directory,
            csv_export::export_csv_batch,
            csv_export::get_export_directory,
            csv_export::open_export_directory,
            // Settings commands
            settings_db::get_settings,
            settings_db::update_settings,
            settings_db::reset_settings,
            settings_db::select_export_directory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
