-- Fix RLS (Row Level Security) errors - Flexible version that handles different column types
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

-- Create additional policies with flexible type handling
CREATE POLICY "Authenticated users can view all restaurants" ON public.restaurants
    FOR SELECT USING (auth.role() = 'authenticated');

-- Basic user policies - try both uuid and text casting
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id::text);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id::text);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id::text);

-- Basic order policies - try both uuid and text casting
CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id::text);

CREATE POLICY "Users can create their own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id::text);

CREATE POLICY "Users can update their own orders" ON public.orders
    FOR UPDATE USING (auth.uid() = user_id::text);

-- Organization users policies - try both uuid and text casting
CREATE POLICY "Users can view their own organization memberships" ON public.organization_users
    FOR SELECT USING (auth.uid() = user_id::text);

CREATE POLICY "Users can insert their own organization memberships" ON public.organization_users
    FOR INSERT WITH CHECK (auth.uid() = user_id::text);

CREATE POLICY "Users can update their own organization memberships" ON public.organization_users
    FOR UPDATE USING (auth.uid() = user_id::text);

-- Organizations policies - try both uuid and text casting
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_users 
            WHERE organization_id = organizations.id 
            AND user_id::text = auth.uid()
        )
    );

CREATE POLICY "Users can create organizations" ON public.organizations
    FOR INSERT WITH CHECK (auth.uid() = created_by::text);

CREATE POLICY "Users can update organizations they created" ON public.organizations
    FOR UPDATE USING (auth.uid() = created_by::text);

-- Invitations policies - try both uuid and text casting
CREATE POLICY "Users can view invitations sent to them" ON public.invitations
    FOR SELECT USING (auth.uid() = invited_user_id::text);

CREATE POLICY "Users can view invitations they sent" ON public.invitations
    FOR SELECT USING (auth.uid() = invited_by::text);

CREATE POLICY "Users can create invitations" ON public.invitations
    FOR INSERT WITH CHECK (auth.uid() = invited_by::text);

CREATE POLICY "Users can update invitations they sent" ON public.invitations
    FOR UPDATE USING (auth.uid() = invited_by::text);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
