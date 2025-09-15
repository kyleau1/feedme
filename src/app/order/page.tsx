"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ShoppingCart, CheckCircle, CreditCard, Search, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { restaurantService } from "@/lib/restaurantService";
import { Restaurant } from "@/lib/googlePlaces";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

export default function OrderPage() {
  const { user } = useUser();
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Load nearby restaurants on component mount
  useEffect(() => {
    async function loadNearbyRestaurants() {
      if (!user) return;

      try {
        setIsSearching(true);
        setMessage("");
        
        // Get user's current location
        const location = await restaurantService.getCurrentLocation();
        
        if (location) {
          // Search for nearby restaurants
          const nearbyRestaurants = await restaurantService.searchRestaurantsNearby(location);
          setRestaurants(nearbyRestaurants);
        } else {
          // Fallback to a default location (San Francisco)
          const defaultLocation = { lat: 37.7749, lng: -122.4194 };
          const nearbyRestaurants = await restaurantService.searchRestaurantsNearby(defaultLocation);
          setRestaurants(nearbyRestaurants);
        }
      } catch (error) {
        console.error("Error loading nearby restaurants:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        
        if (errorMessage.includes("Google Maps API key")) {
          setMessage("Google Maps API key not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.");
        } else if (errorMessage.includes("HTTP error! status: 400")) {
          setMessage("Error loading restaurants. Please try searching manually or check your Google Maps API configuration.");
        } else {
          setMessage("Error loading restaurants. Please try searching manually.");
        }
      } finally {
        setIsSearching(false);
      }
    }

    loadNearbyRestaurants();
  }, [user]);

  // Search for restaurants
  const searchRestaurants = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      let query = searchQuery;
      if (searchLocation.trim()) {
        query = `${searchQuery} in ${searchLocation.trim()}`;
      }
      
      const results = await restaurantService.searchRestaurants(query);
      setRestaurants(results);
    } catch (error) {
      console.error("Error searching restaurants:", error);
      setMessage("Error searching restaurants. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const toggleItem = (itemName: string, price: number = 10.00) => {
    setSelectedItems(prev => {
      const existingItem = prev.find(item => item.name === itemName);
      if (existingItem) {
        return prev.filter(item => item.name !== itemName);
      } else {
        return [...prev, { name: itemName, price, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (itemName: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedItems(prev => prev.filter(item => item.name !== itemName));
      return;
    }
    
    setSelectedItems(prev =>
      prev.map(item =>
        item.name === itemName ? { ...item, quantity } : item
      )
    );
  };

  const goToCheckout = () => {
    if (!selectedRestaurant || selectedItems.length === 0) {
      setMessage("Please select a restaurant and items first.");
      return;
    }
    
    // Store data in sessionStorage for checkout page
    sessionStorage.setItem('checkoutData', JSON.stringify({
      restaurant: selectedRestaurant,
      selectedItems: selectedItems
    }));
    
    router.push('/checkout');
  };

  const submitOrder = async () => {
    if (!user || !selectedRestaurant) return;

    try {
      // Get user's name from Clerk or session storage - with better fallbacks
      let userName = 'Unknown User';
      
      // First try to get names from session storage (from custom sign-up)
      if (typeof window !== 'undefined') {
        const storedNames = sessionStorage.getItem('userNames');
        if (storedNames) {
          try {
            const { firstName, lastName } = JSON.parse(storedNames);
            if (firstName && lastName) {
              userName = `${firstName} ${lastName}`.trim();
            } else if (firstName) {
              userName = firstName;
            }
          } catch (e) {
            // Fall back to Clerk user data
          }
        }
      }
      
      // Fall back to Clerk user data if no session storage names
      if (userName === 'Unknown User') {
        if (user.firstName && user.lastName) {
          userName = `${user.firstName} ${user.lastName}`.trim();
        } else if (user.firstName) {
          userName = user.firstName;
        } else if (user.username) {
          userName = user.username;
        } else if (user.emailAddresses?.[0]?.emailAddress) {
          // Use email prefix as fallback
          const email = user.emailAddresses[0].emailAddress;
          userName = email.split('@')[0];
        }
      }

      // Generate unique external delivery ID
      const externalDeliveryId = `feedme_${Date.now()}_${user.id}`;

      // Save order to database
      const { data: orderData, error: dbError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          user_name: userName,
          restaurant_id: selectedRestaurant.place_id,
          items: selectedItems.map(item => item.name),
          external_delivery_id: externalDeliveryId,
          delivery_status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) {
        throw new Error("Database error: " + dbError.message);
      }

      setMessage("Order submitted successfully! Use 'Proceed to Checkout' for DoorDash delivery.");
    } catch (error) {
      console.error('Order error:', error);
      setMessage("Error placing order: " + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (!user) return <p>Loading user info...</p>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-8 w-8" />
          Order Food
        </h1>
        <Button 
          variant="outline" 
          onClick={() => router.push('/orders')}
          className="flex items-center gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          View My Orders
        </Button>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Restaurants
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchRestaurants()}
            />
            <Input
              placeholder="Location (optional)"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="w-48"
            />
            <Button onClick={searchRestaurants} disabled={isSearching || !searchQuery.trim()}>
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
          
          {isSearching && (
            <p className="text-sm text-muted-foreground">Searching for restaurants...</p>
          )}
        </CardContent>
      </Card>

      {/* Restaurant Selection */}
      {restaurants.length > 0 && !selectedRestaurant && (
        <Card>
          <CardHeader>
            <CardTitle>Choose a restaurant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {restaurants.map(restaurant => (
                <div
                  key={restaurant.place_id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    setSelectedRestaurant(restaurant);
                    setSelectedItems([]);
                  }}
                >
                  <div>
                    <h3 className="font-semibold">{restaurant.name}</h3>
                    <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                    {restaurant.rating && (
                      <p className="text-sm text-muted-foreground">⭐ {restaurant.rating}/5</p>
                    )}
                  </div>
                  <CheckCircle className="h-5 w-5 text-gray-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Restaurant and Menu */}
      {selectedRestaurant && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {selectedRestaurant.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{selectedRestaurant.address}</p>
            {selectedRestaurant.rating && (
              <p className="text-sm text-muted-foreground">⭐ {selectedRestaurant.rating}/5</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold">Select items (demo menu):</h3>
              {[
                "Burger", "Pizza", "Pasta", "Salad", "Sandwich", 
                "Chicken Wings", "Fries", "Soup", "Dessert", "Drink"
              ].map(item => {
                const selectedItem = selectedItems.find(i => i.name === item);
                return (
                  <div key={item} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={item}
                        checked={!!selectedItem}
                        onCheckedChange={() => toggleItem(item, 10.00)}
                      />
                      <label
                        htmlFor={item}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {item}
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">$10.00</span>
                      {selectedItem && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item, selectedItem.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{selectedItem.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item, selectedItem.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedItems.length > 0 && (
              <div className="border-t pt-4">
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Selected items ({selectedItems.length}):</h4>
                  <ul className="space-y-1">
                    {selectedItems.map(item => (
                      <li key={item.name} className="flex justify-between text-sm">
                        <span>{item.name} x{item.quantity}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>${selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button onClick={goToCheckout} className="w-full">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Checkout (DoorDash Delivery)
                  </Button>
                  <Button onClick={submitOrder} variant="outline" className="w-full">
                    Submit Order Directly (No Delivery)
                  </Button>
                </div>
              </div>
            )}

            {message && (
              <div className={`p-3 rounded-md ${
                message.includes("Error") 
                  ? "bg-red-50 text-red-700 border border-red-200" 
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}>
                {message}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {restaurants.length === 0 && !isSearching && (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No restaurants found</h3>
            <p className="text-muted-foreground mb-4">
              Try searching for restaurants manually or check your Google Maps API configuration.
            </p>
            <div className="space-y-2">
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("restaurants");
                  searchRestaurants();
                }}
              >
                Try Manual Search
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

