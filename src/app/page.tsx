"use client";

import Image from "next/image";
import { useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Redirect logged-in users to appropriate dashboard
  useEffect(() => {
    if (isLoaded && user) {
      router.push("/dashboard");
    }
  }, [user, isLoaded, router]);

  // Show loading while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Don't render if user is logged in (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">FeedMe</CardTitle>
          <p className="text-muted-foreground">Streamline your team's food ordering</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link href="/custom-signup">Sign Up</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button 
              onClick={() => signOut()} 
              variant="destructive"
            >
              Sign Out
            </Button>
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href="/manager-dashboard">Manager Dashboard</Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/employee-dashboard">Employee Dashboard</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
