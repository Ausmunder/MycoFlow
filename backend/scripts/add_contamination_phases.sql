-- Migration: Add per-phase contamination tracking
-- Run: docker exec sopp-tracker psql -U postgres -d sopp_tracker -f /app/scripts/add_contamination_phases.sql

ALTER TABLE batches ADD COLUMN IF NOT EXISTS inkubering_contaminated_units INTEGER;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS frukt1_contaminated_units INTEGER;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS frukt2_contaminated_units INTEGER;
