-- Payment Schema Update for FeedMe App
-- Run this in your Supabase SQL editor

-- Add payment-related columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS food_amount DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_fee DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_fee DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_reason TEXT;

-- Create payment_intents table for detailed payment tracking
CREATE TABLE IF NOT EXISTS payment_intents (
  id TEXT PRIMARY KEY, -- Stripe PaymentIntent ID
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL,
  client_secret TEXT,
  payment_method_id TEXT,
  customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create restaurant_payments table for tracking payments to restaurants
CREATE TABLE IF NOT EXISTS restaurant_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  restaurant_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, paid, failed, refunded
  stripe_transfer_id TEXT,
  transfer_group TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create platform_fees table for tracking our platform fees
CREATE TABLE IF NOT EXISTS platform_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  percentage DECIMAL(5,4) NOT NULL, -- e.g., 0.1000 for 10%
  stripe_application_fee_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent_id ON orders(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_intents_order_id ON payment_intents(order_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_payments_order_id ON restaurant_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_platform_fees_order_id ON platform_fees(order_id);

-- Add comments for documentation
COMMENT ON COLUMN orders.payment_intent_id IS 'Stripe PaymentIntent ID for tracking payments';
COMMENT ON COLUMN orders.payment_status IS 'Payment status: pending, succeeded, failed, cancelled, refunded';
COMMENT ON COLUMN orders.total_amount IS 'Total amount charged to customer (in cents)';
COMMENT ON COLUMN orders.food_amount IS 'Amount for food items (in cents)';
COMMENT ON COLUMN orders.service_fee IS 'Service fee charged to customer (in cents)';
COMMENT ON COLUMN orders.platform_fee IS 'Platform fee we keep (in cents)';
COMMENT ON COLUMN orders.stripe_fee IS 'Stripe processing fee (in cents)';
COMMENT ON COLUMN orders.net_amount IS 'Net amount after all fees (in cents)';
COMMENT ON COLUMN orders.refund_amount IS 'Amount refunded to customer (in cents)';
COMMENT ON COLUMN orders.refund_reason IS 'Reason for refund if applicable';

