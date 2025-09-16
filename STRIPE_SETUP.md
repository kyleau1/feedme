# Stripe Payment Integration Setup

This guide will help you set up Stripe payment processing for your FeedMe app.

## Prerequisites

1. **Stripe Account**: Create a free account at [stripe.com](https://stripe.com)
2. **Stripe Dashboard Access**: You'll need to access your Stripe dashboard to get API keys

## Environment Variables

Add these variables to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key (starts with sk_test_ for test mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key (starts with pk_test_ for test mode)
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook endpoint secret (get this after setting up webhooks)

# Existing variables (keep these)
DOORDASH_DEVELOPER_ID=your_developer_id
DOORDASH_KEY_ID=your_key_id
DOORDASH_SIGNING_SECRET=your_signing_secret
DOORDASH_TEST_MODE=true

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Getting Your Stripe Keys

### 1. Get API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click "Developers" → "API keys"
3. Copy your **Publishable key** (starts with `pk_test_`)
4. Copy your **Secret key** (starts with `sk_test_`)

### 2. Set Up Webhooks

1. Go to "Developers" → "Webhooks"
2. Click "Add endpoint"
3. Set endpoint URL to: `https://yourdomain.com/api/webhooks/stripe`
4. Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.dispute.created`
5. Copy the **Signing secret** (starts with `whsec_`)

## Database Setup

Run the payment schema update in your Supabase SQL editor:

```sql
-- Run the contents of payment_schema_update.sql
```

## Testing Your Integration

### 1. Test Mode

Your app is configured for **test mode** by default:
- ✅ No real money will be charged
- ✅ Use test card numbers
- ✅ Perfect for development

### 2. Test Card Numbers

Use these test card numbers:

```
# Successful payment
4242 4242 4242 4242

# Declined payment
4000 0000 0000 0002

# Requires authentication
4000 0025 0000 3155
```

Use any future expiry date, any 3-digit CVC, and any ZIP code.

### 3. Test the Flow

1. **Start your app**: `npm run dev`
2. **Go to checkout**: Select items and proceed to payment
3. **Use test card**: Enter `4242 4242 4242 4242`
4. **Complete payment**: Should redirect to tracking page
5. **Check database**: Verify order and payment records

## Production Setup

When ready for production:

1. **Switch to live mode**:
   - Get live API keys from Stripe Dashboard
   - Update environment variables
   - Set `NODE_ENV=production`

2. **Update webhook URL**:
   - Change webhook URL to your production domain
   - Update webhook events if needed

3. **Test with real cards**:
   - Use small amounts initially
   - Monitor Stripe Dashboard for transactions

## Payment Flow

Here's how the payment flow works:

```
1. Customer selects items
2. Stripe processes payment (food + delivery + fees)
3. Order saved to database with payment confirmation
4. DoorDash delivery created
5. Customer can track order
```

## Troubleshooting

### Common Issues

1. **"No Stripe signature found"**
   - Check webhook URL is correct
   - Verify webhook secret is set

2. **"Payment intent not found"**
   - Check Stripe API keys are correct
   - Verify database connection

3. **"Order not found"**
   - Check Supabase connection
   - Verify order was saved to database

### Debug Mode

Enable debug logging by adding to your `.env.local`:

```bash
STRIPE_DEBUG=true
```

## Support

- **Stripe Documentation**: [stripe.com/docs](https://stripe.com/docs)
- **Stripe Support**: Available in your Stripe Dashboard
- **FeedMe Issues**: Check the app console for error messages

## Security Notes

- ✅ Never commit API keys to version control
- ✅ Use environment variables for all secrets
- ✅ Enable webhook signature verification
- ✅ Use HTTPS in production
- ✅ Monitor for suspicious activity

## Next Steps

After setting up payments, you can:

1. **Add restaurant payments** (Stripe Connect)
2. **Implement refunds** and cancellations
3. **Add subscription billing** for companies
4. **Set up analytics** and reporting
5. **Add more payment methods** (Apple Pay, Google Pay, etc.)

