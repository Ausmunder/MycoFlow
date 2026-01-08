# Run database migration for spawn_contaminated_units and bag_contaminated_units
$ErrorActionPreference = "Stop"

Write-Host "Running database migration for spawn/bag contaminated units..."
Write-Host ""

# Run migration inside Docker container
docker exec sopp-tracker python scripts/run_spawn_bag_migration.py

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS! Migration completed" -ForegroundColor Green
    Write-Host ""
    Write-Host "New columns added:"
    Write-Host "  - spawn_contaminated_units"
    Write-Host "  - bag_contaminated_units"
    Write-Host ""
    Write-Host "Backend restart recommended:"
    Write-Host "  docker-compose restart sopp-tracker"
} else {
    Write-Host ""
    Write-Host "ERROR: Migration failed" -ForegroundColor Red
    Write-Host "Check Docker logs: docker logs sopp-tracker"
}
