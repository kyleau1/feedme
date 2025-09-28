import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Remove user from company (set company_id to null)
    const { error: userError } = await supabase
      .from('users')
      .update({ 
        company_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (userError) {
      console.error('Error removing user from company:', userError);
      return NextResponse.json(
        { error: 'Failed to leave company' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Successfully left company' });
  } catch (error) {
    console.error('Error in leave-company API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
