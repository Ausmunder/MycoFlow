# Workflow Tracking v4.7.0 - Deployment Guide

## Backend Changes

### New Files Created
1. `backend/app/utils/workflow_predictor.py` - AI prediction logic
2. `backend/app/routers/workflow.py` - Workflow API endpoints
3. `backend/scripts/migrate_workflow_v4_7.sql` - SQL migration
4. `backend/scripts/run_migration.py` - Python migration runner

### Modified Files
1. `backend/app/models.py` - Added workflow columns to Batch and StrainStatistics
2. `backend/app/main.py` - Updated version to 4.7.0, added workflow router

### Database Schema Changes

#### Batches Table - New Columns:
```sql
-- Workflow status
workflow_status VARCHAR(50) DEFAULT 'spawning'

-- Spawn stage
spawn_expected_ready_date TIMESTAMP
spawn_actual_ready_date TIMESTAMP

-- Colonization stage
colonization_expected_date TIMESTAMP
colonization_actual_date TIMESTAMP

-- Fruiting stage
fruiting_start_date TIMESTAMP
flush1_expected_date TIMESTAMP
flush1_actual_start_date TIMESTAMP
flush1_harvest_date TIMESTAMP
flush1_expected_kg REAL

-- Flush 2
flush2_expected_date TIMESTAMP
flush2_actual_start_date TIMESTAMP
flush2_harvest_date TIMESTAMP
flush2_expected_kg REAL

-- Flush 3 (optional)
flush3_expected_date TIMESTAMP
flush3_actual_start_date TIMESTAMP
flush3_harvest_date TIMESTAMP
flush3_harvest_kg REAL
```

#### StrainStatistics Table - New Columns:
```sql
avg_spawn_days INTEGER
avg_fruiting_days INTEGER
avg_flush1_days INTEGER
avg_flush2_yield_kg REAL
avg_flushes_per_batch REAL
```

## Deployment Steps

### 1. Deploy Backend to Home Assistant

```bash
# From d:\Sopptracker\
# Copy updated backend to HA
cp -r backend/* k:/sopp-tracker/backend/

# Or use the deploy script if available
.\scripts\deploy-backend-to-ha.sh
```

### 2. Run Database Migration

**Option A: Using Python script (recommended)**
```bash
# SSH into Home Assistant or run locally if DB is accessible
cd /path/to/sopp-tracker/backend
python scripts/run_migration.py
```

**Option B: Using SQL script directly**
```bash
# If using SQLite
sqlite3 /path/to/sopp_tracker.db < scripts/migrate_workflow_v4_7.sql
```

### 3. Restart Backend Service

```bash
# In Home Assistant
# Restart the sopp-tracker backend container/service
docker-compose restart backend
# OR
systemctl restart sopp-tracker-backend
```

### 4. Verify Deployment

**Check API health:**
```bash
curl http://192.168.1.251:8000/
# Should return version: 4.7.0
```

**Check new endpoints:**
```bash
# Get workflow status for batch
curl http://192.168.1.251:8000/api/batches/1/workflow

# Should return workflow predictions and status
```

## New API Endpoints

### GET /api/batches/{batch_id}/workflow
Get current workflow status and predictions for a batch.

**Response:**
```json
{
  "current_stage": "colonizing",
  "current_stage_day": 10,
  "current_stage_expected_days": 21,
  "next_stage": "fruiting",
  "predictions": {
    "colonization_date": "2025-01-05",
    "colonization_days_remaining": 11,
    "flush1_expected_kg": 1.2
  },
  "status": "on_track",
  "available_actions": ["start_fruiting"]
}
```

### POST /api/batches/{batch_id}/workflow/transition
Transition batch to next workflow stage.

**Request:**
```json
{
  "action": "start_colonization",
  "date": "2025-12-03",
  "substrate_type": "Masters Mix",
  "substrate_kg": 5.0,
  "notes": "Healthy mycelium, good coverage"
}
```

**Available actions:**
- `start_colonization` - Move from spawning to colonizing
- `start_fruiting` - Move from colonizing to fruiting
- `start_flush1` - Pins appeared, start flush 1
- `harvest_flush1` - Harvest first flush (requires yield_kg)
- `start_flush2` - Second flush pins appeared
- `harvest_flush2` - Harvest second flush (requires yield_kg)

### POST /api/batches/{batch_id}/workflow/update-predictions
Recalculate all predictions for a batch.

## Workflow Status Values

The `workflow_status` field can have these values:
- `spawning` - Spawn is colonizing
- `spawn_ready` - Spawn ready for inoculation
- `colonizing` - Substrate is colonizing
- `fruiting` - Initiated fruiting conditions
- `flush1_active` - First flush pins growing
- `flush1_complete` - First harvest completed
- `flush2_active` - Second flush pins growing
- `flush2_complete` - Second harvest completed
- `complete` - Batch lifecycle complete
- `contaminated` - Batch contaminated

## Frontend Integration (Next Steps)

### Required Frontend Changes:
1. Update batch table to show workflow status column
2. Add workflow progress section to BatchModal
3. Create transition buttons and modal dialogs
4. Display AI predictions and progress indicators
5. Add color coding for status (green/yellow/red)

### Frontend Files to Update:
- `frontend/src/components/BatchTable.jsx` - Add workflow column
- `frontend/src/components/BatchModal.jsx` - Add workflow section
- `frontend/src/services/api.js` - Add workflow API calls
- `frontend/src/types/batch.ts` - Update types with workflow fields

## Rollback Plan

If issues arise:

1. **Revert backend code:**
   ```bash
   git checkout v4.6.1
   cp -r backend/* k:/sopp-tracker/backend/
   ```

2. **Database schema is backwards compatible** - new columns are nullable, so old code will continue working.

3. **To remove workflow columns (if needed):**
   ```sql
   ALTER TABLE batches DROP COLUMN workflow_status;
   ALTER TABLE batches DROP COLUMN spawn_expected_ready_date;
   -- etc... (see migration script for full list)
   ```

## Testing Checklist

- [ ] Backend starts without errors
- [ ] GET / returns version 4.7.0
- [ ] GET /api/batches/{id}/workflow returns predictions
- [ ] POST /api/batches/{id}/workflow/transition works
- [ ] Database has new columns
- [ ] Strain statistics table seeded with initial data
- [ ] Existing batches load correctly
- [ ] Creating new batch works

## Notes

- All new workflow columns are **nullable** for backwards compatibility
- Existing batches will have `workflow_status = 'spawning'` after migration
- Predictions use research-based defaults until historical data accumulates
- The AI predictor learns from actual batch data over time

## Support

For issues, check:
1. Backend logs: `docker logs sopp-tracker-backend`
2. Database: Verify schema with `sqlite3 sopp_tracker.db ".schema batches"`
3. API docs: http://192.168.1.251:8000/docs

## Version History

**v4.7.0** - Workflow Tracking
- Added workflow status tracking
- AI predictions for each stage
- Transition endpoints
- Strain timing statistics

**v4.6.1** - Previous version
- QR code labels
- LC culture tracking
