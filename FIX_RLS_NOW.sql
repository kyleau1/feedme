-- Copy and paste this entire script into your Supabase SQL Editor

-- Step 1: Disable RLS on restaurants table
ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'restaurants';

-- Step 3: Test insert (optional - just to verify it works)
INSERT INTO restaurants (
  place_id, 
  name, 
  address, 
  lat, 
  lng, 
  rating, 
  price_level, 
  cuisine_types, 
  photos, 
  is_active, 
  menu
) VALUES (
  'test_verification_123',
  'Test Restaurant',
  '123 Test St',
  37.7749,
  -122.4194,
  4.0,
  2,
  ARRAY['american'],
  '[]'::jsonb,
  true,
  '{"categories": [{"name": "Test", "items": []}]}'::jsonb
);

-- Step 4: Clean up test data
DELETE FROM restaurants WHERE place_id = 'test_verification_123';

-- You should see: rowsecurity = false (meaning RLS is disabled)
