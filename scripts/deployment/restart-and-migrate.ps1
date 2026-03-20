# Restart backend and run migrations
$ErrorActionPreference = "Stop"

Write-Host "Restarting MycoFlow Backend and running migrations..." -ForegroundColor Cyan
Write-Host ""

# Restart container
Write-Host "1. Restarting container..."
docker-compose -f "k:\mycoflow\docker-compose.yml" restart mycoflow

Write-Host "2. Waiting for container to be ready..."
Start-Sleep -Seconds 5

# Run migrations
Write-Host "3. Running database migrations..."
docker exec mycoflow python scripts/run_all_migrations.py

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS! Backend restarted and migrations completed" -ForegroundColor Green
    Write-Host ""
    Write-Host "Changes applied:"
    Write-Host "  ✓ spawn_contaminated_units column"
    Write-Host "  ✓ bag_contaminated_units column"
    Write-Host "  ✓ bag_antall_bager column"
    Write-Host ""
    Write-Host "Backend is ready at: http://192.168.1.251:8000"
} else {
    Write-Host ""
    Write-Host "ERROR: Migration failed" -ForegroundColor Red
    Write-Host 'Check logs: docker logs mycoflow'
}
