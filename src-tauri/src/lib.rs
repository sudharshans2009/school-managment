mod csv_export;
mod settings_db;
mod system_tray;
mod notifications;
mod shortcuts;
mod updater;
mod file_system;

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

            // Setup system tray
            if let Err(e) = system_tray::create_system_tray(&app.handle()) {
                log::error!("Failed to create system tray: {}", e);
            }

            // Register global shortcuts
            if let Err(e) = shortcuts::register_shortcuts(&app.handle()) {
                log::error!("Failed to register shortcuts: {}", e);
            }

            Ok(())
        })
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
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
            // System tray commands
            system_tray::show_in_tray,
            system_tray::hide_in_tray,
            // Notification commands
            notifications::send_notification,
            notifications::send_notification_with_icon,
            notifications::request_notification_permission,
            // Shortcut commands
            shortcuts::toggle_window,
            shortcuts::quick_search,
            shortcuts::quick_attendance,
            // Updater commands
            updater::check_for_updates,
            updater::install_update,
            updater::get_app_version,
            // File system commands
            file_system::save_file,
            file_system::read_file,
            file_system::get_file_info,
            file_system::select_file_dialog,
            file_system::select_folder_dialog,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
