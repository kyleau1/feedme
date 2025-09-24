"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ShoppingCart, CheckCircle, CreditCard, Search, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { restaurantService } from "@/lib/restaurantService";
import { Restaurant } from "@/lib/googlePlaces";
import { OrderItem, MenuData } from "@/lib/menuTypes";
import EnhancedMenuDisplay from "@/components/EnhancedMenuDisplay";
import { EnhancedMenuItem, ItemCustomization } from "@/lib/enhancedMenuTypes";
import { EnhancedMenuService } from "@/lib/enhancedMenuService";
import { useCart } from "@/contexts/CartContext";

// Remove duplicate interface - using the one from menuTypes

export default function OrderPage() {
  const { user } = useUser();
  const router = useRouter();
  const { addItem, items: cartItems } = useCart();

  // Debug: Log cart items
  useEffect(() => {
    console.log('Order page - Cart items:', cartItems);
    console.log('Order page - Cart length:', cartItems.length);
  }, [cartItems]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasMenuData, setHasMenuData] = useState<boolean | null>(null);
  const [showRestaurantList, setShowRestaurantList] = useState(true);
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [menuFilters, setMenuFilters] = useState({
    category_id: undefined,
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: false,
    is_spicy: false,
    is_popular: false,
    max_price: undefined,
    min_price: undefined,
    search_query: ""
  });

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
    const existingItem = cartItems.find(item => item.name === itemName);
    if (existingItem) {
      // Item exists, remove it
      const itemToRemove = cartItems.find(item => item.name === itemName);
      if (itemToRemove) {
        // This will be handled by the cart context
        return;
      }
    } else {
      // Add new item
      const newItem: OrderItem = { 
        id: `demo-${itemName.toLowerCase().replace(/\s+/g, '-')}`,
        name: itemName, 
        base_price: price,
        quantity: 1,
        total_price: price,
        selected_variant: undefined,
        selected_modifiers: []
      };
      addItem(newItem);
    }
  };

  const updateQuantity = (itemName: string, quantity: number) => {
    const item = cartItems.find(item => item.name === itemName);
    if (item) {
      if (quantity <= 0) {
        // Remove item - this will be handled by cart context
        return;
      }
      // Update quantity - this will be handled by cart context
    }
  };

  const goToCheckout = () => {
    if (!selectedRestaurant || cartItems.length === 0) {
      setMessage("Please select a restaurant and items first.");
      return;
    }
    
    // Store data in sessionStorage for checkout page
    sessionStorage.setItem('checkoutData', JSON.stringify({
      restaurant: selectedRestaurant,
      selectedItems: cartItems
    }));
    
    router.push('/checkout');
  };

  const handleEnhancedAddToCart = (item: EnhancedMenuItem, customizations: ItemCustomization[], totalPrice: number, quantity: number) => {
    const orderItem: OrderItem = {
      id: item.id,
      name: item.name,
      description: item.description,
      base_price: item.price,
      quantity: quantity,
      selected_variant: undefined,
      selected_modifiers: customizations.map(c => ({
        id: c.choice_id,
        name: c.choice_name,
        price_modifier: c.total_modifier
      })),
      total_price: totalPrice,
      special_instructions: EnhancedMenuService.generateCustomizationSummary(customizations)
    };

    addItem(orderItem);
    setMessage(`Added ${quantity}x ${item.name} to cart!`);
  };

  const handleMenuSearch = (query: string) => {
    setMenuFilters(prev => ({ ...prev, search_query: query }));
  };

  const handleMenuFilter = (filters: any) => {
    setMenuFilters(prev => ({ ...prev, ...filters }));
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
          items: cartItems.map(item => item.name),
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
            {selectedRestaurant ? "Search for Different Restaurant" : "Find Restaurants"}
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
      {restaurants.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {selectedRestaurant ? "Choose a Different Restaurant" : "Choose a Restaurant"}
              </CardTitle>
              {selectedRestaurant && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRestaurantList(!showRestaurantList)}
                  className="flex items-center gap-2"
                >
                  {showRestaurantList ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Hide
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          {(!selectedRestaurant || showRestaurantList) && (
            <CardContent>
              <div className="space-y-3">
                {restaurants.map(restaurant => (
                  <div
                    key={restaurant.place_id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      selectedRestaurant?.place_id === restaurant.place_id 
                        ? 'bg-green-50 border-green-200' 
                        : ''
                    }`}
                    onClick={async () => {
                      setSelectedRestaurant(restaurant);
                      setShowRestaurantList(false); // Collapse after selection
                      
                    // Check if restaurant has menu data
                    try {
                      console.log("Checking menu data for restaurant:", restaurant.name, "place_id:", restaurant.place_id, "source:", restaurant.source);
                      
                      const source = restaurant.source || 'auto';
                      const response = await fetch(`/api/check-menu?placeId=${encodeURIComponent(restaurant.place_id)}&source=${source}`);
                      const data = await response.json();
                      
                      setHasMenuData(data.hasMenu);
                      
                      if (data.hasMenu && data.menuData) {
                        setMenuData(data.menuData);
                      } else {
                        setMenuData(null);
                      }
                    } catch (error) {
                      console.error("Error checking menu data:", error);
                      setHasMenuData(false);
                      setMenuData(null);
                    }
                    }}
                  >
                    <div>
                      <h3 className="font-semibold">{restaurant.name}</h3>
                      <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                      {restaurant.rating && (
                        <p className="text-sm text-muted-foreground">⭐ {restaurant.rating}/5</p>
                      )}
                    </div>
                    {selectedRestaurant?.place_id === restaurant.place_id ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Selected Restaurant and Menu */}
      {selectedRestaurant && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    {selectedRestaurant.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{selectedRestaurant.address}</p>
                  {selectedRestaurant.rating && (
                    <p className="text-sm text-muted-foreground">⭐ {selectedRestaurant.rating}/5</p>
                  )}
                  {hasMenuData === true && (
                    <p className="text-sm text-green-600">
                      ✓ Real menu available {
                        menuData?.source === 'doordash' ? '(DoorDash)' : 
                        selectedRestaurant.source === 'merged' ? '(Google + Local)' :
                        '(Local)'
                      }
                    </p>
                  )}
                  {hasMenuData === false && (
                    <p className="text-sm text-yellow-600">⚠ Using demo menu</p>
                  )}
                  {hasMenuData === null && (
                    <p className="text-sm text-gray-600">Checking menu...</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Debug: hasMenuData={String(hasMenuData)}, menuData={menuData ? 'loaded' : 'null'}, source={menuData?.source || 'unknown'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowRestaurantList(!showRestaurantList)}
                    className="flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    {showRestaurantList ? "Hide Options" : "Change Restaurant"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedRestaurant(null);
                      setHasMenuData(null);
                      setSearchQuery("");
                      setSearchLocation("");
                      setShowRestaurantList(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    New Search
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {hasMenuData === true && menuData ? (
            <EnhancedMenuDisplay 
              menuData={menuData} 
              onAddToCart={handleEnhancedAddToCart}
              onSearch={handleMenuSearch}
              onFilter={handleMenuFilter}
              searchQuery={menuFilters.search_query || ""}
              filters={menuFilters}
              stats={{
                total_items: menuData?.items?.length || (menuData?.categories?.flatMap((cat: any) => cat.items || []).length || 0),
                total_categories: menuData?.categories?.length || 0,
                available_items: menuData?.items?.filter((item: any) => item.is_available).length || (menuData?.categories?.flatMap((cat: any) => cat.items || []).filter((item: any) => item.is_available).length || 0),
                popular_items: menuData?.items?.filter((item: any) => item.is_popular).length || (menuData?.categories?.flatMap((cat: any) => cat.items || []).filter((item: any) => item.is_popular).length || 0),
                vegetarian_items: menuData?.items?.filter((item: any) => item.is_vegetarian).length || (menuData?.categories?.flatMap((cat: any) => cat.items || []).filter((item: any) => item.is_vegetarian).length || 0),
                vegan_items: menuData?.items?.filter((item: any) => item.is_vegan).length || (menuData?.categories?.flatMap((cat: any) => cat.items || []).filter((item: any) => item.is_vegan).length || 0),
                average_price: menuData?.items?.reduce((sum: number, item: any) => sum + item.price, 0) / (menuData?.items?.length || 1) || (menuData?.categories?.flatMap((cat: any) => cat.items || []).reduce((sum: number, item: any) => sum + item.price, 0) / (menuData?.categories?.flatMap((cat: any) => cat.items || []).length || 1) || 0),
                price_range: {
                  min: menuData?.items?.length ? Math.min(...menuData.items.map((item: any) => item.price)) : (menuData?.categories?.flatMap((cat: any) => cat.items || []).length ? Math.min(...menuData.categories.flatMap((cat: any) => cat.items || []).map((item: any) => item.price)) : 0),
                  max: menuData?.items?.length ? Math.max(...menuData.items.map((item: any) => item.price)) : (menuData?.categories?.flatMap((cat: any) => cat.items || []).length ? Math.max(...menuData.categories.flatMap((cat: any) => cat.items || []).map((item: any) => item.price)) : 0)
                }
              }}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Demo Menu</CardTitle>
                <p className="text-sm text-muted-foreground">
                  This restaurant doesn't have a real menu yet. Here's a demo menu for testing.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h3 className="font-semibold">Select items (demo menu):</h3>
                  {[
                    "Burger", "Pizza", "Pasta", "Salad", "Sandwich", 
                    "Chicken Wings", "Fries", "Soup", "Dessert", "Drink"
                  ].map(item => {
                    const selectedItem = cartItems.find(i => i.name === item);
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
              </CardContent>
            </Card>
          )}

          {cartItems.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Selected items ({cartItems.length}):</h4>
                  <ul className="space-y-1">
                    {cartItems.map((item, index) => (
                      <li key={`${item.id}-${index}`} className="flex justify-between text-sm">
                        <span>{item.name} x{item.quantity}</span>
                        <span>${(item.base_price * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>${cartItems.reduce((total, item) => total + (item.total_price || 0), 0).toFixed(2)}</span>
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
              </CardContent>
            </Card>
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
        </div>
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

