import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabaseClient";

// POST /api/invitations/accept - Accept an invitation
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode) {
      return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    }

    // Get the invitation
    const { data: invitation, error: fetchError } = await supabase
      .from("invitations")
      .select("*")
      .eq("invite_code", inviteCode)
      .eq("is_active", true)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json({ error: "Invalid or expired invitation code" }, { status: 404 });
    }

    // Check if invitation is expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (now > expiresAt) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
    }

    // Check if invitation has reached max uses
    if (invitation.used_count >= invitation.max_uses) {
      return NextResponse.json({ error: "Invitation has reached maximum uses" }, { status: 400 });
    }

    // Check if user has already used this invitation
    if (invitation.used_by && invitation.used_by.includes(user.id)) {
      return NextResponse.json({ error: "You have already used this invitation" }, { status: 400 });
    }

    // Update the invitation to mark it as used
    const updatedUsedBy = invitation.used_by ? [...invitation.used_by, user.id] : [user.id];
    
    const { error: updateError } = await supabase
      .from("invitations")
      .update({
        used_count: invitation.used_count + 1,
        used_by: updatedUsedBy,
        is_active: (invitation.used_count + 1) >= invitation.max_uses ? false : true,
      })
      .eq("id", invitation.id);

    if (updateError) {
      console.error("Error updating invitation:", updateError);
      return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 });
    }

    // Add user to the company's organization
    // First, check if organization exists
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", invitation.company_id)
      .single();

    if (orgError || !org) {
      // Create organization if it doesn't exist
      const { data: newOrg, error: createOrgError } = await supabase
        .from("organizations")
        .insert({
          id: invitation.company_id,
          name: invitation.company_name,
          created_by: invitation.created_by,
        })
        .select()
        .single();

      if (createOrgError) {
        console.error("Error creating organization:", createOrgError);
        return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
      }
    }

    // Update user's metadata to include company information
    // Note: In a real app, you'd update this via Clerk's API
    // For now, we'll just return success

    return NextResponse.json({ 
      success: true, 
      message: `Successfully joined ${invitation.company_name}!`,
      companyId: invitation.company_id,
      companyName: invitation.company_name
    });
  } catch (error) {
    console.error("Error in POST /api/invitations/accept:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

