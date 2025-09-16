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

    // Get user data from Clerk using auth()
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get additional user data from Clerk
    const { user } = await import('@clerk/nextjs/server').then(m => m.currentUser());
    
    if (!user) {
      return NextResponse.json(
        { error: 'User data not available' },
        { status: 404 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User profile already exists' },
        { status: 409 }
      );
    }

    // Create user profile
    const role = user.publicMetadata?.role as string || 'employee';
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        first_name: user.firstName || '',
        last_name: user.lastName || '',
        role: role,
        profile_image_url: user.imageUrl,
        company_id: null, // Set to null initially
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user profile:', createError);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(newUser);
  } catch (error) {
    console.error('Error in create-profile API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
