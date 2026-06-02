-- Migration: add initial_quantity to cultures table
-- Run on PostgreSQL (prod):
--   psql $DATABASE_URL -f migrations/add_initial_quantity.sql
--
-- For local SQLite dev: delete backend/mycoflow_dev.db and restart backend.

ALTER TABLE cultures ADD COLUMN IF NOT EXISTS initial_quantity FLOAT;

-- Backfill: existing cultures get initial_quantity = current quantity
-- (assumes no batches have deducted from them yet)
UPDATE cultures SET initial_quantity = quantity WHERE quantity IS NOT NULL;
