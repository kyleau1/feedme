"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, User, ArrowRight, ArrowLeft } from "lucide-react";
import { SignUp } from "@clerk/nextjs";

type UserType = "company" | "employee" | null;

export default function CustomSignUpPage() {
  const [userType, setUserType] = useState<UserType>(null);
  const [companyName, setCompanyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [step, setStep] = useState<"type" | "details" | "signup">("type");
  const router = useRouter();

  const handleTypeSelection = (type: UserType) => {
    setUserType(type);
    setStep("details");
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("signup");
  };

  const handleBack = () => {
    if (step === "details") {
      setStep("type");
    } else if (step === "signup") {
      setStep("details");
    }
  };

  const getRedirectUrl = () => {
    if (userType === "company") {
      return "/manager-dashboard";
    } else {
      return "/employee-dashboard";
    }
  };

  if (step === "type") {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Join FeedMe</CardTitle>
            <p className="text-muted-foreground">
              Choose how you'd like to get started
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Registration */}
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-300"
                onClick={() => handleTypeSelection("company")}
              >
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Building2 className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">I'm a Company</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Create a company account to manage team food orders
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-green-600" />
                      Select daily restaurants
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-green-600" />
                      Manage team orders
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-green-600" />
                      Invite employees
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-green-600" />
                      Track order history
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Employee Registration */}
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-300"
                onClick={() => handleTypeSelection("employee")}
              >
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <User className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">I'm an Employee</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Join your company to place food orders
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-green-600" />
                      View today's restaurant
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-green-600" />
                      Place food orders
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-green-600" />
                      Track your orders
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-green-600" />
                      Join with invite code
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm"
                  onClick={() => router.push("/sign-in")}
                >
                  Sign in
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "details") {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-xl">
                {userType === "company" ? "Company Details" : "Join Your Company"}
              </CardTitle>
            </div>
            <p className="text-muted-foreground">
              {userType === "company" 
                ? "Tell us about your company" 
                : "Enter your company invitation code"
              }
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              {userType === "company" ? (
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Enter your company name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
              ) : (
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Get this from your company manager
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full">
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "signup") {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {userType === "company" ? "Create Company Account" : "Create Employee Account"}
              </h2>
            </div>
            <p className="text-muted-foreground text-sm">
              {userType === "company" 
                ? `Setting up account for ${companyName}` 
                : "Complete your registration"
              }
            </p>
          </div>
          
          <SignUp 
            path="/custom-signup" 
            routing="path"
            appearance={{
              elements: {
                formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
                card: "shadow-lg",
                formFieldInput: "mb-2",
                formFieldLabel: "mb-2",
              },
            }}
            signInUrl="/sign-in"
            afterSignUpUrl={getRedirectUrl()}
            forceRedirectUrl={getRedirectUrl()}
          />
        </div>
      </div>
    );
  }

  return null;
}