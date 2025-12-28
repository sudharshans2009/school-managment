# Tauri App - School Management System

Native desktop and mobile application for the Amrita Vidyalayam School Management System.

## 🚀 Features

- **Native Performance**: Faster than web version with offline capabilities
- **System Tray**: Background operation (Windows/macOS)
- **Notifications**: System-level alerts for important events
- **Auto-Updates**: Automatic update checking and installation
- **File Operations**: Native file dialogs and CSV exports
- **Keyboard Shortcuts**: Global shortcuts for quick access
- **Cross-Platform**: Windows, macOS, iOS, Android

## 📦 Installation

### Prerequisites

- Rust 1.71+
- Node.js 18+ or Bun
- Platform-specific tools:
  - **Windows**: Visual Studio Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Android**: Android SDK
  - **iOS**: Xcode (macOS only)

### Setup

```bash
# Install dependencies
cd src-tauri
cargo build

# Or build the entire project
bun install
bun run tauri:build
```

## 🛠️ Development

### Running in Development Mode

```bash
# Start development server
bun run tauri:dev
```

### Building for Production

```bash
# Build for current platform
bun run tauri:build

# Build for specific platform
bun run tauri:build -- --target [target]
```

### Available Targets

- **Windows**: `x86_64-pc-windows-msvc`
- **macOS**: `aarch64-apple-darwin`, `x86_64-apple-darwin`
- **Linux**: `x86_64-unknown-linux-gnu`
- **Android**: `android`
- **iOS**: `ios`

## 🏗️ Architecture

```
src-tauri/
├── src/
│   ├── main.rs              # Entry point
│   ├── lib.rs               # Core app logic
│   ├── csv_export.rs        # CSV export functionality
│   ├── settings_db.rs       # Settings database
│   ├── system_tray.rs       # System tray integration
│   ├── notifications.rs     # Notification system
│   ├── shortcuts.rs         # Keyboard shortcuts
│   ├── updater.rs           # Auto-updater
│   └── file_system.rs       # File operations
├── Cargo.toml               # Rust dependencies
├── tauri.conf.json          # Tauri configuration
└── icons/                   # App icons
```

## 📡 Commands

### Notification Commands

- `send_notification(title, body)` - Send system notification
- `send_notification_with_icon(title, body, icon)` - Send with custom icon
- `request_notification_permission()` - Request permission

### File System Commands

- `save_file(filename, content)` - Save file with native dialog
- `read_file(file_path)` - Read file content
- `get_file_info(file_path)` - Get file metadata
- `select_file_dialog()` - Open file picker
- `select_folder_dialog()` - Open folder picker

### Updater Commands

- `check_for_updates()` - Check for available updates
- `install_update()` - Install pending update
- `get_app_version()` - Get current version

### Window Commands

- `toggle_window()` - Toggle window visibility
- `quick_search()` - Trigger quick search
- `quick_attendance()` - Navigate to attendance

### CSV Export Commands

- `export_csv_to_directory(filename, content)` - Export CSV
- `export_csv_batch(files)` - Batch export
- `get_export_directory()` - Get export path
- `open_export_directory()` - Open export folder

### Settings Commands

- `get_settings()` - Get app settings
- `update_settings(settings)` - Update settings
- `reset_settings()` - Reset to defaults
- `select_export_directory()` - Choose export directory

## 🔧 Configuration

### tauri.conf.json

```json
{
  "productName": "School Management System",
  "version": "1.0.0",
  "identifier": "com.amrita.schoolmanagement",
  "plugins": {
    "notification": {
      "identifier": "com.amrita.schoolmanagement.notification"
    },
    "updater": {
      "active": true,
      "dialog": true
    },
    "global-shortcut": {
      "all": true
    }
  }
}
```

## 🔐 Permissions

The app requests the following permissions:

- **Notifications**: System notifications
- **File System**: Read/write access to user-selected files
- **Network**: For updates and data sync
- **Background Execution**: For tray icon and notifications

All permissions are scoped and sandboxed for security.

## 🎨 Icons

Icons are located in `src-tauri/icons/`:

- `32x32.png` - Small icon
- `128x128.png` - Medium icon
- `128x128@2x.png` - Retina icon
- `icon.icns` - macOS icon
- `icon.ico` - Windows icon

## 📱 Platform-Specific Features

### Windows

- System tray integration
- Auto-start with Windows
- Windows Defender SmartScreen signed
- Native notifications

### macOS

- Menu bar integration
- Universal binary (Apple Silicon + Intel)
- TouchBar support
- Spotlight search integration
- Handoff support

### iOS

- Face ID / Touch ID
- Home screen widgets
- Siri shortcuts
- Apple Pencil support
- iCloud sync

### Android

- Material Design UI
- Biometric authentication
- Quick settings tile
- Battery optimization

## 🐛 Debugging

### Enable Logging

```rust
// In lib.rs
app.handle().plugin(
    tauri_plugin_log::Builder::default()
        .level(log::LevelFilter::Debug)
        .build(),
)?;
```

### View Logs

- **Windows**: `%APPDATA%/com.amrita.schoolmanagement/logs`
- **macOS**: `~/Library/Logs/com.amrita.schoolmanagement`
- **Linux**: `~/.local/share/com.amrita.schoolmanagement/logs`

## 🧪 Testing

```bash
# Run Rust tests
cargo test

# Run with debug output
RUST_LOG=debug cargo run
```

## 📦 Building Installers

### Windows (.msi)

```bash
bun run tauri:build
# Output: src-tauri/target/release/bundle/msi/
```

### macOS (.dmg)

```bash
bun run tauri:build
# Output: src-tauri/target/release/bundle/dmg/
```

### Android (.apk)

```bash
bun run tauri:build -- --target android
# Output: src-tauri/gen/android/app/build/outputs/apk/
```

### iOS (.ipa)

```bash
bun run tauri:build -- --target ios
# Output: src-tauri/gen/apple/build/
```

## 🔄 Updates

The app uses Tauri's built-in updater:

1. Checks for updates on startup
2. Downloads in background
3. Prompts user to install
4. Restarts with new version

Update server configuration in `tauri.conf.json`.

## 🛡️ Security

- All apps are code-signed
- Sandboxed file system access
- Secure update channel
- Permission-based feature access
- No telemetry by default

## 📚 Resources

- [Tauri Documentation](https://tauri.app)
- [Project Documentation](../docs/)
- [API Reference](../docs/QUICK_REFERENCE_TAURI.md)
- [User Guide](../docs/USER_GUIDE_ENHANCED_FEATURES.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on all platforms
5. Submit a pull request

## 📄 License

See LICENSE file in the root directory.

## 🆘 Support

- GitHub Issues
- Discord Community
- Email: support@example.com

---

**Version**: 1.0.0  
**Last Updated**: December 25, 2025  
**Platforms**: Windows, macOS, iOS, Android
