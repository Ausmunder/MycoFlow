-- Add recipe_ingredients and grams_per_bag to substrate_mixes table
ALTER TABLE substrate_mixes
ADD COLUMN IF NOT EXISTS recipe_ingredients TEXT,
ADD COLUMN IF NOT EXISTS grams_per_bag INTEGER;

COMMENT ON COLUMN substrate_mixes.recipe_ingredients IS 'JSON array of ingredients: [{"name": "Hardwood pellets", "grams": 1200}, ...]';
COMMENT ON COLUMN substrate_mixes.grams_per_bag IS 'Total dry weight in grams per bag (excluding water)';

-- Update existing mixes with default grams_per_bag
-- Masters Mix: typical 1.65kg dry weight per bag
UPDATE substrate_mixes SET grams_per_bag = 1650 WHERE name = 'Masters Mix' AND grams_per_bag IS NULL;
UPDATE substrate_mixes SET grams_per_bag = 1600 WHERE name = 'Masters Mix Shiitake' AND grams_per_bag IS NULL;
UPDATE substrate_mixes SET grams_per_bag = 1500 WHERE name = 'Halm' AND grams_per_bag IS NULL;
UPDATE substrate_mixes SET grams_per_bag = 1650 WHERE name = 'Sagflis+kli' AND grams_per_bag IS NULL;
