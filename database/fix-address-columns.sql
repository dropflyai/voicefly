-- Fix Address Columns Schema Mismatch
-- Add missing address columns to businesses table

-- Add the missing address columns
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US';

-- Migrate existing address data to address_line1
UPDATE businesses 
SET address_line1 = address 
WHERE address_line1 IS NULL AND address IS NOT NULL;

-- Create index for address searching
CREATE INDEX IF NOT EXISTS idx_businesses_address ON businesses(address_line1);

-- Verify the migration
SELECT 'Address columns added successfully' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'address_line1'
) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'address_line2'
);