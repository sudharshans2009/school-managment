# Tauri Build Script (Windows)
Write-Host "🏗️  Building Tauri application for production..." -ForegroundColor Green
Write-Host "📦 Using Bun as package manager"
Write-Host "🌐 Production URL: https://sms.sudharshans.me"
Write-Host "📡 API Endpoint: https://sms.sudharshans.me/api"
Write-Host ""

# Set production environment
$env:NODE_ENV = "production"
$env:TAURI_BUILD = "true"

Write-Host "Step 1: Building Tauri application..." -ForegroundColor Yellow
bun run tauri:build

Write-Host ""
Write-Host "✅ Build complete!" -ForegroundColor Green
Write-Host "📦 Installers are in: src-tauri\target\release\bundle\"
Write-Host ""
