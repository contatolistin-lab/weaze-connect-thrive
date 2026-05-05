-- Add slug column to tenants if not exists
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Generate slug for existing tenants that don't have one
UPDATE tenants 
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-z0-9]', '', 'g'))
WHERE slug IS NULL OR slug = '';

-- If slug still empty or duplicate, generate unique
UPDATE tenants
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-z0-9]', '', 'g')) || '-' || LEFT(md5(random()::text), 4)
WHERE slug IS NULL OR slug = '' OR (
  SELECT COUNT(*) FROM tenants t2 WHERE t2.slug = LOWER(REGEXP_REPLACE(tenants.name, '[^a-z0-9]', '', 'g'))
) > 1;

-- Make slug NOT NULL for new inserts
ALTER TABLE tenants ALTER COLUMN slug SET DEFAULT '';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);