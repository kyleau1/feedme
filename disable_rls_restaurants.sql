-- Temporarily disable RLS on restaurants table for data population
ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS after population (run this after you're done)
-- ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
