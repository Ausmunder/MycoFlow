# Hot reload backend without rebuild
# Uses docker exec to copy files and restart uvicorn

$ErrorActionPreference = "Stop"

Write-Host "Hot Reloading Backend..."
Write-Host ""

# Check if we can access the container
try {
    docker exec mycoflow echo "Container accessible" | Out-Null
} catch {
    Write-Host "ERROR: Cannot access mycoflow container"
    Write-Host "Is the container running? Check with: docker ps"
    exit 1
}

Write-Host "OK: Container accessible"

# Copy new files into running container
Write-Host "Copying new files into container..."

# Copy workflow router
docker cp "k:\mycoflow\backend\app\routers\workflow.py" mycoflow:/app/app/routers/workflow.py
Write-Host "  Copied: workflow.py"

# Copy workflow predictor
docker cp "k:\mycoflow\backend\app\utils\workflow_predictor.py" mycoflow:/app/app/utils/workflow_predictor.py
Write-Host "  Copied: workflow_predictor.py"

# Copy migration scripts
docker cp "k:\mycoflow\backend\scripts\run_migration.py" mycoflow:/app/scripts/run_migration.py
Write-Host "  Copied: run_migration.py"

Write-Host "OK: Files copied"
Write-Host ""

# Run migration
Write-Host "Running database migration..."
docker exec mycoflow python scripts/run_migration.py

Write-Host ""
Write-Host "Restarting container to reload Python modules..."
docker restart mycoflow

Write-Host "Waiting for container to be ready..."
Start-Sleep -Seconds 8

# Test API
Write-Host ""
Write-Host "Testing API..."
$response = curl.exe -s http://192.168.1.251:8000/
Write-Host $response

if ($response -match '"version":"4.7.0"') {
    Write-Host ""
    Write-Host "SUCCESS! Backend is now running v4.7.0" -ForegroundColor Green
    Write-Host ""
    Write-Host "Test workflow endpoint:"
    Write-Host "  curl http://192.168.1.251:8000/api/batches/1/workflow"
} else {
    Write-Host ""
    Write-Host "WARNING: Version not updated. Check logs:" -ForegroundColor Yellow
    Write-Host "  docker logs mycoflow"
}
