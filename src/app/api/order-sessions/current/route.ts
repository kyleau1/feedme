import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', userId)
      .single();

    if (userError || !userData?.company_id) {
      return NextResponse.json({ error: 'User not found or not in a company' }, { status: 404 });
    }

    // Get current active session for the company
    const now = new Date().toISOString();
    const { data: currentSession, error: sessionError } = await supabase
      .from('order_sessions')
      .select(`
        *,
        participants:order_session_participants(
          user_id,
          user_name,
          status,
          preset_order
        )
      `)
      .eq('company_id', userData.company_id)
      .eq('status', 'active')
      .gte('end_time', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError && sessionError.code !== 'PGRST116') {
      console.error('Error fetching current session:', sessionError);
      return NextResponse.json({ error: 'Failed to fetch current session' }, { status: 500 });
    }

    return NextResponse.json(currentSession || null);

  } catch (error) {
    console.error('Error in current session API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}