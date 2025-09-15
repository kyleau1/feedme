'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, CheckCircle, Circle, Truck, Clock, MapPin } from 'lucide-react';

interface OrderTrackingWidgetProps {
  orderId: string;
  compact?: boolean;
  onViewDetails?: () => void;
}

interface OrderTracking {
  id: string;
  external_delivery_id: string;
  delivery_status: string;
  tracking_url: string;
  delivery_fee: number;
  pickup_time_estimated: string;
  dropoff_time_estimated: string;
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
  'expired': { label: 'Expired', color: 'bg-gray-500', icon: Circle }
};

const statusOrder = ['quote', 'created', 'accepted', 'picked_up', 'delivered'];

export default function OrderTrackingWidget({ orderId, compact = false, onViewDetails }: OrderTrackingWidgetProps) {
  const [order, setOrder] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
      // Set up polling for real-time updates
      const interval = setInterval(fetchOrderDetails, 15000); // Poll every 15 seconds
      return () => clearInterval(interval);
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error('Order not found');
      }
      const orderData = await response.json();
      setOrder(orderData);
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

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading tracking info...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !order) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-red-600 text-sm">{error || 'Failed to load tracking info'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStatusIndex = getCurrentStatusIndex();
  const statusConfigs = statusOrder.map(status => statusConfig[status as keyof typeof statusConfig]);

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Order Status</CardTitle>
            <Badge 
              variant="secondary" 
              className={`${statusConfig[order.delivery_status as keyof typeof statusConfig]?.color} text-white`}
            >
              {statusConfig[order.delivery_status as keyof typeof statusConfig]?.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Estimated Delivery</span>
              <span className="font-medium">{formatTime(order.dropoff_time_estimated)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Restaurant</span>
              <span className="font-medium">{order.pickup_business_name}</span>
            </div>
            {onViewDetails && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={onViewDetails}
              >
                View Full Details
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Order Tracking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Progress */}
          <div className="space-y-3">
            {statusConfigs.map((config, index) => {
              const isCompleted = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              const Icon = config.icon;
              
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted ? config.color : 'bg-gray-200'
                  } ${isCurrent ? 'ring-2 ring-opacity-50 ring-teal-300' : ''}`}>
                    <Icon className={`h-4 w-4 ${isCompleted ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                      {config.label}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-teal-600">In progress</p>
                    )}
                  </div>
                  {isCompleted && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Delivery Info */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Estimated Delivery</p>
                <p className="font-medium">{formatTime(order.dropoff_time_estimated)}</p>
              </div>
              <div>
                <p className="text-gray-600">Restaurant</p>
                <p className="font-medium">{order.pickup_business_name}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {onViewDetails && (
            <div className="pt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={onViewDetails}
              >
                View Full Details
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


