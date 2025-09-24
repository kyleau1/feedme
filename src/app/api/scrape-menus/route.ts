import { NextRequest, NextResponse } from 'next/server';
import { menuScrapingService } from '@/lib/menuScrapingService';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { restaurantName, restaurantUrl } = await request.json();

    if (!restaurantName || !restaurantUrl) {
      return NextResponse.json(
        { error: 'restaurantName and restaurantUrl are required' },
        { status: 400 }
      );
    }

    console.log(`Starting menu scraping for ${restaurantName} at ${restaurantUrl}`);

    // Scrape the menu
    const scrapedData = await menuScrapingService.scrapeRestaurantMenu(restaurantName, restaurantUrl);

    if (!scrapedData.success) {
      return NextResponse.json(
        { 
          error: 'Menu scraping failed', 
          details: scrapedData.error 
        },
        { status: 500 }
      );
    }

    // Transform scraped data to match our database schema
    const transformedMenu = {
      categories: scrapedData.categories.map(category => ({
        id: null,
        name: category.name,
        items: category.items.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          image_url: item.image_url,
          calories: item.calories,
          is_available: item.is_available,
          is_popular: item.is_popular,
          is_customizable: item.is_customizable,
          preparation_time: 15
        }))
      }))
    };

    // Save to database
    const { data, error } = await supabase
      .from('restaurants')
      .upsert({
        name: restaurantName,
        place_id: `scraped_${restaurantName.toLowerCase().replace(/\s+/g, '_')}`,
        address: 'Scraped from web',
        lat: 0,
        lng: 0,
        rating: 4.0,
        price_level: 2,
        cuisine_types: ['scraped'],
        photos: '[]' as any,
        is_active: true,
        menu: transformedMenu
      }, {
        onConflict: 'place_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save scraped menu to database', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully scraped and saved menu for ${restaurantName}`,
      data: {
        restaurant_id: data.id,
        categories_count: scrapedData.categories.length,
        total_items: scrapedData.categories.reduce((sum, cat) => sum + cat.items.length, 0),
        scraped_at: scrapedData.scraped_at
      }
    });

  } catch (error: any) {
    console.error('Scraping API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantName = searchParams.get('restaurant');
    const restaurantUrl = searchParams.get('url');

    if (!restaurantName || !restaurantUrl) {
      return NextResponse.json(
        { error: 'restaurant and url parameters are required' },
        { status: 400 }
      );
    }

    console.log(`Starting menu scraping for ${restaurantName} at ${restaurantUrl}`);

    // Scrape the menu
    const scrapedData = await menuScrapingService.scrapeRestaurantMenu(restaurantName, restaurantUrl);

    return NextResponse.json({
      success: scrapedData.success,
      data: scrapedData,
      error: scrapedData.error
    });

  } catch (error: any) {
    console.error('Scraping API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}