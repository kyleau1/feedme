import { NextRequest, NextResponse } from "next/server";
import { googlePlacesService } from "@/lib/googlePlaces";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const location = searchParams.get("location");
    const radius = searchParams.get("radius");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    let restaurants: any[] = [];

    // Get location coordinates
    let searchLat = lat ? parseFloat(lat) : 37.7749; // Default to San Francisco
    let searchLng = lng ? parseFloat(lng) : -122.4194;

    // If location string is provided, try to get coordinates from Google Places
    if (location && !lat && !lng) {
      try {
        // Use text search to get coordinates for the location
        const searchResults = await googlePlacesService.searchRestaurantsByQuery(location);
        if (searchResults.length > 0) {
          searchLat = searchResults[0].location.lat;
          searchLng = searchResults[0].location.lng;
        }
      } catch (error) {
        console.error('Error geocoding location:', error);
      }
    }

    // Note: DoorDash doesn't provide restaurant search API
    // We'll use local database and Google Places for restaurant discovery
    console.log('Using local database and Google Places for restaurant discovery...');
    
    // Search our local database
    if (query) {
      // Normalize query for better matching
      const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      let { data: dbRestaurants, error: dbError } = await supabase
        .from('restaurants')
        .select('*')
        .ilike('name', `%${query}%`)
        .eq('is_active', true);
      
      // If no results, try with normalized query
      if (!dbRestaurants || dbRestaurants.length === 0) {
        const { data: normalizedResults } = await supabase
          .from('restaurants')
          .select('*')
          .ilike('name', `%${normalizedQuery}%`)
          .eq('is_active', true);
        dbRestaurants = normalizedResults;
      }
      
      // If still no results, try with case-insensitive search
      if (!dbRestaurants || dbRestaurants.length === 0) {
        const { data: caseInsensitiveResults } = await supabase
          .from('restaurants')
          .select('*')
          .ilike('name', `%${query.toLowerCase()}%`)
          .eq('is_active', true);
        dbRestaurants = caseInsensitiveResults;
      }
      
      // If still no results, try with a more flexible search that handles apostrophes
      if (!dbRestaurants || dbRestaurants.length === 0) {
        const flexibleQuery = query.toLowerCase().replace(/['']/g, '');
        const { data: flexibleResults } = await supabase
          .from('restaurants')
          .select('*')
          .ilike('name', `%${flexibleQuery}%`)
          .eq('is_active', true);
        dbRestaurants = flexibleResults;
      }
      
      // If still no results, try with a search that adds apostrophes
      if (!dbRestaurants || dbRestaurants.length === 0) {
        const apostropheQuery = query.toLowerCase().replace(/s$/, "'s");
        const { data: apostropheResults } = await supabase
          .from('restaurants')
          .select('*')
          .ilike('name', `%${apostropheQuery}%`)
          .eq('is_active', true);
        dbRestaurants = apostropheResults;
      }
      
      if (dbRestaurants && dbRestaurants.length > 0) {
        restaurants = dbRestaurants.map(restaurant => ({
          id: restaurant.place_id,
          name: restaurant.name,
          address: restaurant.address,
          rating: restaurant.rating,
          price_level: restaurant.price_level,
          place_id: restaurant.place_id,
          types: restaurant.cuisine_types || [],
          location: {
            lat: restaurant.lat,
            lng: restaurant.lng
          },
          photos: restaurant.photos || [],
          opening_hours: { open_now: true },
          menu: restaurant.menu || [],
          source: 'local'
        }));
      }
    }

    // Search Google Places for additional results
    let googlePlacesRestaurants: any[] = [];
    try {
      if (query) {
        // Search by text query
        const searchLocation = lat && lng 
          ? { lat: parseFloat(lat), lng: parseFloat(lng) }
          : location || undefined;
        
        googlePlacesRestaurants = await googlePlacesService.searchRestaurantsByQuery(query, searchLocation);
      } else if (lat && lng) {
        // Search nearby restaurants by coordinates
        const searchLocation = { lat: parseFloat(lat), lng: parseFloat(lng) };
        const searchRadius = radius ? parseInt(radius) : 5000;
        
        googlePlacesRestaurants = await googlePlacesService.searchRestaurants(searchLocation, searchRadius);
      } else if (location) {
        // Search nearby restaurants by location string
        const searchRadius = radius ? parseInt(radius) : 5000;
        
        googlePlacesRestaurants = await googlePlacesService.searchRestaurants(location, searchRadius);
      } else if (!query) {
        return NextResponse.json(
          { error: "Please provide either a query parameter or location coordinates (lat/lng)" },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Google Places search failed:', error);
    }

    // Create a map of local restaurants by name for menu data lookup
    const localRestaurantsMap = new Map();
    restaurants.forEach(restaurant => {
      const normalizedName = restaurant.name.toLowerCase().trim();
      localRestaurantsMap.set(normalizedName, restaurant);
    });

    // Merge Google Places results with local menu data
    const mergedGooglePlacesRestaurants = googlePlacesRestaurants.map(restaurant => {
      const normalizedName = restaurant.name.toLowerCase().trim();
      const localRestaurant = localRestaurantsMap.get(normalizedName);
      
      if (localRestaurant && localRestaurant.menu) {
        // Merge local menu data into Google Places result
        return {
          ...restaurant,
          menu: localRestaurant.menu,
          source: 'merged' // Mark as merged
        };
      }
      
      return restaurant;
    });

    // Combine results and remove duplicates
    const allRestaurants = [...restaurants, ...mergedGooglePlacesRestaurants];
    const uniqueRestaurants = allRestaurants.filter((restaurant, index, self) => 
      index === self.findIndex(r => r.place_id === restaurant.place_id)
    );

    // Sort restaurants to prioritize those with menu data, then by rating
    const sortedRestaurants = uniqueRestaurants.sort((a, b) => {
      // Check if restaurant has menu data (either array format or JSONB with categories)
      const aHasMenu = a.menu && (
        (Array.isArray(a.menu) && a.menu.length > 0) ||
        (typeof a.menu === 'object' && a.menu.categories && Array.isArray(a.menu.categories) && a.menu.categories.length > 0)
      );
      const bHasMenu = b.menu && (
        (Array.isArray(b.menu) && b.menu.length > 0) ||
        (typeof b.menu === 'object' && b.menu.categories && Array.isArray(b.menu.categories) && b.menu.categories.length > 0)
      );
      
      // Prioritize merged restaurants (Google Places + menu data)
      if (a.source === 'merged' && b.source !== 'merged') return -1;
      if (a.source !== 'merged' && b.source === 'merged') return 1;
      
      // Restaurants with menus come first
      if (aHasMenu && !bHasMenu) return -1;
      if (!aHasMenu && bHasMenu) return 1;
      
      // If both have or don't have menus, sort by rating (highest first)
      return (b.rating || 0) - (a.rating || 0);
    });

    return NextResponse.json({ restaurants: sortedRestaurants });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch restaurants",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { placeId } = await request.json();

    if (!placeId) {
      return NextResponse.json(
        { error: "placeId is required" },
        { status: 400 }
      );
    }

    const restaurant = await googlePlacesService.getRestaurantDetails(placeId);

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ restaurant });
  } catch (error) {
    console.error("Error fetching restaurant details:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurant details" },
      { status: 500 }
    );
  }
}
