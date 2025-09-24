const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Database error:', error);
      return;
    }
    
    console.log('Database connected successfully');
    console.log('Current restaurants count:', data?.length || 0);
    
    // Test inserting a simple restaurant
    const testRestaurant = {
      place_id: 'test_123',
      name: 'Test Restaurant',
      address: '123 Test St',
      lat: 37.7749,
      lng: -122.4194,
      rating: 4.0,
      price_level: 2,
      cuisine_types: ['american'],
      photos: [],
      is_active: true,
      menu: {
        categories: [{
          name: 'Test Category',
          items: [{
            id: 'test_item_1',
            name: 'Test Item',
            description: 'Test description',
            price: 9.99,
            category: 'Test Category',
            is_available: true,
            is_customizable: false,
            image_url: 'test.jpg',
            allergens: [],
            calories: 100,
            preparation_time: 5
          }]
        }]
      }
    };
    
    const { error: insertError } = await supabase
      .from('restaurants')
      .upsert(testRestaurant, { onConflict: 'place_id' });
    
    if (insertError) {
      console.error('Insert error:', insertError);
    } else {
      console.log('Test restaurant inserted successfully');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDatabase();
