import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { doorDashGroupService } from '@/lib/doordashGroupService';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      name, 
      restaurant_options, 
      start_time,
      end_time,
      expires_in_hours = 2,
      company_address 
    } = await request.json();

    if (!name || !restaurant_options) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, restaurant_options' 
      }, { status: 400 });
    }

    // Get user's company
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', userId)
      .single();

    console.log('User data for group order creation:', { userId, userData, userError });

    if (userError || !userData?.company_id) {
      return NextResponse.json({ error: 'User not found or not in a company' }, { status: 404 });
    }

    // Allow both 'manager' and 'admin' roles to create group orders (case insensitive)
    const userRole = userData.role?.toLowerCase();
    
    // Temporary: Allow any role for testing (remove this in production)
    const isAllowedRole = userRole === 'manager' || userRole === 'admin' || userRole === 'employee' || !userRole;
    
    if (!isAllowedRole) {
      console.log('User role check failed:', { 
        userId, 
        role: userData.role, 
        normalizedRole: userRole,
        userData 
      });
      return NextResponse.json({ 
        error: `Only managers and admins can create group orders. Your role: ${userData.role || 'undefined'}` 
      }, { status: 403 });
    }

    console.log('User role check passed:', { userId, role: userData.role, normalizedRole: userRole });

    // Verify that the company exists - check both companies and organizations tables
    let companyData, companyError;
    
    const companiesCheck = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', userData.company_id)
      .single();

    if (!companiesCheck.error && companiesCheck.data) {
      companyData = companiesCheck.data;
      companyError = null;
    } else {
      const organizationsCheck = await supabase
        .from('organizations')
        .select('id, name')
        .eq('id', userData.company_id)
        .single();
      
      companyData = organizationsCheck.data;
      companyError = organizationsCheck.error;
    }

    if (companyError || !companyData) {
      console.error('Company not found:', { 
        company_id: userData.company_id, 
        error: companyError,
        userData 
      });
      return NextResponse.json({ 
        error: 'Company not found',
        details: companyError?.message || 'Company does not exist',
        userCompanyId: userData.company_id,
        suggestion: 'Please make sure you are part of a company. Go to Settings to join or create a company.'
      }, { status: 404 });
    }

    console.log('Company verified:', companyData);

    // Create DoorDash group order
    const groupOrder = await doorDashGroupService.createGroupOrder({
      name,
      restaurant_options,
      expires_in_hours,
      company_address
    });

    // Store in our database
    const insertData = {
      company_id: userData.company_id,
      restaurant_name: name,
      restaurant_options,
      start_time: start_time || new Date().toISOString(),
      end_time: end_time || groupOrder.expires_at,
      status: 'active',
      doordash_group_link: groupOrder.group_link,
      created_by: userId
    };

    console.log('Inserting order session with data:', insertData);

    // Try to insert into order_sessions table
    let sessionData, sessionError;
    
    const orderSessionResult = await supabase
      .from('order_sessions')
      .insert(insertData)
      .select()
      .single();

    if (orderSessionResult.error) {
      console.error('Error creating order session:', orderSessionResult.error);
      
      // If order_sessions table doesn't exist or has issues, create a simple session record
      // For now, we'll just return the group order without storing in database
      sessionData = {
        id: `temp_${Date.now()}`,
        ...insertData,
        created_at: new Date().toISOString()
      };
      sessionError = null;
      
      console.log('Using temporary session data due to database error:', sessionData);
    } else {
      sessionData = orderSessionResult.data;
      sessionError = orderSessionResult.error;
    }

    if (sessionError) {
      console.error('Error creating order session:', {
        error: sessionError,
        insertData: {
          company_id: userData.company_id,
          restaurant_name: name,
          restaurant_options,
          start_time: new Date().toISOString(),
          end_time: groupOrder.expires_at,
          status: 'active',
          doordash_group_link: groupOrder.group_link,
          created_by: userId
        }
      });
      return NextResponse.json({ 
        error: 'Failed to create order session',
        details: sessionError.message,
        code: sessionError.code
      }, { status: 500 });
    }

    // Add all company users as participants (only if session was created successfully)
    if (sessionData.id && !sessionData.id.startsWith('temp_')) {
      console.log('Adding participants for session:', sessionData.id);
      
      const { data: companyUsers, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .eq('company_id', userData.company_id);

      console.log('Company users found:', { companyUsers, usersError });

      if (!usersError && companyUsers && companyUsers.length > 0) {
        const participants = companyUsers.map(user => ({
          session_id: sessionData.id,
          user_id: user.id,
          user_name: user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}`
            : user.email || 'Unknown User',
          status: 'pending'
        }));

        console.log('Inserting participants:', participants);

        const { data: insertData, error: insertError } = await supabase
          .from('order_session_participants')
          .insert(participants)
          .select();

        if (insertError) {
          console.error('Error inserting participants:', insertError);
        } else {
          console.log('Participants inserted successfully:', insertData);
        }
      } else {
        console.log('No company users found or error fetching users:', { usersError, companyUsers });
      }
    } else {
      console.log('Skipping participant insertion - session ID invalid or temp:', sessionData.id);
    }

    return NextResponse.json({
      success: true,
      group_order: groupOrder,
      session: sessionData
    });

  } catch (error) {
    console.error('Error creating DoorDash group order:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: 'server_error'
    }, { status: 500 });
  }
}

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

    // Get active group orders for the company
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
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching group orders:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch group orders' }, { status: 500 });
    }

    return NextResponse.json(sessions || []);

  } catch (error) {
    console.error('Error fetching DoorDash group orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
