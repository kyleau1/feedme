-- Complete Database Setup for FeedMe App
-- Run this in your Supabase SQL editor

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

-- Create users table
CREATE TABLE users (
  id TEXT PRIMARY KEY, -- Clerk user ID
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'employee',
  company_id TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create companies table
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  created_by TEXT NOT NULL, -- Clerk user ID of the admin who created the company
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invitations table
CREATE TABLE invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  used_by TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create orders table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT,
  restaurant_id TEXT,
  items TEXT[],
  external_delivery_id TEXT,
  doordash_delivery_id TEXT,
  delivery_status TEXT DEFAULT 'pending',
  tracking_url TEXT,
  delivery_fee DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE users 
ADD CONSTRAINT fk_users_company_id 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_companies_created_by ON companies(created_by);
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_invitations_code ON invitations(invite_code);
CREATE INDEX idx_invitations_company ON invitations(company_id);
CREATE INDEX idx_invitations_created_by ON invitations(created_by);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_delivery_status ON orders(delivery_status);

-- Create function to generate invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM invitations WHERE invite_code = code) INTO exists;
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

-- RLS Policies for companies table
CREATE POLICY "Users can view their company" ON companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    ) OR created_by = auth.uid()
  );

CREATE POLICY "Admins can create companies" ON companies
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Company creators can update" ON companies
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Company creators can delete" ON companies
  FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for invitations table
CREATE POLICY "Users can view invitations for their company" ON invitations
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    ) OR created_by = auth.uid()
  );

CREATE POLICY "Admins can create invitations" ON invitations
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update invitations" ON invitations
  FOR UPDATE USING (created_by = auth.uid());

-- RLS Policies for orders table
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own orders" ON orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own orders" ON orders
  FOR UPDATE USING (user_id = auth.uid());

-- Insert a sample admin user for testing (optional)
-- Replace 'your-clerk-user-id' with an actual Clerk user ID
-- INSERT INTO users (id, email, first_name, last_name, role) 
-- VALUES ('your-clerk-user-id', 'admin@example.com', 'Admin', 'User', 'admin')
-- ON CONFLICT (id) DO NOTHING;
