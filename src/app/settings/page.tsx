"use client";

import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Building2, User, MapPin, Bell, Shield, Users } from "lucide-react";
import { Company } from "@/lib/menuTypes";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { signOut, user: clerkClient } = useClerk();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [userRole, setUserRole] = useState<string>("employee");
  const [companyForm, setCompanyForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "US",
    logo_url: ""
  });
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: ""
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // First, get the actual user role from the database
        const roleResponse = await fetch('/api/check-user-role');
        if (roleResponse.ok) {
          const roleData = await roleResponse.json();
          setUserRole(roleData.actualRole || "employee");
        } else {
          setUserRole("employee"); // Default to employee if can't fetch role
        }

        // Then fetch company data
        const response = await fetch('/api/companies');
        if (response.ok) {
          const companyData = await response.json();
          setCompany(companyData);
          if (companyData) {
            setCompanyForm({
              name: companyData.name || "",
              address: companyData.address || "",
              city: companyData.city || "",
              state: companyData.state || "",
              zip_code: companyData.zip_code || "",
              country: companyData.country || "US",
              logo_url: companyData.logo_url || ""
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserRole("employee"); // Default to employee on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Initialize profile form with user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.unsafeMetadata?.firstName as string || user.firstName || "",
        lastName: user.unsafeMetadata?.lastName as string || user.lastName || ""
      });
    }
  }, [user]);

  const handleCompanyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const method = company ? 'PUT' : 'POST';
      const body = company 
        ? { id: company.id, ...companyForm }
        : companyForm;

      const response = await fetch('/api/companies', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const updatedCompany = await response.json();
        setCompany(updatedCompany);
        // Don't change userRole here - keep the actual role from database
        alert(company ? 'Company settings updated successfully!' : 'Company created successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating company:', error);
      alert('Failed to update company settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCompanyForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileInputChange = (field: string, value: string) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setIsSavingProfile(true);
    try {
      // Use unsafeMetadata to store custom user data
      await user.update({
        unsafeMetadata: {
          firstName: profileForm.firstName,
          lastName: profileForm.lastName
        }
      });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLeaveCompany = async () => {
    if (!confirm('Are you sure you want to leave this company? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/leave-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setCompany(null);
        setCompanyForm({
          name: "",
          address: "",
          city: "",
          state: "",
          zip_code: "",
          country: "US",
          logo_url: ""
        });
        alert('You have successfully left the company.');
        // Refresh the page to update the UI
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error leaving company:', error);
      alert('Failed to leave company');
    }
  };

  // Show loading while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-16">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Settings</h1>
            <p className="text-gray-600 mb-8">Please sign in to access your settings.</p>
            <a 
              href="/sign-in" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Settings className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-gray-600">
            Manage your account and {userRole === "admin" ? "company" : "personal"} preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-teal-50 text-teal-700">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">Profile</span>
                </div>
                {userRole === "admin" && (
                  <>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-teal-50 text-teal-700">
                      <Building2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Company</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg text-gray-600">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">Team Management</span>
                    </div>
                  </>
                )}
                <div className="flex items-center gap-2 p-2 rounded-lg text-gray-600">
                  <Bell className="h-4 w-4" />
                  <span className="text-sm">Notifications</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Settings Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileForm.firstName}
                      onChange={(e) => handleProfileInputChange('firstName', e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileForm.lastName}
                      onChange={(e) => handleProfileInputChange('lastName', e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.emailAddresses[0]?.emailAddress || ""}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {userRole === "admin" ? "Admin" : "Employee"}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleProfileUpdate}
                      disabled={isSavingProfile}
                    >
                      {isSavingProfile ? "Saving..." : "Save Profile"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => signOut()}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Settings (Admin Only) */}
            {(userRole === "admin" || !company) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {company ? "Company Settings" : "Create Company"}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {company 
                      ? "Update your company information. The delivery address will be used to autofill delivery forms."
                      : "Create your company profile to enable team features and delivery address autofill."
                    }
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCompanyUpdate} className="space-y-4">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={companyForm.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter company name"
                        required
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Delivery Address
                      </h4>
                      <p className="text-sm text-gray-600">
                        This address will be used to autofill delivery forms for your team.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Label htmlFor="address">Street Address</Label>
                          <Input
                            id="address"
                            value={companyForm.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            placeholder="123 Business Park Dr"
                          />
                        </div>
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={companyForm.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            placeholder="San Francisco"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={companyForm.state}
                            onChange={(e) => handleInputChange('state', e.target.value)}
                            placeholder="CA"
                            maxLength={2}
                          />
                        </div>
                        <div>
                          <Label htmlFor="zip">ZIP Code</Label>
                          <Input
                            id="zip"
                            value={companyForm.zip_code}
                            onChange={(e) => handleInputChange('zip_code', e.target.value)}
                            placeholder="94105"
                          />
                        </div>
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            value={companyForm.country}
                            onChange={(e) => handleInputChange('country', e.target.value)}
                            placeholder="US"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
                      <Input
                        id="logoUrl"
                        value={companyForm.logo_url}
                        onChange={(e) => handleInputChange('logo_url', e.target.value)}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>

                    <Button type="submit" disabled={isSaving} className="w-full">
                      {isSaving 
                        ? "Saving..." 
                        : company 
                          ? "Save Company Settings" 
                          : "Create Company"
                      }
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Employee Settings */}
            {userRole === "employee" && (
              <>
                {/* Company Information (Read-only for employees) */}
                {company && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Company Information
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Your company details. Contact your admin to make changes.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          value={company.name || ""}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Delivery Address
                        </h4>
                        <p className="text-sm text-gray-600">
                          This address is used to autofill delivery forms.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <Label htmlFor="address">Street Address</Label>
                            <Input
                              id="address"
                              value={company.address || ""}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                          <div>
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={company.city || ""}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                          <div>
                            <Label htmlFor="state">State</Label>
                            <Input
                              id="state"
                              value={company.state || ""}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                          <div>
                            <Label htmlFor="zip">ZIP Code</Label>
                            <Input
                              id="zip"
                              value={company.zip_code || ""}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                          <div>
                            <Label htmlFor="country">Country</Label>
                            <Input
                              id="country"
                              value={company.country || ""}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                        </div>
                      </div>

                      {company.logo_url && (
                        <div>
                          <Label htmlFor="logoUrl">Logo URL</Label>
                          <Input
                            id="logoUrl"
                            value={company.logo_url}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                      )}

                      <div className="pt-4 border-t">
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={handleLeaveCompany}
                          className="w-full"
                        >
                          Leave Company
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Personal Preferences */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-8 text-gray-500">
                      <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>You can edit your profile information above.</p>
                      <p className="text-sm">Company information is managed by your admin.</p>
                      {!company && (
                        <p className="text-sm mt-2">Ask your admin to invite you to a company.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Notifications Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Notification settings coming soon!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
