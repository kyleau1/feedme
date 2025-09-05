"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ShoppingCart, CheckCircle } from "lucide-react";
import Link from "next/link";

interface Restaurant {
  id: string;
  name: string;
  menu: string[];
}

interface CheckoutProps {
  restaurant: Restaurant;
  selectedItems: string[];
  onBack: () => void;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Get data from sessionStorage
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Load data from sessionStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkoutData = sessionStorage.getItem('checkoutData');
      if (checkoutData) {
        const { restaurant: restData, selectedItems: items } = JSON.parse(checkoutData);
        setRestaurant(restData);
        setSelectedItems(items);
      }
    }
  }, []);

  const submitOrder = async () => {
    if (!user || !restaurant) return;

    setIsSubmitting(true);
    setMessage("");

    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      restaurant_id: restaurant.id,
      items: selectedItems,
    });

    if (error) {
      setMessage("Error placing order: " + error.message);
    } else {
      setMessage("Order submitted successfully!");
      // Redirect to order page after a short delay
      setTimeout(() => {
        router.push("/order");
      }, 2000);
    }
    setIsSubmitting(false);
  };

  const goBack = () => {
    router.back();
  };

  if (!user) return <p>Loading user info...</p>;
  
  if (!restaurant || selectedItems.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">No items to checkout</h2>
            <p className="text-muted-foreground mb-4">
              Please go back and select items to order.
            </p>
            <Button onClick={() => router.push('/order')}>
              Back to Order Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={goBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-8 w-8" />
          Checkout
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {restaurant && (
            <div>
              <h3 className="font-semibold text-lg">{restaurant.name}</h3>
              <div className="mt-4">
                <h4 className="font-medium mb-2">Selected Items ({selectedItems.length}):</h4>
                <ul className="space-y-1">
                  {selectedItems.map((item, index) => (
                    <li key={index} className="flex justify-between items-center py-1">
                      <span>{item}</span>
                      <span className="text-sm text-muted-foreground">$0.00</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span>$0.00</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  *Pricing not available - contact restaurant for actual prices
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={submitOrder} 
              className="w-full" 
              disabled={isSubmitting || selectedItems.length === 0}
            >
              {isSubmitting ? "Placing Order..." : "Confirm & Place Order"}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={goBack} 
              className="w-full"
              disabled={isSubmitting}
            >
              Back to Menu
            </Button>
          </div>

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
    </div>
  );
}
