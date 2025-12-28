use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

// Discord Application ID - Replace with your actual Discord Application ID
const DISCORD_APP_ID: &str = "1454860155937357982"; // TODO: Replace with actual ID

// Global Discord client
static DISCORD_CLIENT: Lazy<Mutex<Option<Arc<Mutex<DiscordIpcClient>>>>> =
    Lazy::new(|| Mutex::new(None));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordPresenceData {
    pub state: String,
    pub details: String,
    pub large_image_key: Option<String>,
    pub large_image_text: Option<String>,
    pub small_image_key: Option<String>,
    pub small_image_text: Option<String>,
    pub start_timestamp: Option<i64>,
}

/// Initialize Discord RPC connection
#[tauri::command]
pub fn init_discord_rpc() -> Result<String, String> {
    let mut global_client = DISCORD_CLIENT.lock().map_err(|e| e.to_string())?;

    // If already initialized, return success
    if global_client.is_some() {
        return Ok("Discord RPC already initialized".to_string());
    }

    // Create a new Discord IPC client
    let mut client = DiscordIpcClient::new(DISCORD_APP_ID)
        .map_err(|e| format!("Failed to create Discord client: {}", e))?;

    // Connect to Discord
    client
        .connect()
        .map_err(|e| format!("Failed to connect to Discord: {}", e))?;

    *global_client = Some(Arc::new(Mutex::new(client)));

    log::info!("Discord RPC initialized successfully");
    Ok("Discord RPC initialized successfully".to_string())
}

/// Update Discord presence
#[tauri::command]
pub fn update_discord_presence(presence_data: DiscordPresenceData) -> Result<String, String> {
    let global_client = DISCORD_CLIENT.lock().map_err(|e| e.to_string())?;

    let client_arc = global_client
        .as_ref()
        .ok_or_else(|| "Discord RPC not initialized".to_string())?;

    let mut client = client_arc.lock().map_err(|e| e.to_string())?;

    // Build activity
    let mut activity_builder = activity::Activity::new()
        .state(&presence_data.state)
        .details(&presence_data.details);

    // Add assets if provided
    if let Some(large_image) = &presence_data.large_image_key {
        let mut assets = activity::Assets::new().large_image(large_image);

        if let Some(large_text) = &presence_data.large_image_text {
            assets = assets.large_text(large_text);
        }

        if let Some(small_image) = &presence_data.small_image_key {
            assets = assets.small_image(small_image);

            if let Some(small_text) = &presence_data.small_image_text {
                assets = assets.small_text(small_text);
            }
        }

        activity_builder = activity_builder.assets(assets);
    }

    // Add timestamp if provided
    if let Some(timestamp) = presence_data.start_timestamp {
        let timestamps = activity::Timestamps::new().start(timestamp);
        activity_builder = activity_builder.timestamps(timestamps);
    }

    // Set the activity
    client
        .set_activity(activity_builder)
        .map_err(|e| format!("Failed to set Discord activity: {}", e))?;

    log::info!("Discord presence updated successfully");
    Ok("Discord presence updated".to_string())
}

/// Clear Discord presence
#[tauri::command]
pub fn clear_discord_presence() -> Result<String, String> {
    let global_client = DISCORD_CLIENT.lock().map_err(|e| e.to_string())?;

    let client_arc = global_client
        .as_ref()
        .ok_or_else(|| "Discord RPC not initialized".to_string())?;

    let mut client = client_arc.lock().map_err(|e| e.to_string())?;

    client
        .clear_activity()
        .map_err(|e| format!("Failed to clear Discord activity: {}", e))?;

    log::info!("Discord presence cleared");
    Ok("Discord presence cleared".to_string())
}

/// Disconnect Discord RPC
#[tauri::command]
pub fn disconnect_discord_rpc() -> Result<String, String> {
    let mut global_client = DISCORD_CLIENT.lock().map_err(|e| e.to_string())?;

    if let Some(client_arc) = global_client.take() {
        // Use Arc::try_unwrap to get ownership if possible
        match Arc::try_unwrap(client_arc) {
            Ok(mutex) => {
                let mut client = mutex.into_inner().map_err(|e| e.to_string())?;
                
                // First clear the activity
                let _ = client.clear_activity();
                
                // Then close the connection
                client
                    .close()
                    .map_err(|e| format!("Failed to close Discord connection: {}", e))?;

                log::info!("Discord RPC disconnected successfully");
                Ok("Discord RPC disconnected".to_string())
            }
            Err(arc) => {
                // If Arc has multiple strong references, just clear it from global state
                // The client will be cleaned up when all references are dropped
                log::warn!("Discord RPC had multiple references, removed from global state");
                Ok("Discord RPC disconnected (references remain)".to_string())
            }
        }
    } else {
        log::info!("Discord RPC was not connected");
        Ok("Discord RPC was not connected".to_string())
    }
}

/// Check if Discord RPC is connected
#[tauri::command]
pub fn is_discord_connected() -> Result<bool, String> {
    let global_client = DISCORD_CLIENT.lock().map_err(|e| e.to_string())?;
    Ok(global_client.is_some())
}
