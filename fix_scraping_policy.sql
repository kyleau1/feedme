-- Add policy to allow scraping API to insert restaurants
-- This allows the scraping service to save menu data to the database

CREATE POLICY "Allow scraping API to insert restaurants" ON public.restaurants
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow scraping API to update restaurants" ON public.restaurants
    FOR UPDATE USING (true);
