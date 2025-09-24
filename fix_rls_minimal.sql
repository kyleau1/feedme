-- Fix RLS (Row Level Security) errors - Minimal version
-- Just enable RLS and create basic policies without complex user matching

-- Enable RLS on all tables
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop and recreate the existing policy
DROP POLICY IF EXISTS "Anyone can view active restaurants" ON public.restaurants;
CREATE POLICY "Anyone can view active restaurants" ON public.restaurants
    FOR SELECT USING (is_active = true);

-- Create basic policies that don't depend on user matching
CREATE POLICY "Authenticated users can view all restaurants" ON public.restaurants
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow all authenticated users to access these tables for now
CREATE POLICY "Authenticated users can view users" ON public.users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update users" ON public.users
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert users" ON public.users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view orders" ON public.orders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update orders" ON public.orders
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view organization_users" ON public.organization_users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert organization_users" ON public.organization_users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update organization_users" ON public.organization_users
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view organizations" ON public.organizations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create organizations" ON public.organizations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update organizations" ON public.organizations
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view invitations" ON public.invitations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create invitations" ON public.invitations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update invitations" ON public.invitations
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
