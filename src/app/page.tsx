"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) {
      router.push("/dashboard");
    }
  }, [isLoaded, user, router]);

  // Render marketing landing when logged out
  return (
    <main className="min-h-screen">
      {/* Hero section - replace with your lovable.dev markup */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Team food ordering made effortless
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Automate picks, collect orders, and keep everyone fed and happy.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-4">
              <Button asChild>
                <Link href="/sign-up">Get started</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Additional sections from lovable.dev can be pasted below */}
    </main>
  );
}
