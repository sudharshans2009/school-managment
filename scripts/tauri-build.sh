#!/bin/bash

# Tauri Build Script
echo "🏗️  Building Tauri application for production..."
echo "📦 Using Bun as package manager"
echo "🌐 Production URL: https://sms.sudharshans.me"
echo "📡 API Endpoint: https://sms.sudharshans.me/api"
echo ""

# Set production environment
export NODE_ENV=production
export TAURI_BUILD=true

echo "Step 1: Building Next.js with static export..."
bun run tauri:build

echo ""
echo "✅ Build complete!"
echo "📦 Installers are in: src-tauri/target/release/bundle/"
echo ""
