-- Fix RLS (Row Level Security) errors - Final version
-- Enable RLS on all public tables

-- Enable RLS on all tables
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
-- Restaurants policies
DO $$
BEGIN
    -- Drop existing policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'restaurants' AND policyname = 'Anyone can view active restaurants') THEN
        DROP POLICY "Anyone can view active restaurants" ON public.restaurants;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'restaurants' AND policyname = 'Authenticated users can view all restaurants') THEN
        DROP POLICY "Authenticated users can view all restaurants" ON public.restaurants;
    END IF;
    
    -- Create new policies
    CREATE POLICY "Anyone can view active restaurants" ON public.restaurants
        FOR SELECT USING (is_active = true);
        
    CREATE POLICY "Authenticated users can view all restaurants" ON public.restaurants
        FOR SELECT USING (auth.role() = 'authenticated');
END $$;

-- Users policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view their own profile') THEN
        DROP POLICY "Users can view their own profile" ON public.users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update their own profile') THEN
        DROP POLICY "Users can update their own profile" ON public.users;
    END IF;
    
    CREATE POLICY "Users can view their own profile" ON public.users
        FOR SELECT USING (auth.uid() = id);
        
    CREATE POLICY "Users can update their own profile" ON public.users
        FOR UPDATE USING (auth.uid() = id);
END $$;

-- Orders policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can view their own orders') THEN
        DROP POLICY "Users can view their own orders" ON public.orders;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can create their own orders') THEN
        DROP POLICY "Users can create their own orders" ON public.orders;
    END IF;
    
    CREATE POLICY "Users can view their own orders" ON public.orders
        FOR SELECT USING (auth.uid() = user_id);
        
    CREATE POLICY "Users can create their own orders" ON public.orders
        FOR INSERT WITH CHECK (auth.uid() = user_id);
END $$;

-- Organization users policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_users' AND policyname = 'Users can view their own organization memberships') THEN
        DROP POLICY "Users can view their own organization memberships" ON public.organization_users;
    END IF;
    
    CREATE POLICY "Users can view their own organization memberships" ON public.organization_users
        FOR SELECT USING (auth.uid() = user_id);
END $$;

-- Organizations policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'Users can view organizations they belong to') THEN
        DROP POLICY "Users can view organizations they belong to" ON public.organizations;
    END IF;
    
    CREATE POLICY "Users can view organizations they belong to" ON public.organizations
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.organization_users 
                WHERE organization_id = organizations.id 
                AND user_id = auth.uid()
            )
        );
END $$;

-- Invitations policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invitations' AND policyname = 'Users can view invitations sent to them') THEN
        DROP POLICY "Users can view invitations sent to them" ON public.invitations;
    END IF;
    
    CREATE POLICY "Users can view invitations sent to them" ON public.invitations
        FOR SELECT USING (auth.uid() = invited_user_id);
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
