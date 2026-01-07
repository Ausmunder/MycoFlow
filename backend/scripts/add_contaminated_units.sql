-- Add contaminated_units column to batches table
ALTER TABLE batches ADD COLUMN IF NOT EXISTS contaminated_units INTEGER DEFAULT 0;
