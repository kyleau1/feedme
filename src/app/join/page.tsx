"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Users, AlertCircle } from "lucide-react";

export default function JoinPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  // Get invite code from URL params and auto-join if user is logged in
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      setInviteCode(code);
      
      // If user is already logged in, automatically join the company
      if (user && isLoaded) {
        handleJoinCompany({ preventDefault: () => {} } as React.FormEvent);
      }
    }
  }, [searchParams, user, isLoaded]);

  // Redirect if not logged in
  useEffect(() => {
    if (isLoaded && !user) {
      const currentUrl = window.location.href;
      router.push("/sign-in?redirect_url=" + encodeURIComponent(currentUrl));
    }
  }, [user, isLoaded, router]);

  const handleJoinCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setMessage(data.message);
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/employee-dashboard");
        }, 2000);
      } else {
        setMessage(data.error || "Failed to join company");
      }
    } catch (error) {
      console.error("Error joining company:", error);
      setMessage("Failed to join company. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Users className="h-6 w-6" />
            Join Company
          </CardTitle>
          <p className="text-muted-foreground">
            {inviteCode ? 
              "You've been invited to join a company!" : 
              "Enter your invitation code to join a company"
            }
          </p>
        </CardHeader>
        <CardContent>
          {inviteCode ? (
            // Show auto-join flow
            <div className="space-y-4">
              <div className="text-center">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Invitation Code: <span className="font-mono font-bold">{inviteCode}</span>
                  </p>
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-md flex items-center gap-2 ${
                  success 
                    ? "bg-green-50 text-green-800 border border-green-200" 
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}>
                  {success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span className="text-sm">{message}</span>
                </div>
              )}

              {!success && (
                <Button 
                  onClick={handleJoinCompany}
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? "Joining..." : "Join Company"}
                </Button>
              )}

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-sm"
                    onClick={() => router.push("/")}
                  >
                    Go back to home
                  </Button>
                </p>
              </div>
            </div>
          ) : (
            // Show manual code entry
            <form onSubmit={handleJoinCompany} className="space-y-4">
              <div>
                <Label htmlFor="inviteCode">Invitation Code</Label>
                <Input
                  id="inviteCode"
                  type="text"
                  placeholder="Enter invitation code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              {message && (
                <div className={`p-3 rounded-md flex items-center gap-2 ${
                  success 
                    ? "bg-green-50 text-green-800 border border-green-200" 
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}>
                  {success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span className="text-sm">{message}</span>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !inviteCode.trim()}
              >
                {loading ? "Joining..." : "Join Company"}
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an invitation code?{" "}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-sm"
                    onClick={() => router.push("/")}
                  >
                    Go back to home
                  </Button>
                </p>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
