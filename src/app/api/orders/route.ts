import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch orders for the authenticated user
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    return NextResponse.json(orders || []);
  } catch (error) {
    console.error('Error in orders API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      restaurant_id,
      items,
      total_amount,
      food_amount,
      service_fee,
      platform_fee,
      delivery_fee,
      payment_intent_id,
      payment_status = 'pending'
    } = body;

    // Generate external delivery ID
    const external_delivery_id = `feedme_${Date.now()}_${userId}`;

    // Create order in database
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        user_name: 'Customer', // Default user name
        restaurant_id,
        items,
        status: 'pending',
        external_delivery_id,
        delivery_status: 'pending',
        delivery_fee: delivery_fee || 399, // Default delivery fee
        payment_intent_id,
        payment_status,
        total_amount,
        food_amount,
        service_fee,
        platform_fee,
        stripe_fee: null,
        net_amount: null,
        refund_amount: null,
        refund_reason: null,
        menu_items: null,
        order_total: null,
        item_count: items ? items.length : 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error in orders POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
