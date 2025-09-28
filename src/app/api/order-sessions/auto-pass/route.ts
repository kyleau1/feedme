import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabaseClient';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get the session details
    const { data: session, error: sessionError } = await supabase
      .from('order_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if session is still active and past deadline
    const now = new Date();
    const endTime = new Date(session.end_time);
    
    if (session.status !== 'active' || now <= endTime) {
      return NextResponse.json({ 
        error: 'Session is not active or deadline has not passed',
        sessionStatus: session.status,
        isPastDeadline: now > endTime
      }, { status: 400 });
    }

    // Get all participants who are still pending
    const { data: pendingParticipants, error: participantsError } = await supabase
      .from('order_session_participants')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'pending');

    if (participantsError) {
      return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
    }

    if (!pendingParticipants || pendingParticipants.length === 0) {
      return NextResponse.json({ 
        message: 'No pending participants to auto-pass',
        autoPassedCount: 0
      });
    }

    // Auto-pass all pending participants
    const autoPassedCount = pendingParticipants.length;
    const updatePromises = pendingParticipants.map(async (participant) => {
      // Get user name for the participant
      let user_name = 'Unknown User';
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('first_name, last_name, email')
          .eq('id', participant.user_id)
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
      } catch (userFetchError) {
        console.error('Error fetching user data for auto-pass:', userFetchError);
      }

      // Update participant status to 'passed' with auto-pass reason
      const { error: updateError } = await supabase
        .from('order_session_participants')
        .update({
          status: 'passed',
          preset_order: 'Auto-passed due to deadline',
          updated_at: new Date().toISOString()
        })
        .eq('id', participant.id);

      if (updateError) {
        console.error('Error auto-passing participant:', updateError);
        return { success: false, participantId: participant.id, error: updateError };
      }

      return { success: true, participantId: participant.id, userName: user_name };
    });

    const results = await Promise.all(updatePromises);
    const successfulUpdates = results.filter(r => r.success).length;
    const failedUpdates = results.filter(r => !r.success);

    // Update session status to 'closed' if all participants have responded
    const { data: allParticipants, error: allParticipantsError } = await supabase
      .from('order_session_participants')
      .select('status')
      .eq('session_id', sessionId);

    if (!allParticipantsError && allParticipants) {
      const hasPendingParticipants = allParticipants.some(p => p.status === 'pending');
      
      if (!hasPendingParticipants) {
        // All participants have responded, close the session
        const { error: closeError } = await supabase
          .from('order_sessions')
          .update({ 
            status: 'closed',
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        if (closeError) {
          console.error('Error closing session:', closeError);
        }
      }
    }

    return NextResponse.json({
      message: `Auto-passed ${successfulUpdates} participants`,
      autoPassedCount: successfulUpdates,
      failedCount: failedUpdates.length,
      failedUpdates: failedUpdates,
      sessionClosed: !allParticipants?.some(p => p.status === 'pending')
    });

  } catch (error) {
    console.error('Error in auto-pass endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
