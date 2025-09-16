-- Create companies table for company management
-- Run this in your Supabase SQL editor

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  created_by TEXT NOT NULL, -- Clerk user ID of the admin who created the company
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON companies(created_by);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- Add foreign key constraint to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_users_company_id' 
    AND table_name = 'users'
  ) THEN
    ALTER TABLE users 
    ADD CONSTRAINT fk_users_company_id 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add RLS policies for companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see companies they belong to or created
CREATE POLICY "Users can view their company" ON companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    ) OR created_by = auth.uid()
  );

-- Policy: Only admins can insert companies
CREATE POLICY "Admins can create companies" ON companies
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Only company creators can update their company
CREATE POLICY "Company creators can update" ON companies
  FOR UPDATE USING (created_by = auth.uid());

-- Policy: Only company creators can delete their company
CREATE POLICY "Company creators can delete" ON companies
  FOR DELETE USING (created_by = auth.uid());
