"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Plus, Trash2, Users, Clock, CheckCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Invitation {
  id: string;
  company_id: string;
  company_name: string;
  invite_code: string;
  created_at: string;
  expires_at: string;
  max_uses: number;
  used_count: number;
  is_active: boolean;
}

interface InviteManagerProps {
  companyId: string;
  companyName: string;
}

export default function InviteManager({ companyId, companyName }: InviteManagerProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [maxUses, setMaxUses] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [maxUsesInput, setMaxUsesInput] = useState("1");
  const [expiresInput, setExpiresInput] = useState("7");

  // Fetch invitations
  const fetchInvitations = async () => {
    try {
      const response = await fetch(`/api/invitations?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [companyId]);

  // Create new invitation
  const createInvitation = async () => {
    setCreating(true);
    
    // Parse the input values
    const maxUsesValue = parseInt(maxUsesInput) || 1;
    const expiresValue = parseInt(expiresInput) || 7;
    
    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId,
          companyName,
          maxUses: maxUsesValue,
          expiresInDays: expiresValue,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setInvitations([data.invitation, ...invitations]);
        // Reset form
        setMaxUsesInput("1");
        setExpiresInput("7");
        setMaxUses(1);
        setExpiresInDays(7);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create invitation");
      }
    } catch (error) {
      console.error("Error creating invitation:", error);
      alert("Failed to create invitation");
    } finally {
      setCreating(false);
    }
  };

  // Delete invitation
  const deleteInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setInvitations(invitations.filter(inv => inv.id !== invitationId));
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete invitation");
      }
    } catch (error) {
      console.error("Error deleting invitation:", error);
      alert("Failed to delete invitation");
    }
  };

  // Copy invite link to clipboard
  const copyInviteLink = (inviteCode: string) => {
    const inviteLink = `${window.location.origin}/join?code=${inviteCode}`;
    navigator.clipboard.writeText(inviteLink);
    alert("Invite link copied to clipboard!");
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if invitation is expired
  const isExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading invitations...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Invitations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create New Invitation */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Create New Invitation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="maxUses">Max Uses</Label>
              <Input
                id="maxUses"
                type="number"
                min="1"
                max="100"
                value={maxUsesInput}
                onChange={(e) => setMaxUsesInput(e.target.value)}
                onBlur={(e) => {
                  const value = parseInt(e.target.value);
                  if (isNaN(value) || value < 1) {
                    setMaxUsesInput("1");
                    setMaxUses(1);
                  } else if (value > 100) {
                    setMaxUsesInput("100");
                    setMaxUses(100);
                  } else {
                    setMaxUses(value);
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor="expiresInDays">Expires In (Days)</Label>
              <Input
                id="expiresInDays"
                type="number"
                min="1"
                max="30"
                value={expiresInput}
                onChange={(e) => setExpiresInput(e.target.value)}
                onBlur={(e) => {
                  const value = parseInt(e.target.value);
                  if (isNaN(value) || value < 1) {
                    setExpiresInput("7");
                    setExpiresInDays(7);
                  } else if (value > 30) {
                    setExpiresInput("30");
                    setExpiresInDays(30);
                  } else {
                    setExpiresInDays(value);
                  }
                }}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={createInvitation} 
                disabled={creating}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {creating ? "Creating..." : "Create Invitation"}
              </Button>
            </div>
          </div>
        </div>

        {/* Existing Invitations */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Invitations</h3>
          {invitations.length === 0 ? (
            <p className="text-muted-foreground">No invitations created yet.</p>
          ) : (
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <Card key={invitation.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {invitation.invite_code}
                        </code>
                        {invitation.is_active ? (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Active
                          </span>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            Inactive
                          </span>
                        )}
                        {isExpired(invitation.expires_at) && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            Expired
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {invitation.used_count}/{invitation.max_uses} used
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expires: {formatDate(invitation.expires_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyInviteLink(invitation.invite_code)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy Link
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this invitation? This action cannot be undone.
                              The invite code "{invitation.invite_code}" will no longer work.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteInvitation(invitation.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
