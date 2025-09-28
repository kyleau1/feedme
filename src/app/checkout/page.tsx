"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const [orderSession, setOrderSession] = useState<any>(null);

  // Load current order session
  useEffect(() => {
    const loadCurrentSession = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/order-sessions/current');
        if (response.ok) {
          const session = await response.json();
          setOrderSession(session);
        }
      } catch (error) {
        console.error('Error loading current session:', error);
      }
    };

    loadCurrentSession();
  }, [user]);

  const openDoorDashGroup = () => {
    if (orderSession?.doordash_group_link) {
      window.open(orderSession.doordash_group_link, '_blank');
    }
  };

  const goBack = () => {
    router.back();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p>Loading user info...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!orderSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Active Order Session</h2>
            <p className="text-gray-600 mb-4">There are no active group orders at the moment.</p>
            <Button onClick={goBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const now = new Date();
  const startTime = new Date(orderSession.start_time);
  const endTime = new Date(orderSession.end_time);
  const isActive = now >= startTime && now <= endTime;
  const isUpcoming = now < startTime;
  const isClosed = now > endTime;

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
            Back to Order Session
          </Button>
          <h1 className="text-2xl font-bold">Complete Your Order</h1>
          <p className="text-gray-600">Order through DoorDash's group ordering system</p>
        </div>

        <div className="space-y-6">
          {/* Order Session Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isActive && <CheckCircle className="h-5 w-5 text-green-500" />}
                {isUpcoming && <AlertCircle className="h-5 w-5 text-blue-500" />}
                {isClosed && <AlertCircle className="h-5 w-5 text-red-500" />}
                {orderSession.restaurant_name}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div>{startTime.toLocaleDateString()}</div>
                <div>{startTime.toLocaleTimeString()} - {endTime.toLocaleTimeString()}</div>
                <div>{orderSession.participants.length} participants</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Available Restaurants:</h4>
                  <div className="flex flex-wrap gap-2">
                    {orderSession.restaurant_options.map((restaurant: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                        {restaurant}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isActive ? 'bg-green-100 text-green-800' :
                    isUpcoming ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {isActive ? 'Active - Order Now!' : isUpcoming ? 'Upcoming' : 'Closed'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DoorDash Integration */}
          {orderSession.doordash_group_link ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  DoorDash Group Order
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2 text-blue-900">Ready to Order?</h4>
                  <p className="text-sm text-blue-700 mb-4">
                    Click the button below to open the DoorDash group order page where you can:
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1 mb-4">
                    <li>• Browse menus from all available restaurants</li>
                    <li>• Add items to the group order</li>
                    <li>• Pay for your portion of the order</li>
                    <li>• Track the delivery status</li>
                  </ul>
                  <Button onClick={openDoorDashGroup} className="w-full" size="lg">
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Open DoorDash Group Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">DoorDash Link Not Available</h3>
                <p className="text-muted-foreground mb-4">
                  The DoorDash group order link hasn't been set up yet. Please contact your manager.
                </p>
                <Button onClick={goBack} variant="outline">
                  Go Back
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">1</div>
                <div>
                  <p className="font-medium">Join the Group Order</p>
                  <p className="text-sm text-muted-foreground">Click the DoorDash link to join the group order</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">2</div>
                <div>
                  <p className="font-medium">Choose Your Restaurant</p>
                  <p className="text-sm text-muted-foreground">Select from the available restaurants and browse their menus</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">3</div>
                <div>
                  <p className="font-medium">Add Items & Pay</p>
                  <p className="text-sm text-muted-foreground">Add items to your order and pay for your portion</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">4</div>
                <div>
                  <p className="font-medium">Track Delivery</p>
                  <p className="text-sm text-muted-foreground">Monitor your order status and delivery progress</p>
                </div>
              </div>
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