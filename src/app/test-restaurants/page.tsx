"use client";

import { useState } from "react";
import { restaurantService } from "@/lib/restaurantService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestRestaurantsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const testSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError("");
    
    try {
      const results = await restaurantService.searchRestaurants(
        searchQuery,
        location.trim() || undefined
      );
      setRestaurants(results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testNearby = async () => {
    setLoading(true);
    setError("");
    
    try {
      const currentLocation = await restaurantService.getCurrentLocation();
      if (!currentLocation) {
        setError("Unable to get current location. Please enable location services.");
        return;
      }
      
      const results = await restaurantService.searchRestaurantsNearby(currentLocation);
      setRestaurants(results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Test Google Places API</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Search Restaurants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search query (e.g., 'pizza', 'sushi')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && testSearch()}
            />
            <Button onClick={testSearch} disabled={loading || !searchQuery.trim()}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Location (optional, e.g., 'New York, NY')"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <Button onClick={testNearby} disabled={loading} variant="outline">
              {loading ? "Searching..." : "Nearby"}
            </Button>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded">
              Error: {error}
            </div>
          )}
        </CardContent>
      </Card>

      {restaurants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({restaurants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {restaurants.map((restaurant, index) => (
                <div key={restaurant.place_id || index} className="p-4 border rounded">
                  <h3 className="font-semibold">{restaurant.name}</h3>
                  <p className="text-sm text-gray-600">{restaurant.address}</p>
                  {restaurant.rating && (
                    <p className="text-sm">⭐ {restaurant.rating}/5</p>
                  )}
                  {restaurant.price_level && (
                    <p className="text-sm">
                      Price: {"$".repeat(restaurant.price_level)}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Place ID: {restaurant.place_id}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


