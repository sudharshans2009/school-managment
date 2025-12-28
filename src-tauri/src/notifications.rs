use serde::{Deserialize, Serialize};
use tauri::AppHandle;

#[derive(Debug, Serialize, Deserialize)]
pub struct NotificationPayload {
    pub title: String,
    pub body: String,
    pub icon: Option<String>,
}

#[tauri::command]
pub async fn send_notification(_app: AppHandle, title: String, body: String) -> Result<(), String> {
    // Note: Actual notification sending would use tauri-plugin-notification
    // For now, we'll log the notification
    log::info!("Notification: {} - {}", title, body);
    Ok(())
}

#[tauri::command]
pub async fn send_notification_with_icon(
    _app: AppHandle,
    title: String,
    body: String,
    icon: String,
) -> Result<(), String> {
    log::info!("Notification: {} - {} (icon: {})", title, body, icon);
    Ok(())
}

#[tauri::command]
pub async fn request_notification_permission(_app: AppHandle) -> Result<String, String> {
    // Permission state would be checked here
    Ok("granted".to_string())
}

/// Schedule a notification for attendance reminders
pub async fn schedule_attendance_notification(app: AppHandle) -> Result<(), String> {
    send_notification(
        app,
        "Attendance Reminder".to_string(),
        "Don't forget to mark today's attendance!".to_string(),
    )
    .await
}

/// Send event notification
pub async fn notify_event(
    app: AppHandle,
    event_title: String,
    event_time: String,
) -> Result<(), String> {
    send_notification(
        app,
        "Upcoming Event".to_string(),
        format!("{} at {}", event_title, event_time),
    )
    .await
}

/// Send announcement notification
pub async fn notify_announcement(app: AppHandle, announcement: String) -> Result<(), String> {
    send_notification(app, "New Announcement".to_string(), announcement).await
}
