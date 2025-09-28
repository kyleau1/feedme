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

    // Get user's role and company_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, company_id')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      // If user doesn't exist in database, return null (no company)
      if (userError.code === 'PGRST116') {
        return NextResponse.json(null);
      }
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // If user has a company_id, fetch the company data
    let company = null;
    if (userData.company_id) {
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', userData.company_id)
        .single();
      
      if (companyError) {
        console.error('Error fetching company data:', companyError);
      } else {
        company = companyData;
      }
    }

    // If user has a company, return it
    if (company) {
      return NextResponse.json(company);
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
    const { name, logo_url, address, city, state, zip_code, country } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    // For now, allow any authenticated user to create a company
    // We'll handle user roles later
    console.log('Creating company for user:', userId);
    
    // Skip user creation for now - just create the company
    console.log('Creating company without user creation...');

    // Create company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name,
        logo_url,
        address,
        city,
        state,
        zip_code,
        country: country || 'US',
        created_by: userId,
      })
      .select()
      .single();

    if (companyError) {
      console.error('Error creating company:', companyError);
      return NextResponse.json(
        { 
          error: 'Failed to create company', 
          details: companyError,
          userId: userId 
        },
        { status: 500 }
      );
    }

    // Try to update user with company_id (optional)
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ company_id: company.id })
        .eq('id', userId);

      if (updateError) {
        console.log('Could not update user with company_id (user may not exist):', updateError.message);
        // Don't fail the whole operation for this
      }
    } catch (error) {
      console.log('User update failed, but company was created successfully');
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
    const { id, name, logo_url, address, city, state, zip_code, country } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'Company ID and name are required' },
        { status: 400 }
      );
    }

    // For now, allow any authenticated user to update any company
    // We'll add proper ownership checks later
    console.log('Updating company for user:', userId);

    // Update company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .update({
        name,
        logo_url,
        address,
        city,
        state,
        zip_code,
        country: country || 'US',
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
