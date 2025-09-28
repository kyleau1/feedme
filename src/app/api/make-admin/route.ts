import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log(`Making ${email} an admin...`);

    // First, check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    if (existingUser) {
      // Update existing user to admin
      const { data, error } = await supabase
        .from('users')
        .update({ 
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('email', email)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        return NextResponse.json(
          { error: 'Failed to update user role' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        message: `Successfully made ${email} an admin`,
        user: data
      });
    } else {
      // User doesn't exist in database yet
      return NextResponse.json(
        { error: 'User not found in database. Please sign in first.' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error in make-admin API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
