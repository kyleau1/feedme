import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabaseClient';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      );
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('Stripe webhook event:', event.type);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object);
        break;
      
      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  console.log('Payment succeeded:', paymentIntent.id);
  
  // Update order status
  const { error: orderError } = await supabase
    .from('orders')
    .update({
      payment_status: 'succeeded',
      updated_at: new Date().toISOString()
    })
    .eq('payment_intent_id', paymentIntent.id);

  if (orderError) {
    console.error('Error updating order status:', orderError);
    return;
  }

  // Update payment_intents table
  await supabase
    .from('payment_intents')
    .update({
      status: 'succeeded',
      payment_method_id: paymentIntent.payment_method,
      updated_at: new Date().toISOString()
    })
    .eq('id', paymentIntent.id);

  // Get order details for DoorDash delivery
  const { data: orderData, error: orderError2 } = await supabase
    .from('orders')
    .select('*')
    .eq('payment_intent_id', paymentIntent.id)
    .single();

  if (orderError2 || !orderData) {
    console.error('Order not found for payment:', orderError2);
    return;
  }

  // TODO: Trigger DoorDash delivery creation
  console.log('Ready to create DoorDash delivery for order:', orderData.id);
}

async function handlePaymentFailed(paymentIntent: any) {
  console.log('Payment failed:', paymentIntent.id);
  
  const { error } = await supabase
    .from('orders')
    .update({
      payment_status: 'failed',
      updated_at: new Date().toISOString()
    })
    .eq('payment_intent_id', paymentIntent.id);

  if (error) {
    console.error('Error updating order status:', error);
  }
}

async function handlePaymentCanceled(paymentIntent: any) {
  console.log('Payment canceled:', paymentIntent.id);
  
  const { error } = await supabase
    .from('orders')
    .update({
      payment_status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('payment_intent_id', paymentIntent.id);

  if (error) {
    console.error('Error updating order status:', error);
  }
}

async function handleChargeDispute(charge: any) {
  console.log('Charge dispute created:', charge.id);
  
  // TODO: Handle disputes - notify admin, update order status, etc.
  // This is important for fraud prevention and customer service
}

