# DoorDash API Integration Setup

This guide will help you set up DoorDash API integration for real food delivery in your FeedMe app.

## Prerequisites

1. **DoorDash Developer Account**: Sign up at [DoorDash Developer Portal](https://developer.doordash.com/)
2. **DoorDash API Credentials**: Get your developer ID, key ID, and signing secret

## Environment Variables

Add these to your `.env.local` file:

```bash
# DoorDash API Credentials
DOORDASH_DEVELOPER_ID=your_doordash_developer_id
DOORDASH_KEY_ID=your_doordash_key_id
DOORDASH_SIGNING_SECRET=your_doordash_signing_secret

# Webhook URL (for production)
DOORDASH_WEBHOOK_URL=https://yourdomain.com/api/webhooks/doordash
```

## Setup Steps

### 1. Get DoorDash Credentials

1. Go to [DoorDash Developer Portal](https://developer.doordash.com/)
2. Create a new project
3. Navigate to "Credentials" section
4. Copy your:
   - Developer ID
   - Key ID  
   - Signing Secret

### 2. Install Dependencies

The required packages are already added to `package.json`:

```bash
npm install
```

### 3. Configure Webhooks (Optional)

For real-time delivery updates, configure webhooks in your DoorDash developer dashboard:

1. Go to your project settings
2. Add webhook URL: `https://yourdomain.com/api/webhooks/doordash`
3. Select events: `delivery.created`, `delivery.updated`, `delivery.completed`

### 4. Test the Integration

1. Start your development server: `npm run dev`
2. Go to the checkout page
3. Place a test order
4. Check the console for DoorDash API responses

## API Endpoints

The integration provides these endpoints:

- `POST /api/doordash` - Main DoorDash API proxy
  - Actions: `quote`, `create`, `status`, `cancel`
- `GET /api/doordash?deliveryId=xxx` - Get delivery details
- `POST /api/webhooks/doordash` - Webhook for delivery updates

## Usage Example

```typescript
// Get delivery quote
const quoteResponse = await fetch('/api/doordash', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'quote',
    external_delivery_id: 'order_123',
    pickup_address: { /* address object */ },
    dropoff_address: { /* address object */ },
    // ... other required fields
  })
});

// Create delivery
const deliveryResponse = await fetch('/api/doordash', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'create',
    // ... same fields as quote
  })
});
```

## Database Schema Updates

The integration expects these additional columns in your `orders` table:

```sql
ALTER TABLE orders ADD COLUMN external_delivery_id TEXT;
ALTER TABLE orders ADD COLUMN doordash_delivery_id TEXT;
ALTER TABLE orders ADD COLUMN delivery_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN delivery_fee DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN tracking_url TEXT;
ALTER TABLE orders ADD COLUMN pickup_time TIMESTAMP;
ALTER TABLE orders ADD COLUMN dropoff_time TIMESTAMP;
```

## Testing

1. **Sandbox Mode**: The app uses DoorDash's sandbox environment by default
2. **Test Orders**: Use the delivery simulator in DoorDash's developer portal
3. **Webhook Testing**: Use ngrok or similar to test webhooks locally

## Production Deployment

1. Switch to production DoorDash API by setting `NODE_ENV=production`
2. Update webhook URLs to your production domain
3. Test with real orders in a controlled environment
4. Monitor delivery success rates and customer feedback

## Troubleshooting

### Common Issues

1. **"DoorDash service not configured"**: Check your environment variables
2. **"Invalid JWT token"**: Verify your signing secret is correct
3. **"Delivery creation failed"**: Check address format and required fields
4. **Webhook not receiving updates**: Verify webhook URL is accessible

### Debug Mode

Enable detailed logging by adding to your environment:

```bash
DEBUG=doordash:*
```

## Support

- [DoorDash API Documentation](https://developer.doordash.com/docs/)
- [DoorDash Support](https://developer.doordash.com/support)
- [API Status Page](https://status.doordash.com/)

## Important Notes

- **Sandbox vs Production**: Always test in sandbox first
- **Rate Limits**: DoorDash has API rate limits - implement proper throttling
- **Error Handling**: Always handle API failures gracefully
- **Address Validation**: Ensure addresses are properly formatted
- **Phone Numbers**: Use E.164 format (+1234567890)
- **Order Values**: Must be accurate for proper delivery quotes


