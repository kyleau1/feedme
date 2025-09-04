"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@clerk/nextjs";

interface Restaurant {
  id: string;
  name: string;
  menu: string[];
}

export default function OrderPage() {
  const { user } = useUser();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchRestaurants() {
      if (!user) return;

      // Replace this with the actual org UUID from your Supabase table
      const orgId = "018615c8-327d-4648-8072-52f1f2da6f34";

      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("id, daily_restaurant_id")
        .eq("id", orgId)
        .single();

      if (orgError) {
        console.error("Error fetching org:", orgError);
        return;
      }

      console.log("Org:", org);

      if (org?.daily_restaurant_id) {
        // Admin picked a restaurant
        const { data: restaurant, error: restError } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", org.daily_restaurant_id)
          .single();

        if (restError) {
          console.error("Error fetching restaurant:", restError);
        } else if (restaurant) {
          setSelectedRestaurant(restaurant);
        }
      } else {
        // No restaurant set → show all restaurants
        const { data: allRestaurants, error: allError } = await supabase
          .from("restaurants")
          .select("*");

        if (allError) console.error("Error fetching restaurants:", allError);
        else setRestaurants(allRestaurants || []);
      }
    }

    fetchRestaurants();
  }, [user]);

  const toggleItem = (item: string) => {
    setSelectedItems(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const submitOrder = async () => {
    if (!user) return;

    const restaurantId = selectedRestaurant?.id;
    if (!restaurantId) {
      setMessage("Please select a restaurant first.");
      return;
    }

    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      restaurant_id: restaurantId,
      items: selectedItems,
    });

    if (error) setMessage("Error placing order: " + error.message);
    else setMessage("Order submitted!");
  };

  if (!user) return <p>Loading user info...</p>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Order Food</h1>

      {/* Only show dropdown if admin hasn't picked a restaurant */}
      {!selectedRestaurant && restaurants.length > 0 && (
        <div className="mb-4">
          <h2 className="font-semibold mb-2">Choose a restaurant:</h2>
          <select
            className="border p-2 rounded"
            onChange={(e) => {
              const r = restaurants.find(r => r.id === e.target.value);
              setSelectedRestaurant(r || null);
              setSelectedItems([]);
            }}
            defaultValue=""
          >
            <option value="">-- Select --</option>
            {restaurants.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      )}

      {selectedRestaurant && (
        <>
          <h2 className="text-xl font-semibold mb-2">{selectedRestaurant.name}</h2>
          <div className="flex flex-col gap-2 mb-4">
            {selectedRestaurant.menu.map(item => (
              <label key={item} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item)}
                  onChange={() => toggleItem(item)}
                  className="mr-2"
                />
                <span>{item}</span>
              </label>
            ))}
          </div>

          <div className="mb-4">
            <button
              onClick={submitOrder}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Submit Order
            </button>
          </div>

          {message && <div className="text-red-600">{message}</div>}
        </>
      )}
    </div>
  );
}

