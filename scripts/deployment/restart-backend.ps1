# Restart backend and run migration
$ErrorActionPreference = "Stop"

Write-Host "Restarting MycoFlow Backend..."
Write-Host ""

# Check if Docker is running
try {
    docker ps | Out-Null
} catch {
    Write-Host "ERROR: Docker is not running or not accessible"
    Write-Host "Please start Docker Desktop or check Docker service"
    exit 1
}

# Restart the backend container
Write-Host "Restarting container..."
docker-compose -f "k:\mycoflow\docker-compose.yml" restart mycoflow

Write-Host "Waiting for container to be ready..."
Start-Sleep -Seconds 5

# Run migration inside container
Write-Host "Running database migration inside container..."
docker exec mycoflow python scripts/run_migration.py

Write-Host ""
Write-Host "Backend restarted and migration completed!"
Write-Host ""
Write-Host "Test the API:"
Write-Host "  curl http://192.168.1.251:8000/"
Write-Host "  curl http://192.168.1.251:8000/api/batches/1/workflow"
Write-Host ""
Write-Host "View logs:"
Write-Host "  docker logs -f mycoflow"
Write-Host ""
