import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook signature if needed (DoorDash provides webhook verification)
    // For now, we'll process all webhooks
    
    const { 
      delivery_id, 
      external_delivery_id, 
      status, 
      pickup_time, 
      dropoff_time,
      tracking_url 
    } = body;

    console.log('DoorDash webhook received:', {
      delivery_id,
      external_delivery_id,
      status,
      pickup_time,
      dropoff_time
    });

    // Update order status in database
    if (external_delivery_id) {
      const { error } = await supabase
        .from('orders')
        .update({
          doordash_delivery_id: delivery_id,
          delivery_status: status,
          pickup_time: pickup_time,
          dropoff_time: dropoff_time,
          tracking_url: tracking_url,
          updated_at: new Date().toISOString()
        })
        .eq('external_delivery_id', external_delivery_id);

      if (error) {
        console.error('Error updating order status:', error);
        return NextResponse.json(
          { error: 'Failed to update order status' },
          { status: 500 }
        );
      }

      console.log(`Order ${external_delivery_id} status updated to: ${status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DoorDash webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle webhook verification (GET request)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    // Return the challenge for webhook verification
    return NextResponse.json({ challenge });
  }
  
  return NextResponse.json({ status: 'ok' });
}


