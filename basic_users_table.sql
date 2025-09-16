-- Basic users table setup
-- Run this in your Supabase SQL editor

-- Drop existing users table if it exists
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with basic fields
CREATE TABLE users (
  id TEXT PRIMARY KEY, -- Clerk user ID
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'employee',
  company_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_role ON users(role);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (id = auth.uid());
