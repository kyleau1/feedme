// Test what the photos column expects
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testPhotos() {
  try {
    // Test with empty array
    console.log('Testing with empty array...');
    const { error: error1 } = await supabase
      .from('restaurants')
      .insert({
        place_id: 'test_photos_1',
        name: 'Test Photos 1',
        address: '123 Test St',
        lat: 37.7749,
        lng: -122.4194,
        rating: 4.0,
        price_level: 2,
        cuisine_types: ['american'],
        photos: [],
        is_active: true,
        menu: { categories: [] }
      });
    
    if (error1) {
      console.log('Empty array error:', error1.message);
    } else {
      console.log('Empty array worked!');
    }
    
    // Test with JSON string
    console.log('Testing with JSON string...');
    const { error: error2 } = await supabase
      .from('restaurants')
      .insert({
        place_id: 'test_photos_2',
        name: 'Test Photos 2',
        address: '123 Test St',
        lat: 37.7749,
        lng: -122.4194,
        rating: 4.0,
        price_level: 2,
        cuisine_types: ['american'],
        photos: [],
        is_active: true,
        menu: { categories: [] }
      });
    
    if (error2) {
      console.log('JSON string error:', error2.message);
    } else {
      console.log('JSON string worked!');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPhotos();
