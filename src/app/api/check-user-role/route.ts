import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await import('@clerk/nextjs/server').then(m => m.auth());
    
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user info from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        role,
        company_id,
        companies (
          id,
          name
        )
      `)
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ 
        error: "User not found in database",
        details: userError,
        userId 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: userData,
      actualRole: userData.role,
      message: `User ${userData.email} has role: ${userData.role}`
    });

  } catch (error) {
    console.error('Error in check-user-role:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
