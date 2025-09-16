'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Phone, Package, CheckCircle, Circle, Truck, Home } from 'lucide-react';

interface OrderTracking {
  id: string;
  external_delivery_id: string;
  doordash_delivery_id: string;
  delivery_status: string;
  tracking_url: string;
  delivery_fee: number;
  pickup_time_estimated: string;
  dropoff_time_estimated: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_business_name: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  'quote': { label: 'Quote Received', color: 'bg-blue-500', icon: Circle },
  'created': { label: 'Order Created', color: 'bg-yellow-500', icon: Package },
  'accepted': { label: 'Dasher Assigned', color: 'bg-purple-500', icon: Truck },
  'picked_up': { label: 'Picked Up', color: 'bg-orange-500', icon: CheckCircle },
  'delivered': { label: 'Delivered', color: 'bg-green-500', icon: CheckCircle },
  'cancelled': { label: 'Cancelled', color: 'bg-red-500', icon: Circle },
  'expired': { label: 'Expired', color: 'bg-gray-500', icon: Circle },
  'pending': { label: 'Order Pending', color: 'bg-yellow-500', icon: Package }
};

const statusOrder = ['quote', 'created', 'accepted', 'picked_up', 'delivered'];

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
      // Set up polling for real-time updates
      const interval = setInterval(fetchOrderDetails, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error('Order not found');
      }
      const result = await response.json();
      if (result.error || !result.order) {
        throw new Error('Order not found');
      }
      setOrder(result.order);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIndex = (status: string) => {
    return statusOrder.indexOf(status);
  };

  const getCurrentStatusIndex = () => {
    if (!order) return -1;
    return getStatusIndex(order.delivery_status);
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timeString: string) => {
    return new Date(timeString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
              <p className="text-gray-600 mb-4">{error || 'This order could not be found.'}</p>
              <Button onClick={() => window.history.back()}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStatusIndex = getCurrentStatusIndex();
  const statusConfigs = statusOrder.map(status => statusConfig[status as keyof typeof statusConfig]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Tracking</h1>
          <p className="text-gray-600">Order ID: {order.external_delivery_id}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tracking Status */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Delivery Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statusConfigs.map((config, index) => {
                    const isCompleted = index <= currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;
                    const Icon = config.icon;
                    
                    return (
                      <div key={index} className="flex items-center gap-4">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          isCompleted ? config.color : 'bg-gray-200'
                        } ${isCurrent ? 'ring-4 ring-opacity-50 ring-teal-300' : ''}`}>
                          <Icon className={`h-5 w-5 ${isCompleted ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                            {config.label}
                          </p>
                          {isCurrent && (
                            <p className="text-sm text-teal-600">Currently in progress</p>
                          )}
                        </div>
                        {isCompleted && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Items Ordered</h4>
                    <div className="space-y-2">
                      {order.items && order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <span className="text-gray-700">{typeof item === 'string' ? item : item.name || 'Unknown Item'}</span>
                          <span className="text-gray-500">Qty: {typeof item === 'object' ? item.quantity || 1 : 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Food Total</span>
                      <span className="text-gray-700">${(order.food_amount / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Service Fee</span>
                      <span className="text-gray-700">${(order.service_fee / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Platform Fee</span>
                      <span className="text-gray-700">${(order.platform_fee / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Delivery Fee</span>
                      <span className="text-gray-700">${(order.delivery_fee / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="font-bold text-lg text-gray-900">Total</span>
                      <span className="font-bold text-lg text-gray-900">${(order.total_amount / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Info Sidebar */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <Badge 
                    variant="secondary" 
                    className={`${statusConfig[order.delivery_status as keyof typeof statusConfig]?.color} text-white text-lg px-4 py-2`}
                  >
                    {statusConfig[order.delivery_status as keyof typeof statusConfig]?.label}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-2">
                    Payment processed successfully! Delivery service temporarily unavailable - order will be processed manually.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Times */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Delivery Times
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Estimated Pickup</p>
                  <p className="font-medium">
                    {order.pickup_time_estimated ? formatTime(order.pickup_time_estimated) : 'TBD'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.pickup_time_estimated ? formatDate(order.pickup_time_estimated) : 'Time will be updated'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estimated Delivery</p>
                  <p className="font-medium">
                    {order.dropoff_time_estimated ? formatTime(order.dropoff_time_estimated) : 'TBD'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.dropoff_time_estimated ? formatDate(order.dropoff_time_estimated) : 'Time will be updated'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Addresses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Addresses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-start gap-2">
                    <Home className="h-4 w-4 text-teal-600 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Pickup</p>
                      <p className="text-sm text-gray-600">{order.pickup_business_name || 'Restaurant'}</p>
                      <p className="text-xs text-gray-500">{order.pickup_address || 'Address will be updated'}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-teal-600 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Delivery</p>
                      <p className="text-xs text-gray-500">{order.dropoff_address || 'Address will be updated'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button 
                    className="w-full" 
                    onClick={() => window.open(order.tracking_url, '_blank')}
                  >
                    View on DoorDash
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.history.back()}
                  >
                    Back to Orders
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


