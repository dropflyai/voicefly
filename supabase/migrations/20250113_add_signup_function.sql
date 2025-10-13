-- Add create_business_for_new_user function for signup flow
-- This function is called during user registration to create a business and associate the user

CREATE OR REPLACE FUNCTION create_business_for_new_user(
  p_business_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_business_type TEXT,
  p_user_id UUID,
  p_first_name TEXT,
  p_last_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_business_id UUID;
  v_result JSON;
  v_slug TEXT;
  v_slug_attempt INT := 0;
BEGIN
  -- Generate unique slug
  v_slug := lower(regexp_replace(p_business_name, '[^a-z0-9]+', '-', 'g'));

  -- Ensure slug uniqueness by appending number if needed
  WHILE EXISTS (SELECT 1 FROM businesses WHERE slug = v_slug) LOOP
    v_slug_attempt := v_slug_attempt + 1;
    v_slug := lower(regexp_replace(p_business_name, '[^a-z0-9]+', '-', 'g')) || '-' || v_slug_attempt;
  END LOOP;

  -- Insert business
  INSERT INTO businesses (
    name,
    slug,
    business_type,
    email,
    phone,
    subscription_tier,
    subscription_status,
    trial_ends_at,
    timezone,
    created_at,
    updated_at
  ) VALUES (
    p_business_name,
    v_slug,
    p_business_type,
    p_email,
    COALESCE(p_phone, ''),
    'trial',
    'trial',
    NOW() + INTERVAL '14 days',
    'America/Los_Angeles',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_business_id;

  -- Insert business_user association
  INSERT INTO business_users (
    user_id,
    business_id,
    role,
    first_name,
    last_name,
    is_active
  ) VALUES (
    p_user_id,
    v_business_id,
    'owner',
    p_first_name,
    p_last_name,
    true
  );

  -- Return the business data
  SELECT json_build_object(
    'id', id,
    'name', name,
    'email', email,
    'business_type', business_type
  ) INTO v_result
  FROM businesses
  WHERE id = v_business_id;

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_business_for_new_user TO authenticated;
GRANT EXECUTE ON FUNCTION create_business_for_new_user TO anon;

-- Add comment
COMMENT ON FUNCTION create_business_for_new_user IS 'Creates a business and associates it with a new user during signup. Uses SECURITY DEFINER to bypass RLS.';
