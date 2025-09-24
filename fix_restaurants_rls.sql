-- Fix RLS issues for restaurants table

-- Option 1: Disable RLS temporarily (for development)
ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;

-- Option 2: Create a policy that allows all operations (if you want to keep RLS enabled)
-- DROP POLICY IF EXISTS "Allow all operations on restaurants" ON restaurants;
-- CREATE POLICY "Allow all operations on restaurants" ON restaurants
--   FOR ALL USING (true) WITH CHECK (true);

-- Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'restaurants';
