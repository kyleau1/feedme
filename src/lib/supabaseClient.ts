import { createClient } from "@supabase/supabase-js";

// Make sure you add these keys to your .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client for admin operations (bypasses RLS)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Debug logging
console.log('Supabase Admin Client Status:', {
  hasServiceKey: !!supabaseServiceKey,
  adminClientCreated: !!supabaseAdmin,
  serviceKeyLength: supabaseServiceKey?.length || 0
});
