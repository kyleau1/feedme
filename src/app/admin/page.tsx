"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, ShoppingCart, CreditCard, CheckCircle } from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  menu: string[];
}

interface Order {
  id: string;
  user_id: string;
  items: string[];
  user_email?: string;
  created_at: string;
}

export default function AdminPage() {
  const [todayRestaurant, setTodayRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  // Fetch all restaurants for the select dropdown
  useEffect(() => {
    async function fetchRestaurants() {
      const { data } = await supabase.from("restaurants").select("*");
      setRestaurants(data || []);
    }
    fetchRestaurants();
  }, []);

  // Fetch today's restaurant for the organization
  useEffect(() => {
    async function fetchTodayRestaurant() {
      // Use the same org ID as in order page
      const orgId = "018615c8-327d-4648-8072-52f1f2da6f34";
      
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("daily_restaurant_id")
        .eq("id", orgId)
        .single();

      if (orgError) {
        console.error("Error fetching org:", orgError);
        setTodayRestaurant(null);
        return;
      }

      if (org?.daily_restaurant_id) {
        const { data: restaurant, error: restError } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", org.daily_restaurant_id)
          .single();
        
        if (restError) {
          console.error("Error fetching restaurant:", restError);
          setTodayRestaurant(null);
        } else {
          setTodayRestaurant(restaurant || null);
        }
      } else {
        setTodayRestaurant(null);
      }
    }
    fetchTodayRestaurant();
  }, [selectedRestaurantId]);

  // Fetch today's orders
  useEffect(() => {
    async function fetchOrders() {
      if (!todayRestaurant) {
        setOrders([]);
        return;
      }

      // Filter orders by today's date
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const { data: orderData, error } = await supabase
        .from("orders")
        .select("id, user_id, items, created_at")
        .eq("restaurant_id", todayRestaurant.id)
        .gte("created_at", startOfDay.toISOString())
        .lte("created_at", endOfDay.toISOString());

      if (error) {
        console.error("Error fetching orders:", error);
        setOrders([]);
        return;
      }

      setOrders(orderData || []);
    }

    fetchOrders();
  }, [todayRestaurant]);

  const changeRestaurant = async (restaurantId: string) => {
    const orgId = "018615c8-327d-4648-8072-52f1f2da6f34";
    
    const { error } = await supabase
      .from("organizations")
      .update({ daily_restaurant_id: restaurantId })
      .eq("id", orgId);

    if (error) {
      console.error("Error updating restaurant:", error);
    } else {
      setSelectedRestaurantId(restaurantId);
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
        .eq("restaurant_id", todayRestaurant.id);

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
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Today's Restaurant</CardTitle>
        </CardHeader>
        <CardContent>
          {todayRestaurant ? (
            <p className="text-lg">{todayRestaurant.name}</p>
          ) : (
            <p className="text-muted-foreground">No restaurant selected for today.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Today's Restaurant</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={changeRestaurant}>
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
                      <div className="font-medium">User: {order.user_id}</div>
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
