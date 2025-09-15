import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabaseClient";

// DELETE /api/invitations/[id] - Delete an invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invitationId = params.id;

    if (!invitationId) {
      return NextResponse.json({ error: "Invitation ID is required" }, { status: 400 });
    }

    // First, check if the invitation exists and belongs to the user
    const { data: invitation, error: fetchError } = await supabase
      .from("invitations")
      .select("id, created_by")
      .eq("id", invitationId)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Check if the user created this invitation
    if (invitation.created_by !== user.id) {
      return NextResponse.json({ error: "Unauthorized to delete this invitation" }, { status: 403 });
    }

    // Delete the invitation
    const { error: deleteError } = await supabase
      .from("invitations")
      .delete()
      .eq("id", invitationId);

    if (deleteError) {
      console.error("Error deleting invitation:", deleteError);
      return NextResponse.json({ error: "Failed to delete invitation" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Invitation deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/invitations/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}










