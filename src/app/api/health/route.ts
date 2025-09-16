import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json({
        status: 'error',
        database: 'disconnected',
        error: error.message,
        code: error.code
      });
    }

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      message: 'Database is working'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      database: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
