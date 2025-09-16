"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Get order ID from URL params or session storage
    const urlOrderId = searchParams.get('order_id');
    const sessionOrderId = typeof window !== 'undefined' 
      ? sessionStorage.getItem('lastOrderId') 
      : null;
    
    setOrderId(urlOrderId || sessionOrderId);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="max-w-md w-full mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">Payment Successful!</CardTitle>
            <p className="text-gray-600">
              Your order has been confirmed and payment processed.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">What happens next?</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Your order is being prepared</li>
                <li>• A delivery driver will be assigned</li>
                <li>• You'll receive real-time updates</li>
                <li>• Estimated delivery: 30-45 minutes</li>
              </ul>
            </div>

            {orderId && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Order ID:</p>
                <p className="font-mono text-sm bg-white p-2 rounded border">
                  {orderId}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href={orderId ? `/tracking/${orderId}` : '/orders'}>
                  <Package className="h-4 w-4 mr-2" />
                  Track Your Order
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                You'll receive email updates about your order status.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

