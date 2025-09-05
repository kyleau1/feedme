"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Clock, CheckCircle, User } from "lucide-react";
import Link from "next/link";

interface Restaurant {
  id: string;
  name: string;
  menu: string[];
}

interface Order {
  id: string;
  user_name: string;
  items: string[];
  created_at: string;
  status?: string;
}

export default function EmployeeDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [todayRestaurant, setTodayRestaurant] = useState<Restaurant | null>(null);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/");
    }
  }, [user, isLoaded, router]);

  // Fetch today's restaurant and user's orders
  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        // Get today's restaurant
        const orgId = "018615c8-327d-4648-8072-52f1f2da6f34";
        const { data: org } = await supabase
          .from("organizations")
          .select("daily_restaurant_id")
          .eq("id", orgId)
          .single();

        if (org?.daily_restaurant_id) {
          const { data: restaurant } = await supabase
            .from("restaurants")
            .select("*")
            .eq("id", org.daily_restaurant_id)
            .single();
          setTodayRestaurant(restaurant);
        }

        // Get user's orders for today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const { data: orders } = await supabase
          .from("orders")
          .select("id, user_name, items, created_at")
          .eq("user_id", user.id)
          .gte("created_at", startOfDay.toISOString())
          .lte("created_at", endOfDay.toISOString())
          .order("created_at", { ascending: false });

        setMyOrders(orders || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchData();
    }
  }, [user]);

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="h-8 w-8" />
            My Dashboard
          </h1>
          <p className="text-muted-foreground">Welcome back, {user.firstName || user.username}!</p>
        </div>
        <Button asChild>
          <Link href="/order">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Place New Order
          </Link>
        </Button>
      </div>

      {/* Today's Restaurant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Today's Restaurant
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayRestaurant ? (
            <div>
              <h3 className="text-xl font-semibold">{todayRestaurant.name}</h3>
              <p className="text-muted-foreground mt-1">
                {todayRestaurant.menu.length} items available
              </p>
              <Button asChild className="mt-4">
                <Link href="/order">View Menu & Order</Link>
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-muted-foreground">No restaurant selected for today.</p>
              <Button asChild className="mt-4">
                <Link href="/order">Browse All Restaurants</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Orders Today */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            My Orders Today ({myOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No orders placed today</p>
              <Button asChild>
                <Link href="/order">Place Your First Order</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {myOrders.map(order => (
                <Card key={order.id} className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{order.user_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Items: {order.items.join(", ")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Ordered at: {new Date(order.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">
                          ✓ Submitted
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button asChild variant="outline" className="h-20">
              <Link href="/order" className="flex flex-col items-center gap-2">
                <ShoppingCart className="h-6 w-6" />
                <span>Place New Order</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20">
              <Link href="/checkout" className="flex flex-col items-center gap-2">
                <CheckCircle className="h-6 w-6" />
                <span>Review Orders</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
