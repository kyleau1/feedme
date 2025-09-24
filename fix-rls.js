// Fix RLS errors using Supabase client
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLS() {
  console.log('🔧 Fixing RLS errors...');
  
  try {
    // Enable RLS on all tables
    const tables = [
      'restaurants',
      'organization_users', 
      'organizations',
      'orders',
      'invitations',
      'users'
    ];

    for (const table of tables) {
      console.log(`Enabling RLS on ${table}...`);
      
      // Enable RLS
      const { error: rlsError } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`
      });
      
      if (rlsError) {
        console.error(`Error enabling RLS on ${table}:`, rlsError);
      } else {
        console.log(`✅ RLS enabled on ${table}`);
      }
    }

    // Create basic policies for restaurants table
    console.log('Creating policies for restaurants...');
    
    const policies = [
      `CREATE POLICY IF NOT EXISTS "Anyone can view active restaurants" ON public.restaurants FOR SELECT USING (is_active = true);`,
      `CREATE POLICY IF NOT EXISTS "Authenticated users can view all restaurants" ON public.restaurants FOR SELECT USING (auth.role() = 'authenticated');`
    ];

    for (const policy of policies) {
      const { error: policyError } = await supabase.rpc('exec_sql', {
        sql: policy
      });
      
      if (policyError) {
        console.error('Error creating policy:', policyError);
      } else {
        console.log('✅ Policy created');
      }
    }

    console.log('🎉 RLS fixes completed!');
    
  } catch (error) {
    console.error('Error fixing RLS:', error);
  }
}

fixRLS();
