import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const fourMinutesFromNow = new Date(now.getTime() + 4 * 60 * 1000);
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    // Get all active sessions
    const { data: allSessions, error: allError } = await supabase
      .from('order_sessions')
      .select('*')
      .eq('status', 'active')
      .order('end_time', { ascending: true });

    if (allError) {
      return NextResponse.json({ error: 'Failed to fetch sessions', details: allError }, { status: 500 });
    }

    // Get sessions that should trigger reminders (4-5 minutes from now)
    const { data: reminderSessions, error: reminderError } = await supabase
      .from('order_sessions')
      .select('*')
      .eq('status', 'active')
      .gte('end_time', fourMinutesFromNow.toISOString())
      .lte('end_time', fiveMinutesFromNow.toISOString());

    if (reminderError) {
      return NextResponse.json({ error: 'Failed to fetch reminder sessions', details: reminderError }, { status: 500 });
    }

    return NextResponse.json({
      currentTime: now.toISOString(),
      fourMinutesFromNow: fourMinutesFromNow.toISOString(),
      fiveMinutesFromNow: fiveMinutesFromNow.toISOString(),
      allActiveSessions: allSessions?.map(session => ({
        id: session.id,
        restaurant_name: session.restaurant_name,
        start_time: session.start_time,
        end_time: session.end_time,
        status: session.status,
        timeUntilEnd: Math.round((new Date(session.end_time).getTime() - now.getTime()) / 1000 / 60) + ' minutes'
      })) || [],
      sessionsNeedingReminders: reminderSessions?.map(session => ({
        id: session.id,
        restaurant_name: session.restaurant_name,
        end_time: session.end_time,
        timeUntilEnd: Math.round((new Date(session.end_time).getTime() - now.getTime()) / 1000 / 60) + ' minutes'
      })) || [],
      reminderCount: reminderSessions?.length || 0
    });

  } catch (error) {
    console.error('Error in debug sessions:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
