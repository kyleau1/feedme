-- Fix existing orders that might have NULL user_name values
-- Run this in your Supabase SQL editor

-- Check if there are any orders with NULL user_name
SELECT COUNT(*) as null_count FROM orders WHERE user_name IS NULL;

-- Update any orders with NULL user_name to have a default name
UPDATE orders 
SET user_name = 'User ' || SUBSTRING(user_id, 1, 8)
WHERE user_name IS NULL;

-- Verify the update worked
SELECT COUNT(*) as remaining_nulls FROM orders WHERE user_name IS NULL;
