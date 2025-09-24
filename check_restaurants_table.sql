-- Check if restaurants table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'restaurants' 
ORDER BY ordinal_position;

-- Check current data in restaurants table
SELECT COUNT(*) as restaurant_count FROM restaurants;

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'restaurants';
