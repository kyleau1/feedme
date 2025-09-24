-- Add sample restaurants with real menu data for testing
-- This version works with the existing restaurants table structure
-- Run this in your Supabase SQL editor

-- First, let's add the missing columns to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 8);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS lng DECIMAL(11, 8);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS rating DECIMAL(2, 1);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS price_level INTEGER;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS cuisine_types TEXT[];
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS opening_hours JSONB;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS photos JSONB;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS menu_last_updated TIMESTAMP WITH TIME ZONE;

-- Add popular restaurants with their Google Places IDs
-- Include the menu column with an empty JSON array to satisfy the NOT NULL constraint
-- Using unique place IDs for each restaurant
INSERT INTO restaurants (place_id, name, address, city, state, zip_code, lat, lng, rating, price_level, cuisine_types, is_active, menu) 
VALUES 
    ('ChIJN1t_tDeuEmsRUsoyG83frY4', 'Chipotle Mexican Grill', '123 Main St', 'San Francisco', 'CA', '94102', 37.7749, -122.4194, 4.2, 2, ARRAY['Mexican', 'Fast Casual'], true, '[]'::jsonb),
    ('ChIJN1t_tDeuEmsRUsoyG83frY4_2', 'McDonald''s', '456 Market St', 'San Francisco', 'CA', '94103', 37.7849, -122.4094, 3.8, 1, ARRAY['American', 'Fast Food'], true, '[]'::jsonb),
    ('ChIJN1t_tDeuEmsRUsoyG83frY4_3', 'Starbucks', '789 Mission St', 'San Francisco', 'CA', '94105', 37.7949, -122.3994, 4.0, 2, ARRAY['Coffee', 'Cafe'], true, '[]'::jsonb)
