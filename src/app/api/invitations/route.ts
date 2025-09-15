import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabaseClient";

// GET /api/invitations - Get invitations for a company
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
    }

    // Get invitations for this company
    const { data: invitations, error } = await supabase
      .from("invitations")
      .select("*")
      .eq("company_id", companyId)
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invitations:", error);
      return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 });
    }

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Error in GET /api/invitations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/invitations - Create a new invitation
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, companyName, maxUses = 1, expiresInDays = 7 } = body;

    if (!companyId || !companyName) {
      return NextResponse.json({ error: "Company ID and name are required" }, { status: 400 });
    }

    // Generate unique invite code (simple approach)
    let inviteCode: string;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      attempts++;
      
      // Check if this code already exists
      const { data: existingInvite } = await supabase
        .from("invitations")
        .select("id")
        .eq("invite_code", inviteCode)
        .single();
      
      if (!existingInvite) {
        break; // Code is unique
      }
    } while (attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      return NextResponse.json({ error: "Failed to generate unique invite code" }, { status: 500 });
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create invitation
    const { data: invitation, error } = await supabase
      .from("invitations")
      .insert({
        company_id: companyId,
        company_name: companyName,
        invite_code: inviteCode,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        max_uses: maxUses,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating invitation:", error);
      return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error("Error in POST /api/invitations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
