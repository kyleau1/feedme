import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's role and company
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, company_id, company:company_id(*)')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // If user has a company, return it
    if (userData.company) {
      return NextResponse.json(userData.company);
    }

    return NextResponse.json(null);
  } catch (error) {
    console.error('Error in companies API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { name, logo_url } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can create companies' },
        { status: 403 }
      );
    }

    // Create company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name,
        logo_url,
        created_by: userId,
      })
      .select()
      .single();

    if (companyError) {
      console.error('Error creating company:', companyError);
      return NextResponse.json(
        { error: 'Failed to create company' },
        { status: 500 }
      );
    }

    // Update user with company_id
    const { error: updateError } = await supabase
      .from('users')
      .update({ company_id: company.id })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user company:', updateError);
      return NextResponse.json(
        { error: 'Company created but failed to assign to user' },
        { status: 500 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error in companies API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, name, logo_url } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'Company ID and name are required' },
        { status: 400 }
      );
    }

    // Check if user is admin and owns the company
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, company_id')
      .eq('id', userId)
      .single();

    if (userError || userData.role !== 'admin' || userData.company_id !== id) {
      return NextResponse.json(
        { error: 'Only company admins can update company information' },
        { status: 403 }
      );
    }

    // Update company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .update({
        name,
        logo_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (companyError) {
      console.error('Error updating company:', companyError);
      return NextResponse.json(
        { error: 'Failed to update company' },
        { status: 500 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error in companies API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
