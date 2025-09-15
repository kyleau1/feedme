# DoorDash Sandbox Setup

## Current Status
Your app is configured to use **DoorDash Sandbox** since your credentials are for the sandbox environment:
- ✅ No real deliveries will be created
- ✅ No real money will be charged
- ✅ Perfect for testing and development
- ✅ Uses `https://openapi-sandbox.doordash.com`

## Environment Variables

Add this to your `.env.local` file to ensure sandbox mode:

```bash
# DoorDash Configuration
DOORDASH_DEVELOPER_ID=your_developer_id
DOORDASH_KEY_ID=your_key_id
DOORDASH_SIGNING_SECRET=your_signing_secret

# Enable Sandbox Mode
DOORDASH_TEST_MODE=true

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How to Switch Modes

### For Testing (Sandbox):
```bash
DOORDASH_TEST_MODE=true
NODE_ENV=development
```

### For Production (Real Deliveries):
```bash
DOORDASH_TEST_MODE=false
NODE_ENV=production
```

## Visual Indicators

The app will show:
- 🧪 **Sandbox Mode** - Yellow badge when in test mode
- ⚠️ **Production Mode** - Red badge when in production mode

## What Happens in Each Mode

### Sandbox Mode:
- Orders are saved to your database
- DoorDash API calls are made to sandbox
- No real deliveries are created
- No real money is charged
- Perfect for testing the full flow

### Production Mode:
- Orders are saved to your database
- DoorDash API calls are made to production
- **Real deliveries are created**
- **Real money is charged**
- Real dashers will pick up and deliver orders

## Testing Your App

1. **Start with Sandbox**: Always test in sandbox mode first
2. **Verify Order Flow**: Make sure orders save to database
3. **Check Tracking**: Verify tracking page works
4. **Test Edge Cases**: Try different scenarios
5. **Switch to Production**: Only when ready for real users

## Troubleshooting

If you see "Order Not Found" errors:
1. Check that your Supabase environment variables are set
2. Verify the order was saved to the database
3. Check the browser console for error messages

If DoorDash API calls fail:
1. Verify your DoorDash credentials are correct
2. Check that you're using the right environment (sandbox vs production)
3. Look at the terminal logs for specific error messages
