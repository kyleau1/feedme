import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    console.log('Fetching order with ID:', orderId);

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Fetch order from database
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    console.log('Order query result:', { order, error });

    if (error || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // If we have a DoorDash delivery ID, try to get the latest status
    if (order.doordash_delivery_id) {
      try {
        const doorDashResponse = await fetch(
          `https://openapi.doordash.com/drive/v2/deliveries/${order.doordash_delivery_id}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${await generateJWT()}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (doorDashResponse.ok) {
          const doorDashData = await doorDashResponse.json();
          
          // Update our database with the latest status
          await supabase
            .from('orders')
            .update({
              delivery_status: doorDashData.delivery_status,
              updated_at: new Date().toISOString(),
              tracking_url: doorDashData.tracking_url,
              pickup_time_estimated: doorDashData.pickup_time_estimated,
              dropoff_time_estimated: doorDashData.dropoff_time_estimated,
            })
            .eq('id', orderId);

          // Return updated order data
          return NextResponse.json({
            ...order,
            delivery_status: doorDashData.delivery_status,
            tracking_url: doorDashData.tracking_url,
            pickup_time_estimated: doorDashData.pickup_time_estimated,
            dropoff_time_estimated: doorDashData.dropoff_time_estimated,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (doorDashError) {
        console.error('Error fetching DoorDash status:', doorDashError);
        // Continue with cached data if DoorDash fails
      }
    }

    return NextResponse.json({ order, error: null });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateJWT(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: 'doordash',
    iss: process.env.DOORDASH_DEVELOPER_ID!,
    iat: now,
    exp: now + 1800, // 30 minutes expiration
    kid: process.env.DOORDASH_KEY_ID!,
  };

  const header = {
    'dd-ver': 'DD-JWT-V1',
    kid: process.env.DOORDASH_KEY_ID!,
    typ: 'JWT',
    alg: 'HS256'
  };

  const signingSecret = Buffer.from(process.env.DOORDASH_SIGNING_SECRET!, 'base64');
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const crypto = require('crypto');
  const signature = crypto
    .createHmac('sha256', signingSecret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
