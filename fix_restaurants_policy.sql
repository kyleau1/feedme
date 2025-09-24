-- Fix restaurants table policies to allow scraping
-- Drop existing policies and create more permissive ones

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Authenticated users can view all restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Allow scraping API to insert restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Allow scraping API to update restaurants" ON public.restaurants;

-- Create permissive policies for restaurants table
CREATE POLICY "Allow all operations on restaurants" ON public.restaurants
    FOR ALL USING (true);

-- Grant necessary permissions
GRANT ALL ON public.restaurants TO authenticated;
GRANT ALL ON public.restaurants TO anon;
