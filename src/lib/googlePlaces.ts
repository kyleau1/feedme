import { Client } from "@googlemaps/google-maps-services-js";

const client = new Client({});

export interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  price_level?: number;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  vicinity?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  rating?: number;
  price_level?: number;
  place_id: string;
  types: string[];
  location: {
    lat: number;
    lng: number;
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  menu?: string[]; // We'll keep this for now, but it won't come from Google Places
}

export class GooglePlacesService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    if (!this.apiKey) {
      console.warn("Google Maps API key not found. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.");
    }
  }

  /**
   * Search for restaurants near a location
   */
  async searchRestaurants(
    location: string | { lat: number; lng: number },
    radius: number = 5000, // 5km default radius
    type: string = "restaurant"
  ): Promise<Restaurant[]> {
    if (!this.apiKey) {
      throw new Error("Google Maps API key is required");
    }

    try {
      // Format location properly for the API
      let locationParam: string;
      if (typeof location === "string") {
        locationParam = location;
      } else {
        locationParam = `${location.lat},${location.lng}`;
      }

      const response = await client.placesNearby({
        params: {
          location: locationParam,
          radius,
          type,
          key: this.apiKey,
        },
      });

      const places = response.data.results || [];
      
      // Filter for restaurants and convert to our Restaurant interface
      const restaurants: Restaurant[] = places
        .filter((place: any) => 
          place.types?.includes("restaurant") || 
          place.types?.includes("food") ||
          place.types?.includes("meal_takeaway") ||
          place.types?.includes("meal_delivery")
        )
        .map((place: any) => this.convertPlaceToRestaurant(place));

      return restaurants;
    } catch (error) {
      console.error("Error fetching restaurants from Google Places:", error);
      throw error;
    }
  }

  /**
   * Get restaurant details by place_id
   */
  async getRestaurantDetails(placeId: string): Promise<Restaurant | null> {
    if (!this.apiKey) {
      throw new Error("Google Maps API key is required");
    }

    try {
      const response = await client.placeDetails({
        params: {
          place_id: placeId,
          fields: [
            "place_id",
            "name",
            "formatted_address",
            "rating",
            "price_level",
            "types",
            "geometry",
            "photos",
            "opening_hours",
            "vicinity"
          ],
          key: this.apiKey,
        },
      });

      if (response.data.result) {
        return this.convertPlaceToRestaurant(response.data.result as GooglePlace);
      }

      return null;
    } catch (error) {
      console.error("Error fetching restaurant details:", error);
      throw error;
    }
  }

  /**
   * Search restaurants by text query
   */
  async searchRestaurantsByQuery(
    query: string,
    location?: string | { lat: number; lng: number },
    radius: number = 5000
  ): Promise<Restaurant[]> {
    if (!this.apiKey) {
      throw new Error("Google Maps API key is required");
    }

    try {
      // Format location properly for the API
      let locationParam: string | undefined;
      if (location) {
        if (typeof location === "string") {
          locationParam = location;
        } else {
          locationParam = `${location.lat},${location.lng}`;
        }
      }

      const response = await client.textSearch({
        params: {
          query: `${query} restaurant`,
          key: this.apiKey,
        },
      });

      const places = response.data.results || [];
      
      const restaurants: Restaurant[] = places
        .filter((place: any) => 
          place.types?.includes("restaurant") || 
          place.types?.includes("food") ||
          place.types?.includes("meal_takeaway") ||
          place.types?.includes("meal_delivery")
        )
        .map((place: any) => this.convertPlaceToRestaurant(place));

      return restaurants;
    } catch (error) {
      console.error("Error searching restaurants:", error);
      throw error;
    }
  }

  /**
   * Convert Google Place to our Restaurant interface
   */
  private convertPlaceToRestaurant(place: any): Restaurant {
    return {
      id: place.place_id || place.id || "",
      name: place.name || "",
      address: place.formatted_address || place.vicinity || "",
      rating: place.rating,
      price_level: place.price_level,
      place_id: place.place_id || place.id || "",
      types: place.types || [],
      location: {
        lat: place.geometry?.location?.lat || 0,
        lng: place.geometry?.location?.lng || 0,
      },
      photos: place.photos,
      opening_hours: place.opening_hours,
      menu: [], // We'll keep this empty for now, as Google Places doesn't provide menu data
    };
  }

  /**
   * Get photo URL from photo reference
   */
  getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
    if (!this.apiKey) {
      return "";
    }
    
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${this.apiKey}`;
  }
}

// Export a singleton instance
export const googlePlacesService = new GooglePlacesService();
