"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

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
          <CardTitle>Today's Orders ({orders.length})</CardTitle>
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
    </div>
  );
}
