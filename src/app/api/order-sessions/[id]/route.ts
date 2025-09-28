import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { auth } from '@clerk/nextjs/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, doordash_group_link, start_time, end_time } = await request.json();

    // Get user's company and role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', userId)
      .single();

    if (userError || !userData?.company_id) {
      return NextResponse.json({ error: 'User not found or not in a company' }, { status: 404 });
    }

    // Allow both 'manager' and 'admin' roles to update order sessions (case insensitive)
    const userRole = userData.role?.toLowerCase();
    const isAllowedRole = userRole === 'manager' || userRole === 'admin';
    
    if (!isAllowedRole) {
      return NextResponse.json({ 
        error: `Only managers and admins can update order sessions. Your role: ${userData.role || 'undefined'}` 
      }, { status: 403 });
    }

    // Update order session
    const updateData: any = { updated_at: new Date().toISOString() };
    if (status) updateData.status = status;
    if (doordash_group_link !== undefined) updateData.doordash_group_link = doordash_group_link;
    if (start_time) updateData.start_time = start_time;
    if (end_time) updateData.end_time = end_time;

    const { data: session, error: sessionError } = await supabase
      .from('order_sessions')
      .update(updateData)
      .eq('id', params.id)
      .eq('company_id', userData.company_id)
      .select()
      .single();

    if (sessionError) {
      console.error('Error updating order session:', sessionError);
      return NextResponse.json({ error: 'Failed to update order session' }, { status: 500 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error updating order session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Allow both 'manager' and 'admin' roles to delete order sessions (case insensitive)
    const userRole = userData.role?.toLowerCase();
    const isAllowedRole = userRole === 'manager' || userRole === 'admin';
    
    if (!isAllowedRole) {
      return NextResponse.json({ 
        error: `Only managers and admins can delete order sessions. Your role: ${userData.role || 'undefined'}` 
      }, { status: 403 });
    }

    // Delete order session (participants will be deleted due to CASCADE)
    const { error: sessionError } = await supabase
      .from('order_sessions')
      .delete()
      .eq('id', params.id)
      .eq('company_id', userData.company_id);

    if (sessionError) {
      console.error('Error deleting order session:', sessionError);
      return NextResponse.json({ error: 'Failed to delete order session' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
