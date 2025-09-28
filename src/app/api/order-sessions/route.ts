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
      .select('company_id')
      .eq('id', userId)
      .single();

    if (userError || !userData?.company_id) {
      return NextResponse.json({ error: 'User not found or not in a company' }, { status: 404 });
    }

    // Get all order sessions for the company
    const { data: sessions, error: sessionsError } = await supabase
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
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching order sessions:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch order sessions' }, { status: 500 });
    }

    return NextResponse.json(sessions || []);
  } catch (error) {
    console.error('Error fetching order sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { restaurant_name, restaurant_options, start_time, end_time, doordash_group_link } = await request.json();

    if (!restaurant_name || !restaurant_options || !start_time || !end_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user's company and role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', userId)
      .single();

    if (userError || !userData?.company_id) {
      return NextResponse.json({ error: 'User not found or not in a company' }, { status: 404 });
    }

    if (userData.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can create order sessions' }, { status: 403 });
    }

    // Create order session
    const { data: session, error: sessionError } = await supabase
      .from('order_sessions')
      .insert({
        company_id: userData.company_id,
        restaurant_name,
        restaurant_options,
        start_time,
        end_time,
        doordash_group_link,
        created_by: userId,
        status: 'upcoming'
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating order session:', sessionError);
      return NextResponse.json({ error: 'Failed to create order session' }, { status: 500 });
    }

    // Get all company users to add as participants
    const { data: companyUsers, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, username')
      .eq('company_id', userData.company_id);

    if (usersError) {
      console.error('Error fetching company users:', usersError);
    } else if (companyUsers) {
      // Add all company users as participants
      const participants = companyUsers.map(user => ({
        session_id: session.id,
        user_id: user.id,
        user_name: user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}`
          : user.username || 'Unknown User',
        status: 'pending'
      }));

      await supabase
        .from('order_session_participants')
        .insert(participants);
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error creating order session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
