import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { auth } from '@clerk/nextjs/server';
import { slackService } from '@/lib/slackService';

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

    // Validate required fields with detailed error messages
    if (!restaurant_name) {
      return NextResponse.json({ 
        error: 'Missing required field: restaurant_name',
        details: 'The restaurant name is required to create an order session',
        suggestion: 'Please provide a restaurant name'
      }, { status: 400 });
    }

    if (!restaurant_options || !Array.isArray(restaurant_options) || restaurant_options.length === 0) {
      return NextResponse.json({ 
        error: 'Missing or invalid restaurant_options',
        details: 'Restaurant options must be a non-empty array',
        suggestion: 'Please provide at least one restaurant option'
      }, { status: 400 });
    }

    if (!start_time) {
      return NextResponse.json({ 
        error: 'Missing required field: start_time',
        details: 'The start time is required to create an order session',
        suggestion: 'Please provide a valid start time'
      }, { status: 400 });
    }

    if (!end_time) {
      return NextResponse.json({ 
        error: 'Missing required field: end_time',
        details: 'The end time is required to create an order session',
        suggestion: 'Please provide a valid end time'
      }, { status: 400 });
    }

    // Validate that start_time is before end_time
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    
    if (startDate >= endDate) {
      return NextResponse.json({ 
        error: 'Invalid time range',
        details: 'Start time must be before end time',
        suggestion: 'Please ensure the start time is earlier than the end time'
      }, { status: 400 });
    }

    // Get user's company and role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id, role, email')
      .eq('id', userId)
      .single();

    if (userError || !userData?.company_id) {
      console.error('User lookup error:', userError);
      console.error('User data:', userData);
      return NextResponse.json({ 
        error: 'User not found or not in a company',
        details: userError?.message || 'No company associated with user',
        userId: userId
      }, { status: 404 });
    }

    console.log('User attempting to create order session:', {
      userId,
      email: userData.email,
      role: userData.role,
      companyId: userData.company_id
    });

    if (userData.role !== 'manager' && userData.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Only managers and admins can create order sessions',
        details: `Your current role is: ${userData.role || 'undefined'}`,
        suggestion: 'Contact your administrator to get manager permissions'
      }, { status: 403 });
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
      return NextResponse.json({ 
        error: 'Failed to create order session',
        details: sessionError.message,
        suggestion: 'Please check your input and try again'
      }, { status: 500 });
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

    // Send Slack notification for session creation
    try {
      await slackService.sendSessionCreatedNotification(session);
      console.log('Slack notification sent for session creation');
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
      // Don't fail the request if Slack notification fails
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error creating order session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
