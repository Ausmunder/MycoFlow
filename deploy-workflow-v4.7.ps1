# Sopp Tracker Workflow v4.7.0 Deployment Script
# Deploys backend changes to Home Assistant via SMB (k:\)

param(
    [switch]$SkipMigration = $false,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🍄 Sopp Tracker Workflow v4.7.0 Deployment" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$LocalBackend = "d:\Sopptracker\backend"
$HaBackend = "k:\sopp-tracker\backend"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

# Check if HA is accessible
Write-Host "🔍 Checking Home Assistant access..." -ForegroundColor Yellow
if (-not (Test-Path "k:\")) {
    Write-Host "❌ K:\ drive not accessible. Is SMB mounted?" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $HaBackend)) {
    Write-Host "❌ HA backend path not found: $HaBackend" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Home Assistant accessible" -ForegroundColor Green
Write-Host ""

# Create backup
Write-Host "📦 Creating backup of current backend..." -ForegroundColor Yellow
$BackupDir = "$HaBackend\.backup-$Timestamp"

if (-not $DryRun) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Copy-Item "$HaBackend\app\main.py" "$BackupDir\" -ErrorAction SilentlyContinue
    Copy-Item "$HaBackend\app\models.py" "$BackupDir\" -ErrorAction SilentlyContinue
    Write-Host "✅ Backup created: $BackupDir" -ForegroundColor Green
} else {
    Write-Host "[DRY RUN] Would create backup in: $BackupDir" -ForegroundColor Gray
}
Write-Host ""

# Deploy updated files
Write-Host "📤 Deploying updated backend files..." -ForegroundColor Yellow

$FilesToDeploy = @(
    @{Source="app\main.py"; Dest="app\main.py"; Required=$true},
    @{Source="app\models.py"; Dest="app\models.py"; Required=$true},
    @{Source="app\routers\workflow.py"; Dest="app\routers\workflow.py"; Required=$true; New=$true},
    @{Source="app\utils\workflow_predictor.py"; Dest="app\utils\workflow_predictor.py"; Required=$true; New=$true},
    @{Source="scripts\migrate_workflow_v4_7.sql"; Dest="scripts\migrate_workflow_v4_7.sql"; Required=$false; New=$true},
    @{Source="scripts\run_migration.py"; Dest="scripts\run_migration.py"; Required=$false; New=$true}
)

$deployCount = 0
foreach ($file in $FilesToDeploy) {
    $sourcePath = Join-Path $LocalBackend $file.Source
    $destPath = Join-Path $HaBackend $file.Dest
    $destDir = Split-Path $destPath -Parent

    if (-not (Test-Path $sourcePath)) {
        if ($file.Required) {
            Write-Host "❌ Required file not found: $sourcePath" -ForegroundColor Red
            exit 1
        } else {
            Write-Host "⚠️  Optional file not found: $sourcePath (skipping)" -ForegroundColor DarkYellow
            continue
        }
    }

    # Create destination directory if needed
    if (-not (Test-Path $destDir)) {
        if (-not $DryRun) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
    }

    $action = if ($file.New) { "NEW" } else { "UPDATE" }
    $icon = if ($file.New) { "➕" } else { "🔄" }

    if (-not $DryRun) {
        Copy-Item $sourcePath $destPath -Force
        Write-Host "$icon [$action] $($file.Dest)" -ForegroundColor Green
    } else {
        Write-Host "[DRY RUN] $icon [$action] $($file.Dest)" -ForegroundColor Gray
    }
    $deployCount++
}

Write-Host "✅ Deployed $deployCount files" -ForegroundColor Green
Write-Host ""

# Run database migration
if (-not $SkipMigration) {
    Write-Host "🗄️  Running database migration..." -ForegroundColor Yellow

    $migrationScript = Join-Path $HaBackend "scripts\run_migration.py"

    if (Test-Path $migrationScript) {
        if (-not $DryRun) {
            Write-Host "   Executing: python $migrationScript" -ForegroundColor Gray

            # Try to run migration
            try {
                # Change to backend directory
                Push-Location $HaBackend

                # Run migration
                python "scripts\run_migration.py"

                Pop-Location
                Write-Host "✅ Migration completed successfully" -ForegroundColor Green
            } catch {
                Pop-Location
                Write-Host "⚠️  Migration failed: $_" -ForegroundColor Red
                Write-Host "   You may need to run it manually on HA" -ForegroundColor Yellow
                Write-Host "   Command: python $migrationScript" -ForegroundColor Yellow
            }
        } else {
            Write-Host "[DRY RUN] Would run: python $migrationScript" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠️  Migration script not found, skipping" -ForegroundColor Yellow
    }
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping migration (use -SkipMigration:`$false to run)" -ForegroundColor Yellow
    Write-Host ""
}

# Check backend version
Write-Host "🔍 Verifying deployment..." -ForegroundColor Yellow

$mainPyPath = Join-Path $HaBackend "app\main.py"
if (Test-Path $mainPyPath) {
    $content = Get-Content $mainPyPath -Raw
    if ($content -match 'version="4\.7\.0"') {
        Write-Host "✅ Backend version: 4.7.0" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Version check failed - check main.py" -ForegroundColor Yellow
    }
}

# Check if workflow router exists
$workflowRouter = Join-Path $HaBackend "app\routers\workflow.py"
if (Test-Path $workflowRouter) {
    Write-Host "✅ Workflow router deployed" -ForegroundColor Green
} else {
    Write-Host "❌ Workflow router missing!" -ForegroundColor Red
}

Write-Host ""

# Instructions for restart
Write-Host "⚠️  IMPORTANT: Backend service needs restart!" -ForegroundColor Yellow
Write-Host ""
Write-Host "To restart backend on Home Assistant:" -ForegroundColor Cyan
Write-Host "  Option 1 (Docker): docker-compose -f k:\sopp-tracker\docker-compose.yml restart" -ForegroundColor White
Write-Host "  Option 2 (SSH): ssh user@192.168.1.251 'cd /config/sopp-tracker && docker-compose restart'" -ForegroundColor White
Write-Host "  Option 3 (HA UI): Restart addon/container from Home Assistant UI" -ForegroundColor White
Write-Host ""

# Summary
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   - Backend files deployed: $deployCount" -ForegroundColor White
Write-Host "   - Backup location: $BackupDir" -ForegroundColor White
Write-Host "   - Version: 4.7.0" -ForegroundColor White
Write-Host "   - New endpoints: /api/batches/{id}/workflow" -ForegroundColor White
Write-Host ""

if ($DryRun) {
    Write-Host "🔍 DRY RUN COMPLETE - No changes were made" -ForegroundColor Yellow
    Write-Host "   Run without -DryRun to deploy" -ForegroundColor Yellow
} else {
    Write-Host "✅ Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Restart backend service (see commands above)" -ForegroundColor White
    Write-Host "   2. Test API: http://192.168.1.251:8000/" -ForegroundColor White
    Write-Host "   3. Check version returns 4.7.0" -ForegroundColor White
    Write-Host "   4. Test workflow endpoint: /api/batches/1/workflow" -ForegroundColor White
}

Write-Host ""
Write-Host "📚 Documentation: d:\Sopptracker\WORKFLOW-DEPLOYMENT.md" -ForegroundColor Cyan

# Rollback instructions
Write-Host ""
Write-Host "🔙 Rollback (if needed):" -ForegroundColor DarkYellow
Write-Host "   Copy-Item '$BackupDir\*' '$HaBackend\app\' -Force" -ForegroundColor Gray
