# Sopp Tracker Workflow v4.7.0 Deployment Script
# Deploys backend changes to Home Assistant via SMB (k:)

$ErrorActionPreference = "Stop"

Write-Host "Sopp Tracker Workflow v4.7.0 Deployment"
Write-Host "========================================"
Write-Host ""

# Configuration
$LocalBackend = "d:\Sopptracker\backend"
$HaBackend = "k:\sopp-tracker\backend"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

# Check if HA is accessible
Write-Host "Checking Home Assistant access..."
if (-not (Test-Path "k:\")) {
    Write-Host "ERROR: K:\ drive not accessible. Is SMB mounted?"
    exit 1
}

if (-not (Test-Path $HaBackend)) {
    Write-Host "ERROR: HA backend path not found: $HaBackend"
    exit 1
}

Write-Host "OK: Home Assistant accessible"
Write-Host ""

# Create backup
Write-Host "Creating backup of current backend..."
$BackupDir = "$HaBackend\.backup-$Timestamp"
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
Copy-Item "$HaBackend\app\main.py" "$BackupDir\" -ErrorAction SilentlyContinue
Copy-Item "$HaBackend\app\models.py" "$BackupDir\" -ErrorAction SilentlyContinue
Write-Host "OK: Backup created: $BackupDir"
Write-Host ""

# Deploy updated files
Write-Host "Deploying updated backend files..."

$FilesToDeploy = @(
    @{Source="app\main.py"; Dest="app\main.py"},
    @{Source="app\models.py"; Dest="app\models.py"},
    @{Source="app\routers\workflow.py"; Dest="app\routers\workflow.py"},
    @{Source="app\utils\workflow_predictor.py"; Dest="app\utils\workflow_predictor.py"},
    @{Source="scripts\migrate_workflow_v4_7.sql"; Dest="scripts\migrate_workflow_v4_7.sql"},
    @{Source="scripts\run_migration.py"; Dest="scripts\run_migration.py"}
)

$deployCount = 0
foreach ($file in $FilesToDeploy) {
    $sourcePath = Join-Path $LocalBackend $file.Source
    $destPath = Join-Path $HaBackend $file.Dest
    $destDir = Split-Path $destPath -Parent

    if (-not (Test-Path $sourcePath)) {
        Write-Host "WARNING: File not found: $sourcePath (skipping)"
        continue
    }

    # Create destination directory if needed
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }

    Copy-Item $sourcePath $destPath -Force
    Write-Host "  Deployed: $($file.Dest)"
    $deployCount++
}

Write-Host "OK: Deployed $deployCount files"
Write-Host ""

# Run database migration
Write-Host "Running database migration..."
$migrationScript = Join-Path $HaBackend "scripts\run_migration.py"

if (Test-Path $migrationScript) {
    try {
        Push-Location $HaBackend
        python "scripts\run_migration.py"
        Pop-Location
        Write-Host "OK: Migration completed successfully"
    } catch {
        Pop-Location
        Write-Host "WARNING: Migration failed: $_"
        Write-Host "You may need to run it manually"
    }
} else {
    Write-Host "WARNING: Migration script not found"
}
Write-Host ""

# Verify deployment
Write-Host "Verifying deployment..."

$mainPyPath = Join-Path $HaBackend "app\main.py"
if (Test-Path $mainPyPath) {
    $content = Get-Content $mainPyPath -Raw
    if ($content -match 'version="4\.7\.0"') {
        Write-Host "OK: Backend version: 4.7.0"
    } else {
        Write-Host "WARNING: Version check failed"
    }
}

$workflowRouter = Join-Path $HaBackend "app\routers\workflow.py"
if (Test-Path $workflowRouter) {
    Write-Host "OK: Workflow router deployed"
} else {
    Write-Host "ERROR: Workflow router missing!"
}

Write-Host ""
Write-Host "Deployment Complete!"
Write-Host ""
Write-Host "Summary:"
Write-Host "  - Files deployed: $deployCount"
Write-Host "  - Backup: $BackupDir"
Write-Host "  - Version: 4.7.0"
Write-Host ""
Write-Host "IMPORTANT: Restart backend service!"
Write-Host "  Command: docker-compose -f k:\sopp-tracker\docker-compose.yml restart"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Restart backend (see command above)"
Write-Host "  2. Test API: http://192.168.1.251:8000/"
Write-Host "  3. Check workflow endpoint: http://192.168.1.251:8000/api/batches/1/workflow"
Write-Host ""
