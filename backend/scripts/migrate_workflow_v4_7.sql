-- Migration script for Workflow Tracking v4.7.0
-- Adds workflow status columns to batches and strain_statistics tables

-- ===== BATCHES TABLE =====

-- Update existing workflow_status default value
UPDATE batches SET workflow_status = 'spawning' WHERE workflow_status = 'Spawn' OR workflow_status IS NULL;

-- Add Spawn stage columns
ALTER TABLE batches ADD COLUMN spawn_expected_ready_date TIMESTAMP;
ALTER TABLE batches ADD COLUMN spawn_actual_ready_date TIMESTAMP;

-- Add Colonization stage columns
ALTER TABLE batches ADD COLUMN colonization_expected_date TIMESTAMP;
ALTER TABLE batches ADD COLUMN colonization_actual_date TIMESTAMP;

-- Add Fruiting stage columns
ALTER TABLE batches ADD COLUMN fruiting_start_date TIMESTAMP;
ALTER TABLE batches ADD COLUMN flush1_expected_date TIMESTAMP;
ALTER TABLE batches ADD COLUMN flush1_actual_start_date TIMESTAMP;
ALTER TABLE batches ADD COLUMN flush1_harvest_date TIMESTAMP;
ALTER TABLE batches ADD COLUMN flush1_expected_kg REAL;

-- Add Flush 2 columns
ALTER TABLE batches ADD COLUMN flush2_expected_date TIMESTAMP;
ALTER TABLE batches ADD COLUMN flush2_actual_start_date TIMESTAMP;
ALTER TABLE batches ADD COLUMN flush2_harvest_date TIMESTAMP;
ALTER TABLE batches ADD COLUMN flush2_expected_kg REAL;

-- Add Flush 3 columns (optional)
ALTER TABLE batches ADD COLUMN flush3_expected_date TIMESTAMP;
ALTER TABLE batches ADD COLUMN flush3_actual_start_date TIMESTAMP;
ALTER TABLE batches ADD COLUMN flush3_harvest_date TIMESTAMP;
ALTER TABLE batches ADD COLUMN flush3_harvest_kg REAL;

-- ===== STRAIN_STATISTICS TABLE =====

-- Add workflow timing columns
ALTER TABLE strain_statistics ADD COLUMN avg_spawn_days INTEGER;
ALTER TABLE strain_statistics ADD COLUMN avg_fruiting_days INTEGER;
ALTER TABLE strain_statistics ADD COLUMN avg_flush1_days INTEGER;
ALTER TABLE strain_statistics ADD COLUMN avg_flush2_yield_kg REAL;
ALTER TABLE strain_statistics ADD COLUMN avg_flushes_per_batch REAL;

-- Seed initial workflow data based on research
UPDATE strain_statistics SET
    avg_spawn_days = 14,
    avg_fruiting_days = 7,
    avg_flush1_days = 5
WHERE strain_name = 'oyster';

UPDATE strain_statistics SET
    avg_spawn_days = 21,
    avg_fruiting_days = 10,
    avg_flush1_days = 7
WHERE strain_name = 'lions_mane';

UPDATE strain_statistics SET
    avg_spawn_days = 28,
    avg_fruiting_days = 12,
    avg_flush1_days = 7
WHERE strain_name = 'shiitake';

-- If strain_statistics table doesn't have these strains yet, insert them
INSERT OR IGNORE INTO strain_statistics (
    strain_name,
    avg_colonization_days,
    min_colonization_days,
    max_colonization_days,
    avg_spawn_days,
    avg_fruiting_days,
    avg_flush1_days
) VALUES
('oyster', 14, 10, 21, 14, 7, 5),
('lions_mane', 21, 14, 28, 21, 10, 7),
('shiitake', 28, 21, 35, 28, 12, 7);

-- ===== MIGRATION COMPLETE =====
-- Run this script with: sqlite3 sopp_tracker.db < migrate_workflow_v4_7.sql
