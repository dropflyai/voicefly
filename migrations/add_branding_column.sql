-- Add branding support to businesses table
-- This enables custom branding for Professional and Business tiers

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{}';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_businesses_branding ON businesses USING GIN (branding);

-- Update existing businesses with default branding
UPDATE businesses 
SET branding = '{
  "logo_url": null,
  "primary_color": "#8b5cf6",
  "secondary_color": "#ec4899", 
  "accent_color": "#f59e0b",
  "font_family": "Inter",
  "custom_css": "",
  "favicon_url": null
}'::jsonb
WHERE branding = '{}' OR branding IS NULL;

-- Branding JSONB structure:
-- {
--   "logo_url": "https://...",         -- Business logo URL
--   "primary_color": "#8b5cf6",        -- Main brand color
--   "secondary_color": "#ec4899",      -- Secondary brand color  
--   "accent_color": "#f59e0b",         -- Accent/highlight color
--   "font_family": "Inter",            -- Brand font family
--   "custom_css": "...",               -- Additional CSS overrides
--   "favicon_url": "https://..."       -- Custom favicon URL
-- }

-- Create storage bucket for business assets if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-assets', 
  'business-assets', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policy for business assets
CREATE POLICY "Business assets are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'business-assets');

CREATE POLICY "Businesses can upload their own assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'business-assets');

CREATE POLICY "Businesses can update their own assets" ON storage.objects
  FOR UPDATE USING (bucket_id = 'business-assets');

CREATE POLICY "Businesses can delete their own assets" ON storage.objects
  FOR DELETE USING (bucket_id = 'business-assets');