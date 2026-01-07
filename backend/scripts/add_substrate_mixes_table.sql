-- Create substrate_mixes table for managing substrate recipes
CREATE TABLE IF NOT EXISTS substrate_mixes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    moisture_content DECIMAL(4,3),  -- e.g., 0.62 for 62% moisture
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default substrate mixes
INSERT INTO substrate_mixes (name, description, moisture_content, is_active)
VALUES
    ('Masters Mix', 'Standard masters mix (hardwood sawdust + soy hulls)', 0.62, true),
    ('Masters Mix Shiitake', 'Masters mix optimized for shiitake', 0.60, true),
    ('Halm', 'Straw-based substrate', 0.75, true),
    ('Sagflis+kli', 'Sawdust with bran supplement', 0.65, true)
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE substrate_mixes IS 'Substrate mix recipes and configurations';
COMMENT ON COLUMN substrate_mixes.moisture_content IS 'Moisture content as decimal (0.62 = 62%)';
