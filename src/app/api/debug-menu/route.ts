import { NextRequest, NextResponse } from 'next/server';
import { menuService } from '@/lib/menuService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get('placeId');

  if (!placeId) {
    return NextResponse.json({ error: 'Missing placeId parameter' }, { status: 400 });
  }

  try {
    console.log(`Testing menu detection for placeId: ${placeId}`);
    
    const hasMenu = await menuService.hasMenuData(placeId);
    const menuData = await menuService.getMenuByPlaceId(placeId);
    
    console.log(`Has menu data: ${hasMenu}`);
    console.log(`Menu data: ${menuData ? 'Found' : 'Not found'}`);
    
    return NextResponse.json({
      placeId,
      hasMenu,
      menuData: menuData ? {
        categories: menuData.categories?.length || 0,
        items: menuData.items?.length || 0,
        restaurant: menuData.restaurant?.name || 'Unknown'
      } : null
    });
  } catch (error: any) {
    console.error('Debug menu error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
