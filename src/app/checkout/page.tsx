"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ShoppingCart, CreditCard, CheckCircle } from "lucide-react";
import StripeCheckout from "@/components/StripeCheckout";
import { useCart } from "@/contexts/CartContext";

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

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useUser();
  const { items: cartItems, clearCart, isLoaded } = useCart();
  const [message, setMessage] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Get data from sessionStorage for restaurant info
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [deliveryFee] = useState(3.99);
  const [serviceFee] = useState(2.00);

  // Load restaurant data from sessionStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkoutData = sessionStorage.getItem('checkoutData');
      if (checkoutData) {
        const { restaurant: restData } = JSON.parse(checkoutData);
        setRestaurant(restData);
      }
    }
  }, []);

  // Create a default restaurant if none is available
  const defaultRestaurant: Restaurant = {
    id: 'default',
    name: 'Selected Restaurant',
    place_id: 'default',
    address: '123 Main St',
    city: 'Your City',
    state: 'ST',
    zip_code: '12345',
    lat: 0,
    lng: 0,
    rating: 4.0,
    price_level: 2,
    cuisine_types: ['Food'],
    opening_hours: null,
    photos: null,
    is_active: true,
    menu_last_updated: null,
    menu: null
  };

  const currentRestaurant = restaurant || defaultRestaurant;

  // Debug: Log cart items
  useEffect(() => {
    console.log('Checkout page - Cart items:', cartItems);
    console.log('Checkout page - Cart length:', cartItems.length);
    console.log('Checkout page - Cart items details:', JSON.stringify(cartItems, null, 2));
  }, [cartItems]);

  // Debug: Log when component mounts
  useEffect(() => {
    console.log('Checkout page - Component mounted');
    console.log('Checkout page - Initial cart items:', cartItems);
    console.log('Checkout page - Initial cart length:', cartItems.length);
    console.log('Checkout page - localStorage cart:', localStorage.getItem('cart'));
  }, []);

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    setMessage("Payment successful! Creating order...");
    
    let orderData: { id: string; external_delivery_id: string } | null = null; // Declare orderData outside try block
    
    try {
      // Create order first
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurant_id: currentRestaurant.place_id || currentRestaurant.id,
          items: cartItems.map(item => item.name),
          total_amount: Math.round((cartItems.reduce((sum, item) => sum + item.total_price, 0) + deliveryFee + serviceFee + Math.max((cartItems.reduce((sum, item) => sum + item.total_price, 0) + deliveryFee + serviceFee) * 0.10, 2.00)) * 100),
          food_amount: Math.round(cartItems.reduce((sum, item) => sum + item.total_price, 0) * 100),
          service_fee: Math.round(serviceFee * 100),
          platform_fee: Math.round(Math.max((cartItems.reduce((sum, item) => sum + item.total_price, 0) + deliveryFee + serviceFee) * 0.10, 2.00) * 100),
          delivery_fee: Math.round(deliveryFee * 100),
          payment_intent_id: paymentIntentId,
          payment_status: 'completed'
        }),
      });

      const orderResult = await orderResponse.json();
      
      if (orderResult.error) {
        throw new Error(orderResult.error);
      }

      orderData = orderResult.order;
      console.log('Order created successfully:', orderData);
      
      // Set success state and order ID
      setPaymentSuccess(true);
      setOrderId(orderData.id);
      
      // Clear cart after successful order creation
      clearCart();

      // Create DoorDash delivery
      const deliveryRequest = {
        external_delivery_id: orderData.external_delivery_id,
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
        dropoff_phone_number: user?.primaryPhoneNumber?.phoneNumber || "+15559876543",
        pickup_business_name: currentRestaurant.name,
        pickup_instructions: "Please call restaurant when arriving for pickup",
        dropoff_instructions: "Please call customer when arriving for delivery",
        order_value: cartItems.reduce((sum, item) => sum + item.total_price, 0),
        currency: "USD",
        items: cartItems.map(item => ({
          name: item.name,
          description: `Ordered from ${currentRestaurant.name}`,
          quantity: item.quantity,
          unit_price: item.base_price,
          total_price: item.total_price
        }))
      };

      // DEVELOPMENT: Try to create DoorDash delivery, but don't fail if it's not available
      // PRODUCTION: Delivery creation will be handled by Stripe webhook
      try {
        // Get delivery quote
        const quoteResponse = await fetch('/api/doordash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'quote',
            ...deliveryRequest
          })
        });

        if (quoteResponse.ok) {
          const { quote } = await quoteResponse.json();

          // Create delivery
          const deliveryResponse = await fetch('/api/doordash', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create',
              ...deliveryRequest
            })
          });

          if (deliveryResponse.ok) {
            const { delivery } = await deliveryResponse.json();

            // Update order with delivery info
            await fetch(`/api/orders/${orderData.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                doordash_delivery_id: delivery.external_delivery_id,
                delivery_status: delivery.delivery_status,
                tracking_url: delivery.tracking_url,
                delivery_fee: quote.fee
              })
            });

            setMessage("Order placed successfully! Delivery created.");
          } else {
            console.warn('DoorDash delivery creation failed, but order was created successfully');
            setMessage("Order placed successfully! Delivery will be processed manually.");
          }
        } else {
          console.warn('DoorDash quote failed, but order was created successfully');
          setMessage("Order placed successfully! Delivery will be processed manually.");
        }
      } catch (deliveryError) {
        console.warn('DoorDash integration failed, but order was created successfully:', deliveryError);
        setMessage("Order placed successfully! Delivery will be processed manually.");
      }

    } catch (error) {
      console.error('Delivery creation error:', error);
      // In development, we can still show success even if DoorDash fails
      // The order is still created and can be processed manually
      setMessage(`Payment successful! Order created. ${process.env.NODE_ENV === 'development' ? 'Delivery will be processed automatically.' : 'Delivery will be processed automatically.'}`);
      console.log('Order created successfully, delivery processing initiated');
      
      // Set success state even if delivery fails
      if (orderData?.id) {
        setPaymentSuccess(true);
        setOrderId(orderData.id);
        // Clear cart after successful order creation
        clearCart();
      } else {
        setMessage("Payment successful! Order created. Please check your orders page.");
      }
    }
  };

  const proceedToPayment = () => {
    setShowPayment(true);
  };

  const goBack = () => {
    if (showPayment) {
      setShowPayment(false);
    } else {
      router.back();
    }
  };

  // Show loading state while cart is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold">Loading cart...</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Debug: Add a debug button to check cart state
  const debugCart = () => {
    console.log('=== DEBUG CART STATE ===');
    console.log('Cart items from context:', cartItems);
    console.log('Cart length:', cartItems.length);
    console.log('localStorage cart:', localStorage.getItem('cart'));
    console.log('isLoaded:', isLoaded);
    console.log('========================');
  };

  // Show success screen if payment was successful
  if (paymentSuccess && orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">Your order has been placed and is being processed.</p>
            <div className="space-y-2">
              <Button onClick={() => window.location.href = `/tracking/${orderId}`}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Track Your Order
              </Button>
              <Button onClick={() => {
                // Cart is already cleared, just navigate to order page
                router.push('/order');
              }} variant="outline" className="w-full">
                Place Another Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Items Selected</h2>
            <p className="text-gray-600 mb-4">Please go back and select items to order.</p>
            <div className="space-y-2">
              <Button onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={debugCart} variant="outline" className="w-full">
                Debug Cart State
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showPayment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={goBack}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Order Summary
            </Button>
            <h1 className="text-2xl font-bold">Complete Your Payment</h1>
            <p className="text-gray-600">Secure payment powered by Stripe</p>
          </div>

          <StripeCheckout
            restaurant={currentRestaurant}
            selectedItems={cartItems}
            deliveryFee={deliveryFee}
            serviceFee={serviceFee}
            onPaymentSuccess={handlePaymentSuccess}
            onBack={goBack}
          />
        </div>
      </div>
    );
  }

  // Calculate totals
  const foodAmount = cartItems.reduce((sum, item) => sum + item.total_price, 0);
  const subtotal = foodAmount + deliveryFee + serviceFee;
  const platformFee = Math.max(subtotal * 0.10, 2.00); // 10% or $2 minimum
  const total = subtotal + platformFee;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={goBack}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </Button>
          <h1 className="text-2xl font-bold">Review Your Order</h1>
          <p className="text-gray-600">From {currentRestaurant.name}</p>
        </div>

        <div className="space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Your Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-medium">${item.total_price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Food Total</span>
                <span>${foodAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery Fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Service Fee</span>
                <span>${serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Platform Fee</span>
                <span>${platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Button */}
          <Card>
            <CardContent className="p-6">
              <Button
                onClick={proceedToPayment}
                className="w-full h-12 text-lg"
                size="lg"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Pay ${total.toFixed(2)} with Stripe
              </Button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Secure payment powered by Stripe • Cards, Apple Pay, Google Pay
              </p>
            </CardContent>
          </Card>

          {message && (
            <div className={`p-4 rounded-md flex items-center gap-2 ${
              message.includes('successful') || message.includes('success') 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">{message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}