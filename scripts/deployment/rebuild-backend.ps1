# Rebuild MycoFlow Backend Container
# Run this from PowerShell on the machine where K:\ is mounted from HA

Write-Host "🍄 Rebuilding MycoFlow Backend..." -ForegroundColor Green
Write-Host ""

Set-Location "K:\mycoflow"

# Step 1: Stop containers
Write-Host "🛑 Stopping containers..." -ForegroundColor Yellow
docker-compose down

# Step 2: Rebuild backend (no cache to ensure fresh build)
Write-Host "🔨 Rebuilding backend..." -ForegroundColor Yellow
docker-compose build --no-cache mycoflow

# Step 3: Start containers
Write-Host "🚀 Starting containers..." -ForegroundColor Yellow
docker-compose up -d

# Step 4: Wait a bit for container to start
Write-Host "⏳ Waiting for containers to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Step 5: Check status
Write-Host ""
Write-Host "📊 Container status:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "📋 Recent logs:" -ForegroundColor Cyan
docker-compose logs --tail=20 mycoflow

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Open MycoFlow frontend" -ForegroundColor White
Write-Host "2. Create test batch with spawn_batch" -ForegroundColor White
Write-Host "3. Click 'Add Units' - should work without 404!" -ForegroundColor White
Write-Host ""
Write-Host "View live logs: docker-compose logs -f mycoflow" -ForegroundColor Yellow
Write-Host "API docs: http://localhost:8000/docs" -ForegroundColor Yellow
