-- White-label system for Business and Enterprise tiers
-- Enables complete platform rebranding with custom domains

-- Create white_label_domains table
CREATE TABLE IF NOT EXISTS white_label_domains (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    domain varchar(255) NOT NULL UNIQUE,
    subdomain varchar(100), -- For cases like client.dropfly.ai
    is_active boolean DEFAULT true,
    ssl_enabled boolean DEFAULT false,
    ssl_verified_at timestamp with time zone,
    dns_verified_at timestamp with time zone,
    config jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Ensure business can only have domains if they have Business+ tier
    CONSTRAINT check_business_tier CHECK (
        EXISTS (
            SELECT 1 FROM businesses b 
            WHERE b.id = business_id 
            AND b.subscription_tier IN ('business', 'enterprise')
        )
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_white_label_domains_domain ON white_label_domains(domain);
CREATE INDEX IF NOT EXISTS idx_white_label_domains_business_id ON white_label_domains(business_id);
CREATE INDEX IF NOT EXISTS idx_white_label_domains_active ON white_label_domains(is_active) WHERE is_active = true;

-- Config JSONB structure:
-- {
--   "branding": {
--     "platform_name": "MyBrand Booking",        -- Replaces "DropFly"
--     "logo_url": "https://...",                   -- Custom platform logo
--     "favicon_url": "https://...",               -- Custom favicon
--     "colors": {
--       "primary": "#8b5cf6",
--       "secondary": "#ec4899",
--       "accent": "#f59e0b"
--     },
--     "font_family": "Custom Font",
--     "hide_powered_by": true,                    -- Remove "Powered by DropFly"
--     "custom_footer": "© 2025 MyBrand. All rights reserved."
--   },
--   "features": {
--     "custom_email_domain": true,                -- Send emails from @myclient.com
--     "custom_sms_sender": "MyBrand",             -- SMS sender ID
--     "remove_platform_branding": true,          -- Complete rebrand
--     "custom_login_page": true,                  -- Branded login experience
--     "white_label_dashboard": true               -- Fully branded dashboard
--   },
--   "email": {
--     "from_domain": "bookings@myclient.com",     -- Custom email domain
--     "smtp_settings": {                          -- Custom SMTP (optional)
--       "host": "smtp.myclient.com",
--       "port": 587,
--       "username": "bookings@myclient.com"
--     }
--   },
--   "sms": {
--     "sender_id": "MYBRAND",                     -- Custom SMS sender
--     "twilio_subaccount": "AC..."                -- Optional: separate Twilio account
--   },
--   "analytics": {
--     "google_analytics": "G-...",               -- Client's GA tracking
--     "custom_tracking": true,                    -- Remove DropFly tracking
--     "branded_reports": true                     -- Reports with client branding
--   },
--   "legal": {
--     "privacy_policy_url": "https://myclient.com/privacy",
--     "terms_url": "https://myclient.com/terms",
--     "support_email": "help@myclient.com"
--   }
-- }

-- Create white_label_themes table for saved theme configurations
CREATE TABLE IF NOT EXISTS white_label_themes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name varchar(255) NOT NULL,
    description text,
    theme_config jsonb NOT NULL,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Ensure only one active theme per business
    CONSTRAINT unique_active_theme_per_business EXCLUDE USING btree (business_id WITH =) WHERE (is_active = true)
);

CREATE INDEX IF NOT EXISTS idx_white_label_themes_business_id ON white_label_themes(business_id);
CREATE INDEX IF NOT EXISTS idx_white_label_themes_active ON white_label_themes(business_id, is_active) WHERE is_active = true;

-- Theme config JSONB structure:
-- {
--   "layout": {
--     "sidebar_position": "left|right|top",
--     "header_style": "modern|classic|minimal",
--     "color_scheme": "light|dark|auto"
--   },
--   "components": {
--     "booking_widget_style": "modal|inline|fullscreen",
--     "calendar_theme": "modern|classic",
--     "form_style": "rounded|square|minimal"
--   },
--   "custom_css": "/* Custom CSS overrides */",
--   "fonts": {
--     "primary": "Inter",
--     "secondary": "Roboto",
--     "heading": "Montserrat"
--   }
-- }

-- Create white_label_reports table for custom report templates
CREATE TABLE IF NOT EXISTS white_label_reports (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    domain_id uuid NOT NULL REFERENCES white_label_domains(id) ON DELETE CASCADE,
    name varchar(255) NOT NULL,
    report_type varchar(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'custom'
    template_config jsonb NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_white_label_reports_domain_id ON white_label_reports(domain_id);
CREATE INDEX IF NOT EXISTS idx_white_label_reports_business_id ON white_label_reports(business_id);

-- Template config JSONB structure:
-- {
--   "header": {
--     "logo_url": "https://...",
--     "company_name": "Client Company",
--     "report_title": "Monthly Performance Report",
--     "colors": {...}
--   },
--   "sections": [
--     {
--       "type": "summary",
--       "title": "Executive Summary",
--       "enabled": true,
--       "config": {...}
--     },
--     {
--       "type": "revenue_chart",
--       "title": "Revenue Trends",
--       "enabled": true,
--       "chart_type": "line|bar",
--       "colors": [...]
--     },
--     {
--       "type": "staff_performance",
--       "title": "Staff Performance",
--       "enabled": true,
--       "show_individual": false
--     }
--   ],
--   "footer": {
--     "company_info": "© 2025 Client Company. All rights reserved.",
--     "contact_info": "support@client.com | (555) 123-4567"
--   }
-- }

-- Add white_label_domain_id to businesses table for quick lookup
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS white_label_domain_id uuid REFERENCES white_label_domains(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_white_label_domain ON businesses(white_label_domain_id);

-- Create RLS policies
ALTER TABLE white_label_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_reports ENABLE ROW LEVEL SECURITY;

-- White label domains are viewable by business owners
CREATE POLICY "White label domains viewable by business owners" ON white_label_domains
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = white_label_domains.business_id
    )
  );

CREATE POLICY "Business owners can manage their white label domains" ON white_label_domains
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = white_label_domains.business_id
    )
  );

