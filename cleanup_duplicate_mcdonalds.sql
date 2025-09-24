-- Clean up duplicate McDonald's entries
-- Remove the old scraped entry and local entry without menu data

-- Delete the old scraped McDonald's entry
DELETE FROM restaurants 
WHERE place_id = 'scraped_mcdonald''s';

-- Delete the local McDonald's entry without menu data (empty array)
DELETE FROM restaurants 
WHERE place_id = 'ChIJN1t_tDeuEmsRUsoyG83frY4_2' 
AND (menu IS NULL OR jsonb_array_length(menu) = 0);

-- Verify the cleanup
SELECT 
  place_id, 
  name, 
  source,
  CASE 
    WHEN menu IS NULL THEN 'No menu'
    WHEN jsonb_typeof(menu) = 'array' AND jsonb_array_length(menu) = 0 THEN 'Empty array'
    WHEN jsonb_typeof(menu) = 'object' AND menu ? 'categories' THEN 'Has categories'
    ELSE 'Other'
  END as menu_status
FROM restaurants 
WHERE name ILIKE '%mcdonald%'
ORDER BY name, place_id;
