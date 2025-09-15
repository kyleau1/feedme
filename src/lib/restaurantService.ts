import { Restaurant } from "./googlePlaces";

export class RestaurantService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = "/api/restaurants";
  }

  /**
   * Search for restaurants by text query
   */
  async searchRestaurants(
    query: string,
    location?: string | { lat: number; lng: number },
    radius: number = 5000
  ): Promise<Restaurant[]> {
    try {
      const params = new URLSearchParams({
        query,
        radius: radius.toString(),
      });

      if (typeof location === "string") {
        params.append("location", location);
      } else if (location) {
        params.append("lat", location.lat.toString());
        params.append("lng", location.lng.toString());
      }

      const response = await fetch(`${this.baseUrl}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.restaurants || [];
    } catch (error) {
      console.error("Error searching restaurants:", error);
      throw error;
    }
  }

  /**
   * Search for restaurants near a location
   */
  async searchRestaurantsNearby(
    location: string | { lat: number; lng: number },
    radius: number = 5000
  ): Promise<Restaurant[]> {
    try {
      const params = new URLSearchParams({
        radius: radius.toString(),
      });

      if (typeof location === "string") {
        params.append("location", location);
      } else {
        params.append("lat", location.lat.toString());
        params.append("lng", location.lng.toString());
      }

      const url = `${this.baseUrl}?${params}`;
      console.log("Searching nearby restaurants:", url);

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Restaurants found:", data.restaurants?.length || 0);
      return data.restaurants || [];
    } catch (error) {
      console.error("Error searching nearby restaurants:", error);
      throw error;
    }
  }

  /**
   * Get restaurant details by place_id
   */
  async getRestaurantDetails(placeId: string): Promise<Restaurant | null> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ placeId }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.restaurant || null;
    } catch (error) {
      console.error("Error fetching restaurant details:", error);
      throw error;
    }
  }

  /**
   * Get user's current location
   */
  async getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          resolve(null);
        }
      );
    });
  }
}

// Export a singleton instance
export const restaurantService = new RestaurantService();


