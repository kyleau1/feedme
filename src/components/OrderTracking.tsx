"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, RefreshCw, Truck, Clock, CheckCircle, XCircle } from 'lucide-react';

interface OrderTrackingProps {
  orderId: string;
  deliveryId?: string;
  trackingUrl?: string;
  status?: string;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  quote: { label: 'Getting Quote', color: 'bg-blue-100 text-blue-800', icon: Clock },
  created: { label: 'Order Created', color: 'bg-blue-100 text-blue-800', icon: Clock },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800', icon: Truck },
  picked_up: { label: 'Picked Up', color: 'bg-green-100 text-green-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  expired: { label: 'Expired', color: 'bg-gray-100 text-gray-800', icon: XCircle },
};

export default function OrderTracking({ orderId, deliveryId, trackingUrl, status = 'pending' }: OrderTrackingProps) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const statusInfo = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  const refreshStatus = async () => {
    if (!deliveryId) return;
    
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/doordash?deliveryId=${deliveryId}`);
      if (response.ok) {
        const { delivery } = await response.json();
        setCurrentStatus(delivery.status);
      }
    } catch (error) {
      console.error('Error refreshing status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusMessage = () => {
    switch (currentStatus) {
      case 'pending':
        return 'Your order is being processed...';
      case 'quote':
        return 'Getting delivery quote from DoorDash...';
      case 'created':
        return 'Order created! Waiting for driver assignment...';
      case 'accepted':
        return 'Driver assigned! They are on their way to the restaurant.';
      case 'picked_up':
        return 'Order picked up! Driver is on their way to you.';
      case 'delivered':
        return 'Order delivered! Enjoy your meal!';
      case 'cancelled':
        return 'Order was cancelled. Please contact support if this was unexpected.';
      case 'expired':
        return 'Order expired. Please place a new order.';
      default:
        return 'Order status unknown.';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Order Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4" />
            <Badge className={statusInfo.color}>
              {statusInfo.label}
            </Badge>
          </div>
          {deliveryId && (
            <Button
              variant="outline"
              size="sm"
              onClick={refreshStatus}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {getStatusMessage()}
        </p>

        {deliveryId && (
          <div className="text-xs text-muted-foreground">
            Delivery ID: {deliveryId}
          </div>
        )}

        {trackingUrl && (
          <Button asChild className="w-full">
            <a 
              href={trackingUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Track on DoorDash
            </a>
          </Button>
        )}

        {!trackingUrl && currentStatus === 'created' && (
          <p className="text-xs text-muted-foreground">
            Tracking URL will be available once a driver is assigned.
          </p>
        )}
      </CardContent>
    </Card>
  );
}


