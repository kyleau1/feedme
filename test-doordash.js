// Test DoorDash integration
import { doorDashService } from './src/lib/doordashService.js';

async function testDoorDash() {
  console.log('🚀 Testing DoorDash integration...');
  
  try {
    // Test restaurant search
    console.log('📍 Searching for restaurants near San Francisco...');
    const restaurants = await doorDashService.searchRestaurants(37.7749, -122.4194, 5000);
    
    console.log(`✅ Found ${restaurants.length} DoorDash restaurants`);
    
    if (restaurants.length > 0) {
      console.log('🍕 First restaurant:', {
        name: restaurants[0].name,
        address: restaurants[0].address,
        rating: restaurants[0].rating
      });
      
      // Test getting restaurant details
      console.log('🔍 Getting restaurant details...');
      const details = await doorDashService.getRestaurantDetails(restaurants[0].id);
      
      if (details) {
        console.log('✅ Restaurant details:', {
          name: details.name,
          hasMenu: !!details.menu,
          menuCategories: details.menu?.categories?.length || 0
        });
      }
    }
    
  } catch (error) {
    console.error('❌ DoorDash test failed:', error.message);
    console.error('Full error:', error);
  }
}

testDoorDash();
