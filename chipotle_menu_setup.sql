-- Chipotle Menu Setup with DoorDash-style Customization
-- This creates a complete Chipotle menu with customizable items

-- First, ensure we have the restaurant
INSERT INTO restaurants (
  place_id, name, address, city, state, zip_code, lat, lng, 
  rating, price_level, cuisine_types, is_active, menu
) VALUES (
  'ChIJN1t_tDeuEmsRUsoyG83frY4_chipotle',
  'Chipotle Mexican Grill',
  '123 Main St',
  'San Francisco',
  'CA',
  '94102',
  37.7749,
  -122.4194,
  4.2,
  2,
  ARRAY['Mexican', 'Fast Casual'],
  true,
  '[]'::jsonb
) ON CONFLICT (place_id) DO NOTHING;

-- Get the restaurant ID
DO $$
DECLARE
  chipotle_id UUID;
BEGIN
  SELECT id INTO chipotle_id FROM restaurants WHERE place_id = 'ChIJN1t_tDeuEmsRUsoyG83frY4_chipotle';
  
  -- Create categories
  INSERT INTO menu_categories (restaurant_id, name, description, display_order, is_active) VALUES
  (chipotle_id, 'Burritos', 'Our signature burritos with your choice of ingredients', 1, true),
  (chipotle_id, 'Bowls', 'Fresh bowls with your choice of ingredients', 2, true),
  (chipotle_id, 'Tacos', 'Soft and crispy tacos', 3, true),
  (chipotle_id, 'Salads', 'Fresh salads with protein', 4, true),
  (chipotle_id, 'Sides & Drinks', 'Sides and beverages', 5, true)
  ON CONFLICT DO NOTHING;

  -- Get category IDs
  DECLARE
    burrito_category_id UUID;
    bowl_category_id UUID;
    taco_category_id UUID;
    salad_category_id UUID;
    sides_category_id UUID;
  BEGIN
    SELECT id INTO burrito_category_id FROM menu_categories WHERE restaurant_id = chipotle_id AND name = 'Burritos';
    SELECT id INTO bowl_category_id FROM menu_categories WHERE restaurant_id = chipotle_id AND name = 'Bowls';
    SELECT id INTO taco_category_id FROM menu_categories WHERE restaurant_id = chipotle_id AND name = 'Tacos';
    SELECT id INTO salad_category_id FROM menu_categories WHERE restaurant_id = chipotle_id AND name = 'Salads';
    SELECT id INTO sides_category_id FROM menu_categories WHERE restaurant_id = chipotle_id AND name = 'Sides & Drinks';

    -- Create customizable menu items
    INSERT INTO menu_items (
      restaurant_id, category_id, name, description, price, currency, 
      image_url, is_available, is_popular, is_vegetarian, is_vegan, 
      is_gluten_free, calories, preparation_time, display_order
    ) VALUES
    -- Burritos
    (chipotle_id, burrito_category_id, 'Chicken Burrito', 'Build your own burrito with chicken', 8.50, 'USD', '/images/chipotle/chicken-burrito.jpg', true, true, false, false, false, 650, 5, 1),
    (chipotle_id, burrito_category_id, 'Steak Burrito', 'Build your own burrito with steak', 9.50, 'USD', '/images/chipotle/steak-burrito.jpg', true, true, false, false, false, 700, 5, 2),
    (chipotle_id, burrito_category_id, 'Barbacoa Burrito', 'Build your own burrito with barbacoa', 9.50, 'USD', '/images/chipotle/barbacoa-burrito.jpg', true, false, false, false, false, 720, 5, 3),
    (chipotle_id, burrito_category_id, 'Carnitas Burrito', 'Build your own burrito with carnitas', 9.50, 'USD', '/images/chipotle/carnitas-burrito.jpg', true, false, false, false, false, 680, 5, 4),
    (chipotle_id, burrito_category_id, 'Sofritas Burrito', 'Build your own burrito with sofritas (vegan)', 8.50, 'USD', '/images/chipotle/sofritas-burrito.jpg', true, false, true, true, false, 600, 5, 5),
    
    -- Bowls
    (chipotle_id, bowl_category_id, 'Chicken Bowl', 'Build your own bowl with chicken', 8.50, 'USD', '/images/chipotle/chicken-bowl.jpg', true, true, false, false, false, 580, 5, 1),
    (chipotle_id, bowl_category_id, 'Steak Bowl', 'Build your own bowl with steak', 9.50, 'USD', '/images/chipotle/steak-bowl.jpg', true, true, false, false, false, 620, 5, 2),
    (chipotle_id, bowl_category_id, 'Barbacoa Bowl', 'Build your own bowl with barbacoa', 9.50, 'USD', '/images/chipotle/barbacoa-bowl.jpg', true, false, false, false, false, 640, 5, 3),
    (chipotle_id, bowl_category_id, 'Carnitas Bowl', 'Build your own bowl with carnitas', 9.50, 'USD', '/images/chipotle/carnitas-bowl.jpg', true, false, false, false, false, 600, 5, 4),
    (chipotle_id, bowl_category_id, 'Sofritas Bowl', 'Build your own bowl with sofritas (vegan)', 8.50, 'USD', '/images/chipotle/sofritas-bowl.jpg', true, false, true, true, false, 520, 5, 5),
    
    -- Tacos
    (chipotle_id, taco_category_id, 'Chicken Tacos', '3 soft or crispy tacos with chicken', 7.50, 'USD', '/images/chipotle/chicken-tacos.jpg', true, true, false, false, false, 450, 5, 1),
    (chipotle_id, taco_category_id, 'Steak Tacos', '3 soft or crispy tacos with steak', 8.50, 'USD', '/images/chipotle/steak-tacos.jpg', true, false, false, false, false, 480, 5, 2),
    (chipotle_id, taco_category_id, 'Sofritas Tacos', '3 soft or crispy tacos with sofritas (vegan)', 7.50, 'USD', '/images/chipotle/sofritas-tacos.jpg', true, false, true, true, false, 420, 5, 3),
    
    -- Salads
    (chipotle_id, salad_category_id, 'Chicken Salad', 'Fresh salad with chicken', 8.50, 'USD', '/images/chipotle/chicken-salad.jpg', true, false, false, false, false, 400, 5, 1),
    (chipotle_id, salad_category_id, 'Steak Salad', 'Fresh salad with steak', 9.50, 'USD', '/images/chipotle/steak-salad.jpg', true, false, false, false, false, 420, 5, 2),
    (chipotle_id, salad_category_id, 'Sofritas Salad', 'Fresh salad with sofritas (vegan)', 8.50, 'USD', '/images/chipotle/sofritas-salad.jpg', true, false, true, true, false, 380, 5, 3),
    
    -- Sides & Drinks
    (chipotle_id, sides_category_id, 'Chips & Guacamole', 'Fresh tortilla chips with guacamole', 4.50, 'USD', '/images/chipotle/chips-guac.jpg', true, true, true, true, true, 320, 2, 1),
    (chipotle_id, sides_category_id, 'Chips & Queso', 'Fresh tortilla chips with queso', 3.50, 'USD', '/images/chipotle/chips-queso.jpg', true, false, false, false, true, 280, 2, 2),
    (chipotle_id, sides_category_id, 'Chips & Salsa', 'Fresh tortilla chips with salsa', 2.50, 'USD', '/images/chipotle/chips-salsa.jpg', true, false, true, true, true, 200, 2, 3),
    (chipotle_id, sides_category_id, 'Coca-Cola', 'Classic Coca-Cola', 2.50, 'USD', '/images/chipotle/coca-cola.jpg', true, false, true, false, true, 140, 1, 4),
    (chipotle_id, sides_category_id, 'Sprite', 'Refreshing Sprite', 2.50, 'USD', '/images/chipotle/sprite.jpg', true, false, true, false, true, 140, 1, 5),
    (chipotle_id, sides_category_id, 'Water', 'Bottled water', 1.50, 'USD', '/images/chipotle/water.jpg', true, false, true, true, true, 0, 1, 6)
    ON CONFLICT DO NOTHING;

  END;
END $$;
