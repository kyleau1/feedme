"use client";

import Image from "next/image";
import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const { signOut } = useClerk();

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
              <Link href="/sign-up">Sign Up</Link>
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
          
        </CardContent>
      </Card>
    </div>
  );
}
