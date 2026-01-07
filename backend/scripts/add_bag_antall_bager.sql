-- Add bag_antall_bager column
ALTER TABLE batches
ADD COLUMN IF NOT EXISTS bag_antall_bager INTEGER;

COMMENT ON COLUMN batches.bag_antall_bager IS 'Number of fruiting bags produced from this spawn batch';
