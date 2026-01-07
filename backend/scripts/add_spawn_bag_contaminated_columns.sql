-- Add spawn_contaminated_units and bag_contaminated_units columns
-- Migrate existing data from contaminated_units

ALTER TABLE batches
ADD COLUMN IF NOT EXISTS spawn_contaminated_units INTEGER,
ADD COLUMN IF NOT EXISTS bag_contaminated_units INTEGER;

-- No automatic migration of contaminated_units since we don't know which phase it belongs to
-- User will need to manually re-enter contamination data or we can assume it's bag contamination

COMMENT ON COLUMN batches.contaminated_units IS 'DEPRECATED - Use spawn_contaminated_units and bag_contaminated_units';
COMMENT ON COLUMN batches.spawn_contaminated_units IS 'Contaminated units during spawn phase';
COMMENT ON COLUMN batches.bag_contaminated_units IS 'Contaminated units during bag/fruiting phase';
