-- Add profile_image_url field to users table
-- Run this in your Supabase SQL editor

-- Add profile_image_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'profile_image_url'
  ) THEN
    ALTER TABLE users ADD COLUMN profile_image_url TEXT;
  END IF;
END $$;

-- Update existing users with their Clerk profile images
UPDATE users 
SET profile_image_url = (
  SELECT image_url 
  FROM auth.users 
  WHERE auth.users.id = users.id
)
WHERE profile_image_url IS NULL;