ON CONFLICT (place_id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    zip_code = EXCLUDED.zip_code,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    rating = EXCLUDED.rating,
    price_level = EXCLUDED.price_level,
    cuisine_types = EXCLUDED.cuisine_types,
    is_active = EXCLUDED.is_active,
    menu = EXCLUDED.menu;

-- Get restaurant IDs for menu data
DO $$
DECLARE
    chipotle_id UUID;
    mcdonalds_id UUID;
    starbucks_id UUID;
BEGIN
    -- Get restaurant IDs
    SELECT id INTO chipotle_id FROM restaurants WHERE place_id = 'ChIJN1t_tDeuEmsRUsoyG83frY4';
    SELECT id INTO mcdonalds_id FROM restaurants WHERE place_id = 'ChIJN1t_tDeuEmsRUsoyG83frY4_2';
    SELECT id INTO starbucks_id FROM restaurants WHERE place_id = 'ChIJN1t_tDeuEmsRUsoyG83frY4_3';
    
    -- Add menu categories for Chipotle
    INSERT INTO menu_categories (restaurant_id, name, description, display_order) 
    VALUES 
        (chipotle_id, 'Burritos', 'Our signature burritos', 1),
        (chipotle_id, 'Bowls', 'Fresh bowls with your choice of ingredients', 2),
        (chipotle_id, 'Tacos', 'Soft and crispy tacos', 3),
        (chipotle_id, 'Salads', 'Fresh salads with protein', 4),
        (chipotle_id, 'Sides & Drinks', 'Sides and beverages', 5)
    ON CONFLICT DO NOTHING;

    -- Add Chipotle menu items
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_popular, is_vegetarian, is_vegan, is_gluten_free, calories, preparation_time, display_order)
    SELECT 
        chipotle_id,
        c.id,
        'Chicken Burrito',
        'Grilled chicken, rice, beans, cheese, and your choice of salsa',
        8.95,
        true,
        false,
        false,
        false,
        650,
        5,
        1
    FROM menu_categories c 
    WHERE c.restaurant_id = chipotle_id AND c.name = 'Burritos'
    ON CONFLICT DO NOTHING;

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_popular, is_vegetarian, is_vegan, is_gluten_free, calories, preparation_time, display_order)
    SELECT 
        chipotle_id,
        c.id,
        'Steak Burrito',
        'Grilled steak, rice, beans, cheese, and your choice of salsa',
        9.95,
        true,
        false,
        false,
        false,
        720,
        5,
        2
    FROM menu_categories c 
    WHERE c.restaurant_id = chipotle_id AND c.name = 'Burritos'
    ON CONFLICT DO NOTHING;

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_popular, is_vegetarian, is_vegan, is_gluten_free, calories, preparation_time, display_order)
    SELECT 
        chipotle_id,
        c.id,
        'Sofritas Burrito',
        'Tofu sofritas, rice, beans, cheese, and your choice of salsa',
        8.95,
        false,
        true,
        true,
        false,
        580,
        5,
        3
    FROM menu_categories c 
    WHERE c.restaurant_id = chipotle_id AND c.name = 'Burritos'
    ON CONFLICT DO NOTHING;

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_popular, is_vegetarian, is_vegan, is_gluten_free, calories, preparation_time, display_order)
    SELECT 
        chipotle_id,
        c.id,
        'Chicken Bowl',
        'Grilled chicken, rice, beans, cheese, and your choice of salsa',
        8.95,
        true,
        false,
        false,
        false,
        620,
        5,
        1
    FROM menu_categories c 
    WHERE c.restaurant_id = chipotle_id AND c.name = 'Bowls'
    ON CONFLICT DO NOTHING;

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_popular, is_vegetarian, is_vegan, is_gluten_free, calories, preparation_time, display_order)
    SELECT 
        chipotle_id,
        c.id,
        'Steak Bowl',
        'Grilled steak, rice, beans, cheese, and your choice of salsa',
        9.95,
        true,
        false,
        false,
        false,
        690,
        5,
        2
    FROM menu_categories c 
    WHERE c.restaurant_id = chipotle_id AND c.name = 'Bowls'
    ON CONFLICT DO NOTHING;

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_popular, is_vegetarian, is_vegan, is_gluten_free, calories, preparation_time, display_order)
    SELECT 
        chipotle_id,
        c.id,
        'Chicken Tacos',
        'Three soft tacos with grilled chicken, cheese, and your choice of salsa',
        7.95,
        false,
        false,
        false,
        false,
        480,
        5,
        1
    FROM menu_categories c 
    WHERE c.restaurant_id = chipotle_id AND c.name = 'Tacos'
    ON CONFLICT DO NOTHING;

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_popular, is_vegetarian, is_vegan, is_gluten_free, calories, preparation_time, display_order)
    SELECT 
        chipotle_id,
        c.id,
        'Chicken Salad',
        'Fresh lettuce with grilled chicken, cheese, and your choice of dressing',
        8.95,
        false,
        false,
        false,
        false,
        420,
        5,
        1
    FROM menu_categories c 
    WHERE c.restaurant_id = chipotle_id AND c.name = 'Salads'
    ON CONFLICT DO NOTHING;

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_popular, is_vegetarian, is_vegan, is_gluten_free, calories, preparation_time, display_order)
    SELECT 
        chipotle_id,
        c.id,
        'Chips & Guacamole',
        'Fresh tortilla chips with house-made guacamole',
        4.95,
        true,
        true,
        true,
        true,
        320,
        3,
        1
    FROM menu_categories c 
    WHERE c.restaurant_id = chipotle_id AND c.name = 'Sides & Drinks'
    ON CONFLICT DO NOTHING;

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_popular, is_vegetarian, is_vegan, is_gluten_free, calories, preparation_time, display_order)
    SELECT 
        chipotle_id,
        c.id,
        'Chips & Salsa',
        'Fresh tortilla chips with your choice of salsa',
        2.95,
        true,
        true,
        true,
        true,
        280,
        3,
        2
    FROM menu_categories c 
    WHERE c.restaurant_id = chipotle_id AND c.name = 'Sides & Drinks'
    ON CONFLICT DO NOTHING;

    -- Add menu categories for McDonald's
    INSERT INTO menu_categories (restaurant_id, name, description, display_order) 
    VALUES 
        (mcdonalds_id, 'Burgers', 'Classic McDonald''s burgers', 1),
        (mcdonalds_id, 'Chicken', 'Chicken sandwiches and nuggets', 2),
        (mcdonalds_id, 'Breakfast', 'Breakfast items', 3),
        (mcdonalds_id, 'Sides', 'Fries, apple slices, and more', 4),
        (mcdonalds_id, 'Beverages', 'Soft drinks, coffee, and shakes', 5)
    ON CONFLICT DO NOTHING;

    -- Add McDonald's menu items
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_popular, is_vegetarian, is_vegan, is_gluten_free, calories, preparation_time, display_order)
    SELECT 
        mcdonalds_id,
        c.id,
        'Big Mac',
        'Two all-beef patties, special sauce, lettuce, cheese, pickles, onions on a sesame seed bun',
        5.99,
        true,
        false,
        false,
        false,
        550,
        3,
        1
    FROM menu_categories c 
    WHERE c.restaurant_id = mcdonalds_id AND c.name = 'Burgers'
    ON CONFLICT DO NOTHING;

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_popular, is_vegetarian, is_vegan, is_gluten_free, calories, preparation_time, display_order)
    SELECT 
        mcdonalds_id,
        c.id,
        'Quarter Pounder with Cheese',
        'Quarter pound of 100% fresh beef, two slices of cheese, onions, pickles, ketchup, mustard on a sesame seed bun',
        5.99,
        true,
        false,
        false,
        false,
        520,
        3,
        2
    FROM menu_categories c 
    WHERE c.restaurant_id = mcdonalds_id AND c.name = 'Burgers'
    ON CONFLICT DO NOTHING;

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_popular, is_vegetarian, is_vegan, is_gluten_free, calories, preparation_time, display_order)
    SELECT 
        mcdonalds_id,
        c.id,
        'McChicken',
        'Crispy chicken patty, lettuce, and mayo on a sesame seed bun',
        4.99,
        false,
        false,
        false,
        false,
        400,
        3,
        1
    FROM menu_categories c 
    WHERE c.restaurant_id = mcdonalds_id AND c.name = 'Chicken'
    ON CONFLICT DO NOTHING;

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_popular, is_vegetarian, is_vegan, is_gluten_free, calories, preparation_time, display_order)
    SELECT 
        mcdonalds_id,
        c.id,
        'Chicken McNuggets (10 piece)',
        'Ten pieces of tender, juicy chicken breast meat',
        6.99,
        true,
        false,
        false,
        false,
        470,
        3,
        2
    FROM menu_categories c 
    WHERE c.restaurant_id = mcdonalds_id AND c.name = 'Chicken'
    ON CONFLICT DO NOTHING;

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_popular, is_vegetarian, is_vegan, is_gluten_free, calories, preparation_time, display_order)
    SELECT 
        mcdonalds_id,
        c.id,
        'World Famous Fries (Large)',
        'Crispy golden fries',
        3.99,
        true,
        true,
        true,
        true,
        510,
        2,
        1
    FROM menu_categories c 
    WHERE c.restaurant_id = mcdonalds_id AND c.name = 'Sides'
    ON CONFLICT DO NOTHING;

    -- Add menu categories for Starbucks
    INSERT INTO menu_categories (restaurant_id, name, description, display_order) 
    VALUES 
        (starbucks_id, 'Hot Coffee', 'Freshly brewed hot coffee', 1),
        (starbucks_id, 'Cold Coffee', 'Iced coffee and cold brew', 2),
        (starbucks_id, 'Espresso Drinks', 'Espresso-based beverages', 3),
        (starbucks_id, 'Tea', 'Hot and iced tea', 4),
        (starbucks_id, 'Food', 'Pastries, sandwiches, and snacks', 5)
    ON CONFLICT DO NOTHING;

    -- Add Starbucks menu items
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_popular, is_vegetarian, is_vegan, is_gluten_free, calories, preparation_time, display_order)
    SELECT 
        starbucks_id,
        c.id,
        'Pike Place Roast',
        'Our signature medium roast coffee',
        2.45,
        true,
        true,
        true,
        true,
        5,
        2,
        1
    FROM menu_categories c 
    WHERE c.restaurant_id = starbucks_id AND c.name = 'Hot Coffee'
    ON CONFLICT DO NOTHING;

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_popular, is_vegetarian, is_vegan, is_gluten_free, calories, preparation_time, display_order)
    SELECT 
        starbucks_id,
        c.id,
        'Iced Coffee',
        'Freshly brewed iced coffee',
        2.95,
        true,
        true,
        true,
        true,
        5,
        2,
        1
    FROM menu_categories c 
    WHERE c.restaurant_id = starbucks_id AND c.name = 'Cold Coffee'
    ON CONFLICT DO NOTHING;

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_popular, is_vegetarian, is_vegan, is_gluten_free, calories, preparation_time, display_order)
    SELECT 
        starbucks_id,
        c.id,
        'Caffè Latte',
        'Rich, full-bodied espresso with steamed milk',
        4.95,
        true,
        true,
        true,
        true,
        190,
        3,
        1
    FROM menu_categories c 
    WHERE c.restaurant_id = starbucks_id AND c.name = 'Espresso Drinks'
    ON CONFLICT DO NOTHING;

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_popular, is_vegetarian, is_vegan, is_gluten_free, calories, preparation_time, display_order)
    SELECT 
        starbucks_id,
        c.id,
        'Cappuccino',
        'Rich espresso with steamed milk and foam',
        4.95,
        true,
        true,
        true,
        true,
        120,
        3,
        2
    FROM menu_categories c 
    WHERE c.restaurant_id = starbucks_id AND c.name = 'Espresso Drinks'
    ON CONFLICT DO NOTHING;

    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_popular, is_vegetarian, is_vegan, is_gluten_free, calories, preparation_time, display_order)
    SELECT 
        starbucks_id,
        c.id,
        'Chocolate Croissant',
        'Buttery croissant with chocolate filling',
        3.95,
        true,
        true,
        false,
        false,
        320,
        1,
        1
    FROM menu_categories c 
    WHERE c.restaurant_id = starbucks_id AND c.name = 'Food'
    ON CONFLICT DO NOTHING;

END $$;
