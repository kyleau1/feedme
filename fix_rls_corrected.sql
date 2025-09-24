-- Fix RLS (Row Level Security) errors - Corrected version with proper type casting
-- Enable RLS on all public tables

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

-- Create additional policies with proper type casting
CREATE POLICY "Authenticated users can view all restaurants" ON public.restaurants
    FOR SELECT USING (auth.role() = 'authenticated');

-- Basic user policies with proper type casting
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid()::uuid = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid()::uuid = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid()::uuid = id);

-- Basic order policies with proper type casting
CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can create their own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update their own orders" ON public.orders
    FOR UPDATE USING (auth.uid()::uuid = user_id);

-- Organization users policies with proper type casting
CREATE POLICY "Users can view their own organization memberships" ON public.organization_users
    FOR SELECT USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert their own organization memberships" ON public.organization_users
    FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update their own organization memberships" ON public.organization_users
    FOR UPDATE USING (auth.uid()::uuid = user_id);

-- Organizations policies with proper type casting
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_users 
            WHERE organization_id = organizations.id 
            AND user_id = auth.uid()::uuid
        )
    );

CREATE POLICY "Users can create organizations" ON public.organizations
    FOR INSERT WITH CHECK (auth.uid()::uuid = created_by);

CREATE POLICY "Users can update organizations they created" ON public.organizations
    FOR UPDATE USING (auth.uid()::uuid = created_by);

-- Invitations policies with proper type casting
CREATE POLICY "Users can view invitations sent to them" ON public.invitations
    FOR SELECT USING (auth.uid()::uuid = invited_user_id);

CREATE POLICY "Users can view invitations they sent" ON public.invitations
    FOR SELECT USING (auth.uid()::uuid = invited_by);

CREATE POLICY "Users can create invitations" ON public.invitations
    FOR INSERT WITH CHECK (auth.uid()::uuid = invited_by);

CREATE POLICY "Users can update invitations they sent" ON public.invitations
    FOR UPDATE USING (auth.uid()::uuid = invited_by);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
