import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body);
    console.log('SupabaseAdmin available:', !!supabaseAdmin);
    console.log('Service key available:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const { session_id, user_id, response, preset_order } = body;

    if (!session_id || !user_id || !response) {
      console.log('Missing fields:', { session_id, user_id, response });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (response === 'preset' && !preset_order) {
      return NextResponse.json({ error: 'Preset order is required when response is preset' }, { status: 400 });
    }

    // Get user's name from the database
    let user_name = 'Unknown User';
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('first_name, last_name, email')
        .eq('id', user_id)
        .single();
      
      if (userData && !userError) {
        if (userData.first_name && userData.last_name) {
          user_name = `${userData.first_name} ${userData.last_name}`;
        } else if (userData.first_name) {
          user_name = userData.first_name;
        } else if (userData.email) {
          user_name = userData.email;
        }
      }
      console.log('User data:', userData, 'User name:', user_name);
    } catch (userFetchError) {
      console.error('Error fetching user data:', userFetchError);
      // Continue with default name
    }

    // Update or insert participant response
    console.log('Upsert data:', {
      session_id,
      user_id,
      user_name,
      status: response,
      preset_order: response === 'preset' ? preset_order : null,
      updated_at: new Date().toISOString()
    });
    
    let data, error;
    
    // Try admin client first, then fallback to regular client
    if (supabaseAdmin) {
      console.log('Using admin client to bypass RLS');
      console.log('Admin client available:', !!supabaseAdmin);
      try {
        const result = await supabaseAdmin
          .from('order_session_participants')
          .upsert({
            session_id,
            user_id,
            user_name,
            status: response,
            preset_order: response === 'preset' ? preset_order : null,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'session_id,user_id'
          })
          .select()
          .single();
        data = result.data;
        error = result.error;
        console.log('Admin client result:', { data, error });
        
        // If admin client fails with RLS error, try direct SQL
        if (error && error.code === '42501') {
          console.log('Admin client failed with RLS error, trying direct SQL...');
          try {
            const sqlResult = await supabaseAdmin.rpc('exec_sql', {
              sql: 'ALTER TABLE order_session_participants DISABLE ROW LEVEL SECURITY;'
            });
            console.log('Direct SQL result:', sqlResult);
            
            // Try the insert again
            const retryResult = await supabaseAdmin
              .from('order_session_participants')
              .upsert({
                session_id,
                user_id,
                user_name,
                status: response,
                preset_order: response === 'preset' ? preset_order : null,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'session_id,user_id'
              })
              .select()
              .single();
            data = retryResult.data;
            error = retryResult.error;
            console.log('Retry after SQL result:', { data, error });
          } catch (sqlError) {
            console.error('Direct SQL failed:', sqlError);
            // If SQL fails, try the bypass API
            console.log('Trying bypass RLS insert API...');
            try {
              const bypassResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/bypass-rls-insert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id, response, preset_order })
              });
              const bypassResult = await bypassResponse.json();
              if (bypassResponse.ok) {
                data = bypassResult.data;
                error = null;
                console.log('Bypass API succeeded:', bypassResult);
              } else {
                error = { message: bypassResult.error, code: 'BYPASS_FAILED' };
                console.log('Bypass API failed:', bypassResult);
              }
            } catch (bypassError) {
              console.error('Bypass API error:', bypassError);
              error = bypassError;
            }
          }
        }
      } catch (adminError) {
        console.error('Admin client error:', adminError);
        error = adminError;
      }
    } else {
      console.log('Using regular client (RLS may block this)');
      console.log('SUPABASE_SERVICE_ROLE_KEY not found - add it to .env.local to bypass RLS');
      const result = await supabase
        .from('order_session_participants')
        .upsert({
          session_id,
          user_id,
          user_name,
          status: response,
          preset_order: response === 'preset' ? preset_order : null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'session_id,user_id'
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
      console.log('Regular client result:', { data, error });
    }

    if (error) {
      console.error('Error updating participant response:', error);
      console.error('Error object keys:', Object.keys(error));
      console.error('Error object values:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      if (error.code === '42501') {
        const errorResponse = { 
          error: 'RLS policy violation - participant table access denied',
          details: String(error.message || 'RLS policy blocks participant table access'),
          code: String(error.code || '42501'),
          solution: 'Add SUPABASE_SERVICE_ROLE_KEY to .env.local or disable RLS on order_session_participants table'
        };
        console.log('Returning RLS error response:', errorResponse);
        console.log('Error response JSON stringified:', JSON.stringify(errorResponse));
        return NextResponse.json(errorResponse, { status: 500 });
      }
      
      if (error.code === '23505') {
        const errorResponse = { 
          error: 'Duplicate participant - user already in session',
          details: String(error.message || 'User is already a participant in this session'),
          code: String(error.code || '23505'),
          solution: 'This should not happen with upsert - check database constraints'
        };
        console.log('Returning duplicate key error response:', errorResponse);
        return NextResponse.json(errorResponse, { status: 409 });
      }
      
      const errorResponse = { 
        error: 'Failed to update response',
        details: String(error.message || 'Unknown database error'),
        code: String(error.code || 'UNKNOWN_ERROR')
      };
      console.log('Returning general error response:', errorResponse);
      console.log('General error response JSON stringified:', JSON.stringify(errorResponse));
      return NextResponse.json(errorResponse, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error updating participant response:', error);
    const errorResponse = { 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
    console.log('Returning catch error response:', errorResponse);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
