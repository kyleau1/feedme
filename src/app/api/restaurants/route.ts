import { NextRequest, NextResponse } from "next/server";
import { googlePlacesService } from "@/lib/googlePlaces";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const location = searchParams.get("location");
    const radius = searchParams.get("radius");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    let restaurants;

    if (query) {
      // Search by text query
      const searchLocation = lat && lng 
        ? { lat: parseFloat(lat), lng: parseFloat(lng) }
        : location || undefined;
      
      restaurants = await googlePlacesService.searchRestaurantsByQuery(query, searchLocation);
    } else if (lat && lng) {
      // Search nearby restaurants by coordinates
      const searchLocation = { lat: parseFloat(lat), lng: parseFloat(lng) };
      const searchRadius = radius ? parseInt(radius) : 5000;
      
      restaurants = await googlePlacesService.searchRestaurants(searchLocation, searchRadius);
    } else if (location) {
      // Search nearby restaurants by location string
      const searchRadius = radius ? parseInt(radius) : 5000;
      
      restaurants = await googlePlacesService.searchRestaurants(location, searchRadius);
    } else {
      return NextResponse.json(
        { error: "Please provide either a query parameter or location coordinates (lat/lng)" },
        { status: 400 }
      );
    }

    return NextResponse.json({ restaurants });
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
