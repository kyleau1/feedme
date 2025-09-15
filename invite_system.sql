-- Create invitations table for company invite links
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL, -- Clerk user ID of the company admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  max_uses INTEGER DEFAULT 1, -- How many people can use this invite
  used_count INTEGER DEFAULT 0, -- How many times it's been used
  is_active BOOLEAN DEFAULT true,
  used_by UUID[], -- Array of Clerk user IDs who used this invite
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_invitations_company ON invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_invitations_created_by ON invitations(created_by);

-- Add company_id to users table (if not exists)
-- This will link users to their company
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_by UUID; -- Clerk user ID of company admin

-- Create a function to generate unique invite codes
CREATE OR REPLACE FUNCTION generate_invite_code() RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character code
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM invitations WHERE invite_code = code) INTO exists;
    
    -- If code doesn't exist, return it
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

