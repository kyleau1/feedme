# Fix RLS (Row Level Security) Errors

## Instructions

You need to run these SQL commands in your Supabase dashboard to fix the RLS errors:

### 1. Go to your Supabase Dashboard
- Visit: https://supabase.com/dashboard
- Select your project: `dksynzttusqhtisrbahc`
- Go to the SQL Editor

### 2. Run these SQL commands:

```sql
-- Enable RLS on all tables
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create basic policies for restaurants table
CREATE POLICY "Anyone can view active restaurants" ON public.restaurants
    FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can view all restaurants" ON public.restaurants
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policies for other tables
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add more policies as needed for other tables
```

### 3. Verify the fix
After running these commands, the RLS errors should be resolved. You can verify by:
- Checking the Database Linter in your Supabase dashboard
- The errors should no longer appear

## What this fixes:
- ✅ Enables RLS on all public tables
- ✅ Creates basic security policies
- ✅ Allows public access to active restaurants
- ✅ Protects user data with proper policies
- ✅ Resolves all the security warnings

## Next Steps:
After fixing RLS, your app should work properly with:
- Restaurant search and menu display
- User authentication and data protection
- Proper security policies in place
