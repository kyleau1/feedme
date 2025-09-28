'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Clock, MapPin, ArrowRight } from 'lucide-react';

interface Order {
  id: string;
  external_delivery_id: string;
  delivery_status: string;
  tracking_url: string;
  delivery_fee: number;
  pickup_time_estimated: string;
  dropoff_time_estimated: string;
  pickup_business_name: string;
  items: string[];
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  'quote': { label: 'Quote Received', color: 'bg-blue-500' },
  'created': { label: 'Order Created', color: 'bg-yellow-500' },
  'accepted': { label: 'Dasher Assigned', color: 'bg-purple-500' },
  'picked_up': { label: 'Picked Up', color: 'bg-orange-500' },
  'delivered': { label: 'Delivered', color: 'bg-green-500' },
  'cancelled': { label: 'Cancelled', color: 'bg-red-500' },
  'expired': { label: 'Expired', color: 'bg-gray-500' }
};

export default function OrdersPage() {
  const { user, isLoaded } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      fetchOrders();
    }
  }, [isLoaded, user]);

  const fetchOrders = async () => {
    try {
      // Fetch group order sessions instead of individual orders
      const response = await fetch('/api/doordash/group-orders');
      if (!response.ok) {
        throw new Error('Failed to fetch group orders');
      }
      const sessionsData = await response.json();
      // Convert sessions to orders format for compatibility
      const ordersData = sessionsData.sessions?.map((session: any) => ({
        id: session.id,
        external_delivery_id: session.id,
        delivery_status: session.status === 'active' ? 'preparing' : 
                        session.status === 'completed' ? 'delivered' : 
                        session.status === 'closed' ? 'cancelled' : 'pending',
        tracking_url: session.doordash_group_link || '',
        delivery_fee: 0,
        pickup_time_estimated: session.start_time,
        dropoff_time_estimated: session.end_time,
        pickup_business_name: session.restaurant_name,
        items: ['Group Order'],
        total_amount: 0,
        created_at: session.created_at || new Date().toISOString()
      })) || [];
      setOrders(ordersData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch group orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Please Sign In</h2>
              <p className="text-gray-600 mb-4">You need to be signed in to view your orders.</p>
              <Button onClick={() => window.location.href = '/sign-in'}>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Error Loading Orders</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchOrders}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Group Order Sessions</h1>
          <p className="text-gray-600">View your group order participation history</p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Group Orders Yet</h3>
                <p className="text-gray-600 mb-6">You haven't participated in any group order sessions yet.</p>
                <Button onClick={() => window.location.href = '/order'}>
                  View Active Sessions
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Order #{order.external_delivery_id.slice(-8)}</CardTitle>
                    <Badge 
                      variant="secondary" 
                      className={`${statusConfig[order.delivery_status as keyof typeof statusConfig]?.color} text-white`}
                    >
                      {statusConfig[order.delivery_status as keyof typeof statusConfig]?.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Placed on {formatDate(order.created_at)}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Order Summary */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-teal-600" />
                        <span className="text-gray-600">Restaurant:</span>
                        <span className="font-medium">{order.pickup_business_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-teal-600" />
                        <span className="text-gray-600">Estimated Delivery:</span>
                        <span className="font-medium">{formatTime(order.dropoff_time_estimated)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Items: </span>
                        <span className="font-medium">{order.items.join(', ')}</span>
                      </div>
                    </div>

                    {/* Tracking Status */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-medium">Status: {order.delivery_status}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {order.delivery_status}
                        </Badge>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button 
                      className="w-full" 
                      onClick={() => window.location.href = `/tracking/${order.id}`}
                    >
                      View Full Details
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


