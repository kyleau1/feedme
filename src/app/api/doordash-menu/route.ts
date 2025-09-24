import { NextRequest, NextResponse } from "next/server";
import { doorDashService } from "@/lib/doordashService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get("merchantId");

    if (!merchantId) {
      return NextResponse.json(
        { error: "merchantId is required" },
        { status: 400 }
      );
    }

    console.log(`Fetching DoorDash menu for merchant: ${merchantId}`);

    // Get restaurant details including menu
    const restaurant = await doorDashService.getRestaurantDetails(merchantId);

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    if (!restaurant.menu) {
      return NextResponse.json(
        { error: "Menu not available for this restaurant" },
        { status: 404 }
      );
    }

    // Transform DoorDash menu to our format
    const menuData = {
      restaurant_name: restaurant.name,
      restaurant_url: `https://doordash.com/store/${merchantId}`,
      categories: restaurant.menu.categories || [],
      items: restaurant.menu.items || [],
      scraped_at: new Date().toISOString(),
      success: true,
      source: 'doordash'
    };

    return NextResponse.json({ menuData });
  } catch (error) {
    console.error("Error fetching DoorDash menu:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch menu",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
