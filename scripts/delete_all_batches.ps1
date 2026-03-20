# Delete all batches and units from MycoFlow
# WARNING: This will permanently delete ALL data!

$API_URL = "http://192.168.1.251:8000"

Write-Host ""
Write-Host "========================================"
Write-Host "  SOPP TRACKER - DELETE ALL BATCHES"
Write-Host "========================================"
Write-Host ""
Write-Host "WARNING: This will delete ALL batches and units!" -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Type 'DELETE ALL' to confirm"

if ($confirm -ne "DELETE ALL") {
    Write-Host ""
    Write-Host "Aborted." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Fetching all batches..." -ForegroundColor Cyan

try {
    $batches = Invoke-RestMethod -Uri "$API_URL/api/batches" -Method Get
    $batchIds = $batches | ForEach-Object { $_.id }

    if ($batchIds.Count -eq 0) {
        Write-Host "No batches to delete." -ForegroundColor Green
        exit
    }

    Write-Host "Found $($batchIds.Count) batches" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Deleting all batches..." -ForegroundColor Cyan

    $body = $batchIds | ConvertTo-Json
    $result = Invoke-RestMethod -Uri "$API_URL/api/batches/bulk-delete" -Method Post -Body $body -ContentType "application/json"

    Write-Host "Successfully deleted $($result.deleted) batches" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verifying deletion..." -ForegroundColor Cyan

    $remaining = Invoke-RestMethod -Uri "$API_URL/api/batches" -Method Get
    Write-Host "Remaining batches: $($remaining.Count)" -ForegroundColor $(if ($remaining.Count -eq 0) { "Green" } else { "Yellow" })

    if ($remaining.Count -eq 0) {
        Write-Host ""
        Write-Host "All batches and units successfully deleted!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Warning: $($remaining.Count) batches still remain" -ForegroundColor Yellow
    }

} catch {
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.Exception
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
