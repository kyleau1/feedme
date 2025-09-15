-- Add DoorDash integration columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS external_delivery_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS doordash_delivery_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_time TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dropoff_time TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_external_delivery_id ON orders(external_delivery_id);
CREATE INDEX IF NOT EXISTS idx_orders_doordash_delivery_id ON orders(doordash_delivery_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);

-- Add delivery status enum constraint
ALTER TABLE orders ADD CONSTRAINT IF NOT EXISTS check_delivery_status 
CHECK (delivery_status IN ('pending', 'quote', 'created', 'accepted', 'picked_up', 'delivered', 'cancelled', 'expired'));

-- Update existing orders to have updated_at timestamp
UPDATE orders SET updated_at = NOW() WHERE updated_at IS NULL;


