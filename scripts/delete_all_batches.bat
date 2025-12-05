@echo off
REM Delete all batches and units from Sopp Tracker
REM WARNING: This will permanently delete ALL data!

echo.
echo ========================================
echo   SOPP TRACKER - DELETE ALL BATCHES
echo ========================================
echo.
echo WARNING: This will delete ALL batches and units!
echo.

set /p confirm="Type DELETE ALL to confirm: "

if NOT "%confirm%"=="DELETE ALL" (
    echo.
    echo Aborted.
    pause
    exit /b
)

echo.
echo Fetching all batches...
curl -s http://192.168.1.251:8000/api/batches > batches.json

echo.
echo Extracting batch IDs...
powershell -Command "$batches = Get-Content batches.json | ConvertFrom-Json; $ids = $batches | ForEach-Object { $_.id }; Write-Host 'Found' $ids.Count 'batches'; $ids | ConvertTo-Json | Out-File batch_ids.json"

echo.
echo Deleting all batches...
curl -X POST http://192.168.1.251:8000/api/batches/bulk-delete ^
  -H "Content-Type: application/json" ^
  -d @batch_ids.json

echo.
echo.
echo Verifying deletion...
curl -s http://192.168.1.251:8000/api/batches > verify.json
powershell -Command "$remaining = Get-Content verify.json | ConvertFrom-Json; Write-Host 'Remaining batches:' $remaining.Count"

echo.
echo Cleaning up temporary files...
del batches.json batch_ids.json verify.json

echo.
echo Done!
pause
