import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Debug user role for userId:', userId);

    // Get user info from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        role,
        company_id,
        first_name,
        last_name,
        username,
        created_at,
        updated_at,
        companies (
          id,
          name
        )
      `)
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ Error fetching user:', userError);
      return NextResponse.json({ 
        error: "User not found in database",
        details: userError.message,
        userId,
        code: userError.code
      }, { status: 404 });
    }

    console.log('✅ User found:', userData);

    // Check if user can create order sessions
    const canCreateSessions = userData.role === 'admin' || userData.role === 'manager';

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        company_id: userData.company_id,
        name: userData.first_name && userData.last_name 
          ? `${userData.first_name} ${userData.last_name}`
          : userData.username || 'Unknown',
        company: userData.companies
      },
      permissions: {
        canCreateOrderSessions: canCreateSessions,
        reason: canCreateSessions 
          ? `Role '${userData.role}' allows order session creation`
          : `Role '${userData.role}' does not allow order session creation`
      },
      debug: {
        userId,
        timestamp: new Date().toISOString(),
        roleCheck: {
          isAdmin: userData.role === 'admin',
          isManager: userData.role === 'manager',
          roleValue: userData.role
        }
      }
    });

  } catch (error) {
    console.error('❌ Error in debug-user-role:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