-- Similar policies for themes and reports
CREATE POLICY "White label themes viewable by business owners" ON white_label_themes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = white_label_themes.business_id
    )
  );

CREATE POLICY "Business owners can manage their white label themes" ON white_label_themes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = white_label_themes.business_id
    )
  );

CREATE POLICY "White label reports viewable by business owners" ON white_label_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = white_label_reports.business_id
    )
  );

CREATE POLICY "Business owners can manage their white label reports" ON white_label_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = white_label_reports.business_id
    )
  );

-- Trigger for updated_at timestamps
CREATE TRIGGER update_white_label_domains_updated_at BEFORE UPDATE ON white_label_domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_white_label_themes_updated_at BEFORE UPDATE ON white_label_themes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_white_label_reports_updated_at BEFORE UPDATE ON white_label_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get white label configuration by domain
CREATE OR REPLACE FUNCTION get_white_label_config(p_domain varchar(255))
RETURNS TABLE (
    business_id uuid,
    domain varchar(255),
    config jsonb,
    theme_config jsonb,
    is_active boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wld.business_id,
        wld.domain,
        wld.config,
        COALESCE(wlt.theme_config, '{}'::jsonb) as theme_config,
        wld.is_active
    FROM white_label_domains wld
    LEFT JOIN white_label_themes wlt ON wlt.business_id = wld.business_id AND wlt.is_active = true
    WHERE wld.domain = p_domain AND wld.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate domain ownership
CREATE OR REPLACE FUNCTION verify_domain_ownership(p_domain varchar(255), p_business_id uuid)
RETURNS boolean AS $$
DECLARE
    domain_exists boolean;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM white_label_domains 
        WHERE domain = p_domain AND business_id = p_business_id
    ) INTO domain_exists;
    
    RETURN domain_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;