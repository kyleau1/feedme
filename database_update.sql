-- Add user_name column to orders table
-- Run this in your Supabase SQL editor

ALTER TABLE orders 
ADD COLUMN user_name TEXT;

-- Update existing orders with a default name if needed
UPDATE orders 
SET user_name = 'User ' || SUBSTRING(user_id, 1, 8)
WHERE user_name IS NULL;

-- Make user_name NOT NULL after updating existing records
ALTER TABLE orders 
ALTER COLUMN user_name SET NOT NULL;
