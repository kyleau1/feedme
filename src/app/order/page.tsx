"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, CheckCircle, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

interface Restaurant {
  id: string;
  name: string;
  menu: string[];
}

export default function OrderPage() {
  const { user } = useUser();
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchRestaurants() {
      if (!user) return;

      // Replace this with the actual org UUID from your Supabase table
      const orgId = "018615c8-327d-4648-8072-52f1f2da6f34";

      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("id, daily_restaurant_id")
        .eq("id", orgId)
        .single();

      if (orgError) {
        console.error("Error fetching org:", orgError);
        return;
      }

      console.log("Org:", org);

      if (org?.daily_restaurant_id) {
        // Admin picked a restaurant
        const { data: restaurant, error: restError } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", org.daily_restaurant_id)
          .single();

        if (restError) {
          console.error("Error fetching restaurant:", restError);
        } else if (restaurant) {
          setSelectedRestaurant(restaurant);
        }
      } else {
        // No restaurant set → show all restaurants
        const { data: allRestaurants, error: allError } = await supabase
          .from("restaurants")
          .select("*");

        if (allError) console.error("Error fetching restaurants:", allError);
        else setRestaurants(allRestaurants || []);
      }
    }

    fetchRestaurants();
  }, [user]);

  const toggleItem = (item: string) => {
    setSelectedItems(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
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
    if (!user) return;

    const restaurantId = selectedRestaurant?.id;
    if (!restaurantId) {
      setMessage("Please select a restaurant first.");
      return;
    }

    // Get user's name from Clerk
    const userName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`.trim()
      : user.firstName || user.username || 'Unknown User';

    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      user_name: userName,
      restaurant_id: restaurantId,
      items: selectedItems,
    });

    if (error) setMessage("Error placing order: " + error.message);
    else setMessage("Order submitted!");
  };

  if (!user) return <p>Loading user info...</p>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <ShoppingCart className="h-8 w-8" />
        Order Food
      </h1>

      {/* Only show dropdown if admin hasn't picked a restaurant */}
      {!selectedRestaurant && restaurants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose a restaurant</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              onValueChange={(value) => {
                const r = restaurants.find(r => r.id === value);
                setSelectedRestaurant(r || null);
                setSelectedItems([]);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a restaurant" />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {selectedRestaurant && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {selectedRestaurant.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold">Select items:</h3>
              {selectedRestaurant.menu.map(item => (
                <div key={item} className="flex items-center space-x-2">
                  <Checkbox
                    id={item}
                    checked={selectedItems.includes(item)}
                    onCheckedChange={() => toggleItem(item)}
                  />
                  <label
                    htmlFor={item}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {item}
                  </label>
                </div>
              ))}
            </div>

            {selectedItems.length > 0 && (
              <div className="border-t pt-4">
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Selected items ({selectedItems.length}):</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {selectedItems.map(item => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <Button onClick={goToCheckout} className="w-full">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Checkout
                  </Button>
                  <Button onClick={submitOrder} variant="outline" className="w-full">
                    Submit Order Directly
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
    </div>
  );
}

