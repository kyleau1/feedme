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
  place_id?: string;
  address?: string;
  rating?: number;
}

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface CheckoutProps {
  restaurant: Restaurant;
  selectedItems: OrderItem[];
  onBack: () => void;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Get data from sessionStorage
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);

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

      // Generate unique external delivery ID with more randomness
      const externalDeliveryId = `feedme_${Date.now()}_${user.id}_${Math.random().toString(36).substr(2, 9)}`;

      // First, save order to database
      const { data: orderData, error: dbError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          user_name: userName,
          restaurant_id: restaurant.place_id || restaurant.id,
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

      console.log('Order saved to database:', orderData);

      // Try to place DoorDash delivery
      try {
        // Check if DoorDash is configured
        const configResponse = await fetch('/api/doordash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check-config' })
        });

        if (!configResponse.ok) {
          throw new Error('DoorDash service not available');
        }

        // For demo purposes, we'll use placeholder addresses
        // In a real app, you'd get these from user profile and restaurant data
        const deliveryRequest = {
          external_delivery_id: externalDeliveryId,
          pickup_address: {
            street_address: "123 Restaurant St",
            city: "San Francisco",
            state: "CA",
            zip_code: "94102",
            country: "US",
            lat: 37.7749,
            lng: -122.4194
          },
          dropoff_address: {
            street_address: "456 Customer Ave",
            city: "San Francisco", 
            state: "CA",
            zip_code: "94103",
            country: "US",
            lat: 37.7849,
            lng: -122.4094
          },
          pickup_phone_number: "+15551234567",
          dropoff_phone_number: user.primaryPhoneNumber?.phoneNumber || "+15559876543",
          pickup_business_name: restaurant.name,
          pickup_instructions: "Please call restaurant when arriving for pickup",
          dropoff_instructions: "Please call customer when arriving for delivery",
          order_value: selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          currency: "USD",
          items: selectedItems.map(item => ({
            name: item.name,
            description: `Ordered from ${restaurant.name}`,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity
          }))
        };

        // Get delivery quote first
        const quoteResponse = await fetch('/api/doordash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'quote',
            ...deliveryRequest
          })
        });

        if (!quoteResponse.ok) {
          const errorText = await quoteResponse.text();
          throw new Error(`Failed to get delivery quote: ${errorText}`);
        }

        const { quote } = await quoteResponse.json();
        console.log('Delivery quote:', quote);

        // Generate a new unique ID for delivery creation (different from quote)
        const deliveryId = `feedme_${Date.now()}_${user.id}_${Math.random().toString(36).substr(2, 9)}_delivery`;
        
        // Create the delivery with new ID
        const deliveryResponse = await fetch('/api/doordash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            ...deliveryRequest,
            external_delivery_id: deliveryId
          })
        });

        if (!deliveryResponse.ok) {
          const errorText = await deliveryResponse.text();
          throw new Error(`Failed to create delivery: ${errorText}`);
        }

        const { delivery } = await deliveryResponse.json();
        console.log('Delivery created:', delivery);

        // Update order with DoorDash delivery ID
        await supabase
          .from("orders")
          .update({
            doordash_delivery_id: delivery.external_delivery_id,
            delivery_status: delivery.delivery_status,
            tracking_url: delivery.tracking_url,
            delivery_fee: quote.fee
          })
          .eq('id', orderData.id);

        setMessage(`Order placed successfully! Delivery ID: ${delivery.external_delivery_id}. Redirecting to tracking...`);
        
        // Show sandbox mode confirmation
        console.log('🧪 SANDBOX DELIVERY: Using DoorDash Sandbox - No real delivery created');
        
        // Redirect to tracking page after a short delay
        console.log('Redirecting to tracking page with order ID:', orderData.id);
        setTimeout(() => {
          window.location.href = `/tracking/${orderData.id}`;
        }, 2000);
      } catch (deliveryError) {
        console.error('DoorDash delivery error:', deliveryError);
        // Order was saved to database, but delivery failed
        const errorMessage = deliveryError instanceof Error ? deliveryError.message : 'Unknown error';
        
        if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
          setMessage(`Order saved successfully! DoorDash delivery service is currently unavailable. Your order has been recorded and you can contact the restaurant directly at ${restaurant.name}.`);
        } else if (errorMessage.includes('not configured')) {
          setMessage(`Order saved successfully! DoorDash integration is not configured. Your order has been recorded and you can contact the restaurant directly.`);
        } else {
          setMessage(`Order saved but delivery setup failed: ${errorMessage}. You may need to contact the restaurant directly.`);
        }
      }

    } catch (error) {
      console.error('Order error:', error);
      setMessage("Error placing order: " + (error instanceof Error ? error.message : 'Unknown error'));
    }

    setIsSubmitting(false);
  };

  const submitOrderWithoutDelivery = async () => {
    if (!user || !restaurant) return;

    setIsSubmitting(true);
    setMessage("");

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

      // Generate unique external delivery ID with more randomness
      const externalDeliveryId = `feedme_${Date.now()}_${user.id}_${Math.random().toString(36).substr(2, 9)}`;

      // Save order to database without DoorDash delivery
      const { data: orderData, error: dbError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          user_name: userName,
          restaurant_id: restaurant.place_id || restaurant.id,
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

      setMessage(`Order placed successfully! Your order has been recorded. Please contact ${restaurant.name} directly to arrange pickup or delivery. Order ID: ${externalDeliveryId}. Redirecting to tracking...`);
      
      // Redirect to tracking page after a short delay
      console.log('Redirecting to tracking page with order ID (no delivery):', orderData.id);
      setTimeout(() => {
        window.location.href = `/tracking/${orderData.id}`;
      }, 2000);
    } catch (error) {
      console.error('Order error:', error);
      setMessage("Error placing order: " + (error instanceof Error ? error.message : 'Unknown error'));
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
              {restaurant.address && (
                <p className="text-sm text-muted-foreground mt-1">{restaurant.address}</p>
              )}
              <div className="mt-4">
                <h4 className="font-medium mb-2">Selected Items ({selectedItems.length}):</h4>
                <ul className="space-y-1">
                  {selectedItems.map((item, index) => (
                    <li key={index} className="flex justify-between items-center py-1">
                      <span>{item.name} x{item.quantity}</span>
                      <span className="text-sm text-muted-foreground">${(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span>${selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  *Prices are estimates - actual prices may vary
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {/* Mode Indicator */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                🧪 Sandbox Mode - Test Deliveries Only
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Using DoorDash Sandbox credentials
              </p>
            </div>
            
            <Button 
              onClick={submitOrder} 
              className="w-full" 
              disabled={isSubmitting || selectedItems.length === 0}
            >
              {isSubmitting ? "Placing Order..." : "Confirm & Place Order (with DoorDash)"}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={submitOrderWithoutDelivery} 
              className="w-full" 
              disabled={isSubmitting || selectedItems.length === 0}
            >
              {isSubmitting ? "Placing Order..." : "Place Order (No Delivery)"}
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
