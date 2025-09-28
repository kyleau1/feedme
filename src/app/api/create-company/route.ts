import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, address } = await request.json();

    if (!name) {
      return NextResponse.json({ 
        error: 'Company name is required' 
      }, { status: 400 });
    }

    // Check if user already has a company
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (userError) {
      return NextResponse.json({ 
        error: 'User not found',
        details: userError.message 
      }, { status: 404 });
    }

    // Check if the user's existing company actually exists
    if (userData.company_id) {
      // Check both companies and organizations tables
      const companiesCheck = await supabase
        .from('companies')
        .select('id')
        .eq('id', userData.company_id)
        .single();

      const organizationsCheck = await supabase
        .from('organizations')
        .select('id')
        .eq('id', userData.company_id)
        .single();

      if ((!companiesCheck.error && companiesCheck.data) || (!organizationsCheck.error && organizationsCheck.data)) {
        return NextResponse.json({ 
          error: 'User already has a valid company',
          companyId: userData.company_id 
        }, { status: 400 });
      }
      
      // If we get here, the user has an orphaned company_id
      console.log('User has orphaned company_id, will create new company and update association');
    }

    // Try to create the company in the companies table first (based on the foreign key error)
    let companyData, companyError;
    
    // First try companies table
    const companiesResult = await supabase
      .from('companies')
      .insert({
        name,
        created_by: userId
      })
      .select()
      .single();

    if (companiesResult.error) {
      // If companies table doesn't exist or fails, try organizations table
      const organizationsResult = await supabase
        .from('organizations')
        .insert({
          name,
          created_by: userId
        })
        .select()
        .single();
      
      companyData = organizationsResult.data;
      companyError = organizationsResult.error;
    } else {
      companyData = companiesResult.data;
      companyError = companiesResult.error;
    }

    if (companyError) {
      console.error('Error creating company:', companyError);
      return NextResponse.json({ 
        error: 'Failed to create company',
        details: companyError.message 
      }, { status: 500 });
    }

    // Update user with company_id and set role to admin
    const { error: updateUserError } = await supabase
      .from('users')
      .update({
        company_id: companyData.id,
        role: 'admin'
      })
      .eq('id', userId);

    if (updateUserError) {
      console.error('Error updating user with company:', updateUserError);
      return NextResponse.json({ 
        error: 'Company created but failed to associate with user',
        details: updateUserError.message,
        companyId: companyData.id
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: userData.company_id ? 'Orphaned company fixed - created new company and updated association' : 'Company created successfully',
      company: companyData,
      userRole: 'admin'
    });

  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
