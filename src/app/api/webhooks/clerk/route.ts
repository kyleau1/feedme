import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, public_metadata } = evt.data;
    
    console.log("User created:", { id, email_addresses, first_name, last_name, public_metadata });

    // Determine user role based on metadata or default to employee
    const role = public_metadata?.role || "employee";
    const companyId = public_metadata?.companyId;
    const companyName = public_metadata?.companyName;

    try {
      // Create user record in Supabase
      const { error: userError } = await supabase
        .from("users")
        .insert({
          id: id,
          email: email_addresses[0]?.email_address,
          first_name: first_name,
          last_name: last_name,
          role: role,
          company_id: companyId,
          created_at: new Date().toISOString(),
        });

      if (userError) {
        console.error("Error creating user in Supabase:", userError);
      }

      // If this is a company user, create an organization
      if (role === "company" && companyName) {
        const { error: orgError } = await supabase
          .from("organizations")
          .insert({
            id: companyId || id, // Use provided companyId or user id as org id
            name: companyName,
            created_by: id,
            created_at: new Date().toISOString(),
          });

        if (orgError) {
          console.error("Error creating organization:", orgError);
        }
      }

      // If this is an employee with an invite code, handle the invitation
      if (role === "employee" && public_metadata?.inviteCode) {
        // The invitation acceptance should be handled in the frontend
        // This is just for logging purposes
        console.log("Employee joined with invite code:", public_metadata.inviteCode);
      }

    } catch (error) {
      console.error("Error in user.created webhook:", error);
    }
  }

  if (eventType === "user.updated") {
    const { id, public_metadata } = evt.data;
    
    try {
      // Update user role if it changed
      const role = public_metadata?.role;
      if (role) {
        const { error } = await supabase
          .from("users")
          .update({ role: role })
          .eq("id", id);

        if (error) {
          console.error("Error updating user role:", error);
        }
      }
    } catch (error) {
      console.error("Error in user.updated webhook:", error);
    }
  }

  return new Response("", { status: 200 });
}

