"use client";

import Image from "next/image";
import { useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users } from "lucide-react";

export default function Home() {
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);

  // Check user role and company data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setIsLoadingUserData(false);
        return;
      }

      try {
        // Get user role
        const roleResponse = await fetch('/api/check-user-role');
        if (roleResponse.ok) {
          const roleData = await roleResponse.json();
          setUserRole(roleData.actualRole || "employee");
        }

        // Get company data
        const companyResponse = await fetch('/api/companies');
        if (companyResponse.ok) {
          const companyData = await companyResponse.json();
          setCompanyData(companyData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoadingUserData(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Redirect logged-in users to appropriate dashboard
  useEffect(() => {
    if (isLoaded && user && !isLoadingUserData) {
      // If user is an employee without a company, show the join company message
      if (userRole === "employee" && !companyData) {
        return; // Don't redirect, show the join company message
      }
      router.push("/dashboard");
    }
  }, [user, isLoaded, router, userRole, companyData, isLoadingUserData]);

  // Show loading while checking authentication
  if (!isLoaded || isLoadingUserData) {
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

  // Show join company message for employees without a company
  if (user && userRole === "employee" && !companyData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <Building2 className="h-6 w-6" />
              Join a Company
            </CardTitle>
            <p className="text-muted-foreground">You need to be part of a company to use FeedMe</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Ask your company administrator to invite you, or create a new company if you're an admin.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button asChild>
                <Link href="/settings">
                  <Users className="h-4 w-4 mr-2" />
                  Go to Settings
                </Link>
              </Button>
              <Button variant="outline" onClick={() => signOut()}>
                Sign Out
              </Button>
            </div>
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
