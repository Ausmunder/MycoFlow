# Trigger uvicorn reload by touching a file
# Uvicorn watches for file changes when --reload is enabled

$ErrorActionPreference = "Stop"

Write-Host "Triggering backend reload..."
Write-Host ""

# Touch main.py to trigger reload
$mainPy = "k:\sopp-tracker\backend\app\main.py"

if (Test-Path $mainPy) {
    Write-Host "Touching main.py to trigger reload..."

    # Read and write back to update timestamp
    $content = Get-Content $mainPy -Raw
    Set-Content $mainPy $content -NoNewline

    Write-Host "OK: File touched"
    Write-Host ""
    Write-Host "Waiting for reload..."
    Start-Sleep -Seconds 5

    # Test API
    Write-Host "Testing API..."
    $response = curl.exe -s http://192.168.1.251:8000/
    Write-Host $response

    if ($response -match '"version":"4.7.0"') {
        Write-Host ""
        Write-Host "SUCCESS! Backend reloaded to v4.7.0" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "INFO: Backend still shows old version" -ForegroundColor Yellow
        Write-Host "Uvicorn might not have --reload enabled"
        Write-Host ""
        Write-Host "Solution: Container needs restart or rebuild"
        Write-Host "Contact HA to run: docker-compose restart sopp-tracker"
    }
} else {
    Write-Host "ERROR: Cannot find $mainPy"
}
