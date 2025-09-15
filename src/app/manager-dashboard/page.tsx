"use client";

import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, ShoppingCart, CreditCard, CheckCircle, Search, MapPin, LogOut } from "lucide-react";
import Link from "next/link";
import { restaurantService } from "@/lib/restaurantService";
import { Restaurant } from "@/lib/googlePlaces";
import InviteManager from "@/components/InviteManager";


interface Order {
  id: string;
  user_id: string;
  user_name: string;
  items: string[];
  user_email?: string;
  created_at: string;
}

export default function ManagerDashboard() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [todayRestaurant, setTodayRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchLocation, setSearchLocation] = useState<string>("");

  // Redirect if not logged in
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/");
    }
  }, [user, isLoaded, router]);

  const today = new Date().toISOString().slice(0, 10);

  // Search for restaurants using Google Places API
  const searchRestaurants = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Build search query with location if provided
      let query = searchQuery;
      if (searchLocation.trim()) {
        query = `${searchQuery} in ${searchLocation.trim()}`;
      }
      
      const results = await restaurantService.searchRestaurants(query);
      setRestaurants(results);
    } catch (error) {
      console.error("Error searching restaurants:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Search nearby restaurants using current location
  const searchNearbyRestaurants = async () => {
    setIsSearching(true);
    try {
      const location = await restaurantService.getCurrentLocation();
      if (location) {
        // Search for restaurants near current location
        const results = await restaurantService.searchRestaurants("restaurants near me");
        setRestaurants(results);
      } else {
        alert("Unable to get your current location. Please enable location services or search by city name.");
      }
    } catch (error) {
      console.error("Error searching nearby restaurants:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch today's restaurant for the organization
  const fetchTodayRestaurant = async () => {
    const orgId = "018615c8-327d-4648-8072-52f1f2da6f34";
    
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("daily_restaurant_data")
      .eq("id", orgId)
      .single();

    if (orgError) {
      console.error("Error fetching org:", orgError);
      setTodayRestaurant(null);
      return;
    }

    if (org?.daily_restaurant_data) {
      // Use the stored Google Places data
      setTodayRestaurant(org.daily_restaurant_data);
    } else {
      setTodayRestaurant(null);
    }
  };

  useEffect(() => {
    fetchTodayRestaurant();
  }, [selectedRestaurantId]);

  // Fetch today's orders
  useEffect(() => {
    async function fetchOrders() {
      if (!todayRestaurant) {
        console.log("No restaurant selected, clearing orders");
        setOrders([]);
        return;
      }

      console.log("Fetching orders for restaurant:", todayRestaurant);
      console.log("Using place_id:", todayRestaurant.place_id);

      // Filter orders by today's date
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      // Temporarily skip orders fetching until database schema is updated
      console.log("Skipping orders fetch - database schema needs updating");
      setOrders([]);
      return;

      const { data: orderData, error } = await supabase
        .from("orders")
        .select("id, user_id, user_name, items, created_at")
        .eq("restaurant_id", todayRestaurant?.place_id)
        .gte("created_at", startOfDay.toISOString())
        .lte("created_at", endOfDay.toISOString());

      if (error) {
        console.error("Error fetching orders:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        setOrders([]);
        return;
      }

      console.log("Orders fetched successfully:", orderData);
      setOrders(orderData || []);
    }

    fetchOrders();
  }, [todayRestaurant]);

  // Show loading while checking authentication
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Loading manager dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const changeRestaurant = async (placeId: string) => {
    const orgId = "018615c8-327d-4648-8072-52f1f2da6f34";
    
    // Find the restaurant data from the search results
    const restaurant = restaurants.find(r => r.place_id === placeId);
    if (!restaurant) {
      console.error("Restaurant not found in search results");
      return;
    }

    const { error } = await supabase
      .from("organizations")
      .update({ 
        daily_restaurant_data: restaurant
      })
      .eq("id", orgId);

    if (error) {
      console.error("Error updating restaurant:", error);
    } else {
      setSelectedRestaurantId(placeId);
      // Refresh the today's restaurant data
      fetchTodayRestaurant();
    }
  };

  const clearRestaurant = async () => {
    const orgId = "018615c8-327d-4648-8072-52f1f2da6f34";
    
    const { error } = await supabase
      .from("organizations")
      .update({ daily_restaurant_id: null })
      .eq("id", orgId);

    if (error) {
      console.error("Error clearing restaurant:", error);
    } else {
      setSelectedRestaurantId(null);
      setTodayRestaurant(null);
    }
  };

  const deleteOrder = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (error) {
      console.error("Error deleting order:", error);
    } else {
      // Update local state to remove the deleted order
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
    }
  };

  // Generate order summary for checkout
  const getOrderSummary = () => {
    const itemCounts: { [key: string]: number } = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        itemCounts[item] = (itemCounts[item] || 0) + 1;
      });
    });

    return Object.entries(itemCounts).map(([item, count]) => ({
      item,
      count,
      total: count // In a real app, you'd multiply by price
    }));
  };

  const placeCollectiveOrder = async () => {
    if (!todayRestaurant || orders.length === 0) return;

    setIsPlacingOrder(true);
    
    // In a real app, this would integrate with the restaurant's ordering system
    // For now, we'll just mark orders as "placed" or delete them
    try {
      // Option 1: Delete all orders after placing (simulating successful order)
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("restaurant_id", todayRestaurant.place_id);

      if (error) {
        console.error("Error placing collective order:", error);
      } else {
        setOrders([]);
        setShowCheckout(false);
        alert("Collective order placed successfully! All individual orders have been processed.");
      }
    } catch (error) {
      console.error("Error placing collective order:", error);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-8 w-8" />
            Manager Dashboard
          </h1>
          <p className="text-muted-foreground">Manage restaurant selection and team orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/employee-dashboard">Employee View</Link>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => signOut()}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Restaurant</CardTitle>
        </CardHeader>
        <CardContent>
          {todayRestaurant ? (
            <p className="text-lg">{todayRestaurant.name}</p>
          ) : (
            <p className="text-muted-foreground">There is no restaurant today.</p>
          )}
        </CardContent>
      </Card>

      {/* Invite Manager */}
      <InviteManager 
        companyId="018615c8-327d-4648-8072-52f1f2da6f34" 
        companyName="Your Company" 
      />

      <Card>
        <CardHeader>
          <CardTitle>Change Today's Restaurant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search restaurants (e.g., 'pizza', 'sushi')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && searchRestaurants()}
              />
              <Button 
                onClick={searchRestaurants} 
                disabled={isSearching || !searchQuery.trim()}
                className="px-4"
              >
                <Search className="w-4 h-4 mr-2" />
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Location (optional, e.g., 'New York, NY')"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button 
                onClick={searchNearbyRestaurants} 
                disabled={isSearching}
                variant="outline"
                className="px-4"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {isSearching ? "Searching..." : "Nearby"}
              </Button>
            </div>
          </div>

          {/* Restaurant Selection */}
          {restaurants.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Click to select a restaurant:</label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {restaurants.map(restaurant => (
                  <div
                    key={restaurant.place_id}
                    onClick={() => changeRestaurant(restaurant.place_id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      todayRestaurant?.place_id === restaurant.place_id
                        ? 'bg-blue-50 border-blue-300'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{restaurant.name}</span>
                        {todayRestaurant?.place_id === restaurant.place_id && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Selected
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{restaurant.address}</span>
                      {restaurant.rating && (
                        <span className="text-sm text-yellow-600">⭐ {restaurant.rating}/5</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {todayRestaurant && (
            <Button 
              onClick={clearRestaurant}
              variant="outline"
              className="w-full"
            >
              Clear Restaurant Selection
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Today's Orders ({orders.length})</CardTitle>
            {orders.length > 0 && (
              <Button 
                onClick={() => setShowCheckout(!showCheckout)}
                className="flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                {showCheckout ? "Hide Checkout" : "Review & Checkout"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <Card key={order.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="font-medium">{order.user_name}</div>
                      <div className="text-sm text-muted-foreground">
                        Items: {order.items.join(", ")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Ordered at: {new Date(order.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Order</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this order? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteOrder(order.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checkout Section */}
      {showCheckout && orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Collective Order Checkout
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Order Summary for {todayRestaurant?.name}</h3>
              <div className="space-y-2">
                {getOrderSummary().map(({ item, count }) => (
                  <div key={item} className="flex justify-between items-center">
                    <span>{item}</span>
                    <span className="font-medium">Qty: {count}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 mt-4">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total Items:</span>
                  <span>{orders.reduce((total, order) => total + order.items.length, 0)}</span>
                </div>
                <div className="flex justify-between items-center font-semibold">
                  <span>Total Orders:</span>
                  <span>{orders.length}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={placeCollectiveOrder}
                disabled={isPlacingOrder}
                className="flex-1"
              >
                {isPlacingOrder ? (
                  "Placing Order..."
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Place Collective Order
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCheckout(false)}
                disabled={isPlacingOrder}
              >
                Cancel
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>⚠️ This will place one collective order for all employees and clear individual orders.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

