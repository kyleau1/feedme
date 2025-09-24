"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, CheckCircle, AlertCircle } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripeCheckoutProps {
  restaurant: any;
  selectedItems: Array<{
    name: string;
    quantity: number;
    total_price: number;
    base_price: number;
  }>;
  deliveryFee: number;
  serviceFee: number;
  onPaymentSuccess: (orderId: string) => void;
  onBack: () => void;
}

function CheckoutForm({ restaurant, selectedItems, deliveryFee, serviceFee, onPaymentSuccess, onBack }: StripeCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate total amount
  const foodAmount = selectedItems.reduce((sum, item) => sum + item.total_price, 0);
  const subtotal = foodAmount + deliveryFee + serviceFee;
  const platformFee = Math.max(subtotal * 0.10, 2.00); // 10% or $2 minimum
  const amount = subtotal + platformFee;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create payment intent
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            restaurant: restaurant.name,
            items: JSON.stringify(selectedItems.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.total_price
            })))
          }
        }),
      });

      const { client_secret, error: apiError } = await response.json();

      if (apiError) {
        throw new Error(apiError);
      }

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Payment successful - let the parent component handle order creation
        onPaymentSuccess(paymentIntent.id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4"
      >
        ← Back to Order Summary
      </Button>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-2">
            {selectedItems.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.name} x {item.quantity}</span>
                <span>${item.total_price.toFixed(2)}</span>
              </div>
            ))}
          </div>
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
            <span>${amount.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>
          
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-lg font-semibold">Total: ${amount.toFixed(2)}</span>
            <Button
              type="submit"
              disabled={!stripe || isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Pay ${amount.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      </form>
    </div>
  );
}

export default function StripeCheckout(props: StripeCheckoutProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
}
