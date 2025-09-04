"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

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

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <h2 className="text-lg font-semibold mb-2">Today's Restaurant</h2>
      {todayRestaurant ? (
        <p>{todayRestaurant.name}</p>
      ) : (
        <p>No restaurant selected for today.</p>
      )}

      <h2 className="text-lg font-semibold mt-6 mb-2">Change Today's Restaurant</h2>
      <select
        className="border p-2 rounded w-full mb-4"
        defaultValue=""
        onChange={(e) => changeRestaurant(e.target.value)}
      >
        <option value="">-- Select --</option>
        {restaurants.map(r => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>

      <h2 className="text-lg font-semibold mt-6 mb-2">Today's Orders ({orders.length})</h2>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="border p-3 rounded bg-gray-50">
              <div className="font-medium">User: {order.user_id}</div>
              <div className="text-sm text-gray-600">
                Items: {order.items.join(", ")}
              </div>
              <div className="text-xs text-gray-500">
                Ordered at: {new Date(order.created_at).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
