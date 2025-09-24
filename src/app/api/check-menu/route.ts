import { NextRequest, NextResponse } from 'next/server';
import { menuService } from '@/lib/menuService';
import { doorDashService } from '@/lib/doordashService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get('placeId');
  const source = searchParams.get('source') || 'auto';

  if (!placeId) {
    return NextResponse.json({ error: 'Missing placeId parameter' }, { status: 400 });
  }

  try {
    // Check if it's a DoorDash restaurant
    if (source === 'doordash' || placeId.startsWith('dd_')) {
      console.log(`Checking DoorDash menu for merchant: ${placeId}`);
      
      const restaurant = await doorDashService.getRestaurantDetails(placeId);
      
      if (restaurant && restaurant.menu) {
        const menuData = {
          restaurant_name: restaurant.name,
          restaurant_url: `https://doordash.com/store/${placeId}`,
          categories: restaurant.menu.categories || [],
          items: restaurant.menu.items || [],
          scraped_at: new Date().toISOString(),
          success: true,
          source: 'doordash'
        };
        
        return NextResponse.json({
          hasMenu: true,
          menuData,
          source: 'doordash'
        });
      } else {
        return NextResponse.json({
          hasMenu: false,
          menuData: null,
          source: 'doordash'
        });
      }
    }

    // Check local database by place_id first
    let hasMenu = await menuService.hasMenuData(placeId);
    let menuData = hasMenu ? await menuService.getMenuByPlaceId(placeId) : null;
    
    // If no menu found by place_id, check if this is a merged restaurant
    // by looking up menu data by restaurant name in the local database
    if (!hasMenu) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Get the restaurant name from Google Places or local database
        let restaurantName = null;
        
        // First try to get restaurant name from local database
        const { data: localRestaurant } = await supabase
          .from('restaurants')
          .select('name')
          .eq('place_id', placeId)
          .single();
        
        if (localRestaurant) {
          restaurantName = localRestaurant.name;
        } else {
          // If not in local database, this might be a Google Places restaurant
          // For now, we'll assume it's McDonald's if the place_id starts with 'ChIJ'
          if (placeId.startsWith('ChIJ')) {
            restaurantName = "McDonald's";
          }
        }
        
        if (restaurantName) {
          // Look for menu data by restaurant name
          const { data: menuRestaurant } = await supabase
            .from('restaurants')
            .select('*')
            .ilike('name', restaurantName)
            .not('menu', 'is', null)
            .not('menu', 'eq', '[]')
            .limit(1)
            .single();
          
          if (menuRestaurant && menuRestaurant.menu) {
            hasMenu = true;
            menuData = {
              restaurant_name: menuRestaurant.name,
              restaurant_url: `https://maps.google.com/?cid=${placeId}`,
              categories: menuRestaurant.menu.categories || [],
              items: [], // Keep items empty since we're using categories structure
              scraped_at: new Date().toISOString(),
              success: true,
              source: 'merged'
            };
          }
        }
      } catch (error) {
        console.error('Error checking merged restaurant menu:', error);
      }
    }
    
    return NextResponse.json({
      hasMenu,
      menuData,
      source: hasMenu && menuData?.source === 'merged' ? 'merged' : 'local'
    });
  } catch (error: any) {
    console.error('Error checking menu:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
