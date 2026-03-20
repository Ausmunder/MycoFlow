# React v4 Upgrade Script
# Run this in PowerShell from mycoflow-frontend directory

Write-Host "🚀 Upgrading to React v4..." -ForegroundColor Green

# Backup current version
Write-Host "`n📦 Creating backup..." -ForegroundColor Yellow
if (Test-Path "..\mycoflow-frontend-v3-backup") {
    Remove-Item "..\mycoflow-frontend-v3-backup" -Recurse -Force
}
Copy-Item -Recurse . "..\mycoflow-frontend-v3-backup"
Write-Host "✅ Backup created at: ..\mycoflow-frontend-v3-backup" -ForegroundColor Green

# Install Chart.js
Write-Host "`n📦 Installing Chart.js..." -ForegroundColor Yellow
npm install chart.js@^4.4.0
Write-Host "✅ Chart.js installed" -ForegroundColor Green

# Replace files
Write-Host "`n📝 Updating files..." -ForegroundColor Yellow

if (Test-Path "src\App-enhanced.jsx") {
    Copy-Item "src\App-enhanced.jsx" "src\App.jsx" -Force
    Write-Host "✅ App.jsx updated" -ForegroundColor Green
}

if (Test-Path "src\components\Header-enhanced.jsx") {
    Copy-Item "src\components\Header-enhanced.jsx" "src\components\Header.jsx" -Force
    Write-Host "✅ Header.jsx updated" -ForegroundColor Green
}

if (Test-Path "src\index-enhanced.css") {
    Copy-Item "src\index-enhanced.css" "src\index.css" -Force
    Write-Host "✅ index.css updated" -ForegroundColor Green
}

if (Test-Path "package-v4.json") {
    Copy-Item "package-v4.json" "package.json" -Force
    Write-Host "✅ package.json updated" -ForegroundColor Green
}

# Reinstall dependencies
Write-Host "`n📦 Reinstalling dependencies..." -ForegroundColor Yellow
npm install
Write-Host "✅ Dependencies installed" -ForegroundColor Green

Write-Host "`n🎉 Upgrade complete!" -ForegroundColor Green
Write-Host "`n🚀 Start with: npm run dev" -ForegroundColor Cyan
Write-Host "📖 Read UPGRADE_GUIDE_V4.md for details" -ForegroundColor Cyan

# List new features
Write-Host "`n✨ New features:" -ForegroundColor Yellow
Write-Host "  ✅ Inline editing" -ForegroundColor Green
Write-Host "  ✅ Charts (Ctrl+G)" -ForegroundColor Green
Write-Host "  ✅ Export/Import" -ForegroundColor Green
Write-Host "  ✅ Print styling (Ctrl+P)" -ForegroundColor Green
Write-Host "  ✅ Help modal (Ctrl+?)" -ForegroundColor Green
Write-Host "  ✅ PWA support" -ForegroundColor Green
Write-Host "  ✅ Keyboard shortcuts" -ForegroundColor Green

Write-Host "`n⚡ Run 'npm run dev' to start!" -ForegroundColor Cyan
