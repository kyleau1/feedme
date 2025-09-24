import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST() {
  try {
    console.log('Testing restaurant insert...');
    
    // Simple restaurant data
    const restaurantData = {
      place_id: 'test_simple_123',
      name: 'Simple Test Restaurant',
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
    
    console.log('Attempting to insert:', restaurantData);
    
    const { data, error } = await supabase
      .from('restaurants')
      .insert(restaurantData);
    
    if (error) {
      console.error('Insert error details:', error);
      return NextResponse.json({ 
        error: error.message, 
        details: error,
        code: error.code,
        hint: error.hint
      }, { status: 500 });
    }
    
    console.log('Insert successful:', data);
    return NextResponse.json({ 
      success: true, 
      message: 'Restaurant inserted successfully',
      data: data
    });
    
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
