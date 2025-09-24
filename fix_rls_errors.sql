-- Fix RLS (Row Level Security) errors
-- Enable RLS on all public tables that need it

-- Enable RLS on restaurants table
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Enable RLS on organization_users table
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on invitations table
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for each table

-- Restaurants table policies
-- Allow anyone to view active restaurants (this policy already exists)
-- The policy "Anyone can view active restaurants" should work now that RLS is enabled

-- Organization users table policies
CREATE POLICY "Users can view their own organization memberships" ON public.organization_users
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own organization memberships" ON public.organization_users
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own organization memberships" ON public.organization_users
    FOR UPDATE USING (auth.uid() = user_id);

-- Organizations table policies
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_users 
            WHERE organization_id = organizations.id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create organizations" ON public.organizations
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update organizations they created" ON public.organizations
    FOR UPDATE USING (auth.uid() = created_by);

-- Orders table policies
CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" ON public.orders
    FOR UPDATE USING (auth.uid() = user_id);

-- Invitations table policies
CREATE POLICY "Users can view invitations sent to them" ON public.invitations
    FOR SELECT USING (auth.uid() = invited_user_id);

CREATE POLICY "Users can view invitations they sent" ON public.invitations
    FOR SELECT USING (auth.uid() = invited_by);

CREATE POLICY "Users can create invitations" ON public.invitations
    FOR INSERT WITH CHECK (auth.uid() = invited_by);

CREATE POLICY "Users can update invitations they sent" ON public.invitations
    FOR UPDATE USING (auth.uid() = invited_by);

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Add some additional policies for restaurant access
CREATE POLICY "Anyone can view active restaurants" ON public.restaurants
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can view all restaurants" ON public.restaurants
    FOR SELECT USING (auth.role() = 'authenticated');

-- Add policies for restaurant management (if needed)
CREATE POLICY "Restaurant owners can update their restaurants" ON public.restaurants
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.organization_users ou
            JOIN public.organizations o ON o.id = ou.organization_id
            WHERE o.id = restaurants.organization_id
            AND ou.user_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
