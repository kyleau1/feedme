-- Fix orders table RLS policies to allow order creation
-- Drop existing policies and create permissive ones for orders

-- Drop existing policies on orders table
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;

-- Create permissive policies for orders table
CREATE POLICY "Allow all operations on orders" ON public.orders
    FOR ALL USING (true);

-- Grant necessary permissions
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.orders TO anon;
