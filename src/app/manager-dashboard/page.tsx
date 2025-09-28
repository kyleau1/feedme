"use client";

import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Users, Calendar, Plus, Trash2, ExternalLink, Settings, LogOut, MessageSquare, ChevronDown, Wrench, Bell } from "lucide-react";
import Link from "next/link";
import PresetOrderNotifications from "@/components/PresetOrderNotifications";

interface OrderSession {
  id: string;
  restaurant_name: string;
  restaurant_options: string[];
  start_time: string;
  end_time: string;
  status: 'upcoming' | 'active' | 'closed' | 'completed';
  doordash_group_link?: string;
  participants: {
    user_id: string;
    user_name: string;
    status: 'pending' | 'ordered' | 'passed' | 'preset';
    preset_order?: string;
  }[];
  created_at: string;
}

export default function ManagerDashboard() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderSessions, setOrderSessions] = useState<OrderSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingSession, setEditingSession] = useState<OrderSession | null>(null);
  const [newSession, setNewSession] = useState({
    restaurant_name: '',
    restaurant_options: [''],
    start_time: '',
    end_time: '',
    doordash_group_link: ''
  });
  const [editSession, setEditSession] = useState({
    start_time: '',
    end_time: ''
  });
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [activeTab, setActiveTab] = useState<'sessions' | 'preset-orders'>('sessions');
  const [notificationCount, setNotificationCount] = useState(0);
  const [showDebugTools, setShowDebugTools] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/");
    }
  }, [user, isLoaded, router]);

  // Set active tab based on URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'preset-orders') {
      setActiveTab('preset-orders');
    } else {
      setActiveTab('sessions');
    }
  }, [searchParams]);

  // Calculate notification count
  useEffect(() => {
    const calculateNotificationCount = () => {
      let totalNew = 0;
      orderSessions.forEach(session => {
        const notifications = JSON.parse(
          localStorage.getItem(`presetRequests_${session.id}`) || '[]'
        );
        const newCount = notifications.filter((n: any) => !n.is_read).length;
        totalNew += newCount;
      });
      setNotificationCount(totalNew);
    };

    calculateNotificationCount();
    // Recalculate every 5 seconds to catch new notifications
    const interval = setInterval(calculateNotificationCount, 5000);
    return () => clearInterval(interval);
  }, [orderSessions]);

  // Helper function to convert UTC time to local time for display
  const formatLocalTime = (utcTimeString: string) => {
    const date = new Date(utcTimeString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      full: date.toLocaleString()
    };
  };

  // Load order sessions function
  const loadOrderSessions = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/order-sessions');
      if (response.ok) {
        const sessions = await response.json();
        setOrderSessions(sessions);
      }
    } catch (error) {
      console.error('Error loading order sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load order sessions on mount
  useEffect(() => {
    loadOrderSessions();
  }, [user]);

  const createOrderSession = async () => {
    if (!user) return;

    try {
      // Validate times
      if (!newSession.start_time) {
        alert('Please select a start time for the session.');
        return;
      }
      
      if (!newSession.end_time) {
        alert('Please select an end time for the session.');
        return;
      }

      // Convert datetime-local strings to proper Date objects (handle timezone correctly)
      // Start time
      const [startDatePart, startTimePart] = newSession.start_time.split('T');
      const [startYear, startMonth, startDay] = startDatePart.split('-').map(Number);
      const [startHours, startMinutes] = startTimePart.split(':').map(Number);
      const startTime = new Date(startYear, startMonth - 1, startDay, startHours, startMinutes, 0);
      
      // End time
      const [endDatePart, endTimePart] = newSession.end_time.split('T');
      const [endYear, endMonth, endDay] = endDatePart.split('-').map(Number);
      const [endHours, endMinutes] = endTimePart.split(':').map(Number);
      const endTime = new Date(endYear, endMonth - 1, endDay, endHours, endMinutes, 0);
      
      // Validate that end time is after start time
      if (endTime <= startTime) {
        alert('End time must be after start time.');
        return;
      }

      console.log('Session times:', {
        start_time_input: newSession.start_time,
        start_time_parsed: startTime.toISOString(),
        start_time_local: startTime.toLocaleString(),
        end_time_input: newSession.end_time,
        end_time_parsed: endTime.toISOString(),
        end_time_local: endTime.toLocaleString()
      });

      const response = await fetch('/api/doordash/group-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSession.restaurant_name,
          restaurant_options: newSession.restaurant_options.filter(opt => opt.trim() !== ''),
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          expires_in_hours: 2
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Group order created successfully:', result);
        
        // Reload sessions to get the latest data with participants
        await loadOrderSessions();
        
        setShowCreateDialog(false);
        setNewSession({
          restaurant_name: '',
          restaurant_options: [''],
          start_time: '',
          end_time: '',
          doordash_group_link: ''
        });
        alert('Group order created successfully! Check the DoorDash group link in the session details.');
      } else {
        const error = await response.json();
        console.error('Error creating group order:', error);
        
        // Show detailed error information
        let errorMessage = 'Failed to create group order: ';
        if (error.error) {
          errorMessage += error.error;
        } else if (error.message) {
          errorMessage += error.message;
        } else {
          errorMessage += 'Unknown error';
        }
        
        if (error.details) {
          errorMessage += '\n\nDetails: ' + error.details;
        }
        
        if (error.suggestion) {
          errorMessage += '\n\nSuggestion: ' + error.suggestion;
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error creating order session:', error);
      alert('Failed to create group order. Please try again.');
    }
  };

  const createCompany = async () => {
    if (!companyName.trim()) {
      alert('Please enter a company name');
      return;
    }

    try {
      const response = await fetch('/api/create-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyName.trim()
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert('Company created successfully! You are now the admin. Please try creating a group order again.');
        setShowCreateCompany(false);
        setCompanyName('');
        // Reload the page to refresh user data
        window.location.reload();
      } else {
        const error = await response.json();
        alert('Failed to create company: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating company:', error);
      alert('Failed to create company. Please try again.');
    }
  };

  const fixRLS = async () => {
    try {
      const response = await fetch('/api/fix-rls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message + ' Now try creating a company.');
      } else {
        const error = await response.json();
        alert('Failed to fix RLS: ' + (error.error || 'Unknown error') + '. Please run the SQL script manually in Supabase.');
      }
    } catch (error) {
      console.error('Error fixing RLS:', error);
      alert('Failed to fix RLS. Please try again.');
    }
  };

  const fixOrderSessionsRLS = async () => {
    try {
      const response = await fetch('/api/disable-order-sessions-rls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message + ' After running this SQL, try creating a group order session.');
      } else {
        const error = await response.json();
        alert('Failed to fix order sessions RLS: ' + (error.error || 'Unknown error') + '. Please run the SQL script manually in Supabase.');
      }
    } catch (error) {
      console.error('Error fixing order sessions RLS:', error);
      alert('Failed to fix order sessions RLS. Please try again.');
    }
  };

  const fixCompanyAssociation = async () => {
    try {
      // The user has an orphaned company_id, so we need to create a new company
      // and update their association
      const response = await fetch('/api/create-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Company'
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message + ' You should now be able to create group orders.');
        // Reload the page to refresh user data
        window.location.reload();
      } else {
        const error = await response.json();
        if (error.error === 'User already has a valid company') {
          alert('You already have a valid company! Try creating a group order now.');
        } else {
          alert('Failed to fix company association: ' + (error.error || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Error fixing company association:', error);
      alert('Failed to fix company association. Please try again.');
    }
  };

  const deleteOrderSession = async (sessionId: string) => {
    try {
      console.log('Deleting session:', sessionId);
      const response = await fetch(`/api/order-sessions/${sessionId}`, {
        method: 'DELETE'
      });

      console.log('Delete response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Delete successful:', result);
        setOrderSessions(prev => prev.filter(session => session.id !== sessionId));
        alert('Session deleted successfully!');
      } else {
        const errorData = await response.json();
        console.error('Delete failed:', errorData);
        alert('Failed to delete session: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting order session:', error);
      alert('Error deleting session: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const testParticipantsRls = async () => {
    try {
      const response = await fetch('/api/disable-participants-rls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      if (response.ok) {
        alert('Participants RLS test passed: ' + result.message);
      } else {
        alert('Participants RLS test failed: ' + result.error + '\n\nSolution: ' + result.solution);
      }
    } catch (error) {
      console.error('Error testing RLS:', error);
      alert('Error testing RLS: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const fixParticipantsRlsPolicy = async () => {
    try {
      const response = await fetch('/api/fix-participants-rls-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      if (response.ok) {
        alert('Participants RLS policy fixed: ' + result.message);
      } else {
        alert('Failed to fix participants RLS policy: ' + result.error);
      }
    } catch (error) {
      console.error('Error fixing participants RLS policy:', error);
      alert('Error fixing participants RLS policy: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const disableParticipantsRlsDirect = async () => {
    try {
      const response = await fetch('/api/disable-participants-rls-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      if (response.ok) {
        alert('Participants RLS disabled: ' + result.message);
      } else {
        alert('Failed to disable participants RLS: ' + result.error + '\n\nSolution: ' + result.solution);
      }
    } catch (error) {
      console.error('Error disabling participants RLS:', error);
      alert('Error disabling participants RLS: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const testAdminClient = async () => {
    try {
      const response = await fetch('/api/test-admin-client', {
        method: 'POST',
      });
      const result = await response.json();
      if (response.ok) {
        alert('Admin client test successful: ' + result.message);
      } else {
        alert('Admin client test failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error testing admin client:', error);
      alert('Error testing admin client: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const forceDisableRls = async () => {
    try {
      const response = await fetch('/api/force-disable-rls', {
        method: 'POST',
      });
      const result = await response.json();
      if (response.ok) {
        alert('RLS Force Disable: ' + result.message + '\n\nSuccessful approaches: ' + result.successfulApproaches);
      } else {
        alert('RLS Force Disable failed: ' + (result.error || 'Unknown error') + '\n\nSolution: ' + result.solution);
      }
    } catch (error) {
      console.error('Error force disabling RLS:', error);
      alert('Error force disabling RLS: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const testErrorResponse = async () => {
    try {
      const response = await fetch('/api/test-error-response', {
        method: 'POST',
      });
      const result = await response.json();
      console.log('Test error response result:', result);
      alert('Test error response: ' + JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Error testing error response:', error);
      alert('Error testing error response: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const testSimpleError = async () => {
    try {
      const response = await fetch('/api/test-simple-error', {
        method: 'POST',
      });
      const result = await response.json();
      console.log('Test simple error result:', result);
      alert('Test simple error: ' + JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Error testing simple error:', error);
      alert('Error testing simple error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const debugParticipants = async () => {
    try {
      const response = await fetch('/api/debug-participants');
      const result = await response.json();
      console.log('Debug participants result:', result);
      alert('Debug participants: ' + JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Error debugging participants:', error);
      alert('Error debugging participants: ' + error);
    }
  };

  const fixSessionParticipants = async (sessionId: string) => {
    try {
      const response = await fetch('/api/fix-session-participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const result = await response.json();
      console.log('Fix session participants result:', result);
      
      if (response.ok) {
        alert(`Successfully added ${result.addedParticipants || 0} participants to the session!`);
        // Reload sessions instead of entire page
        loadOrderSessions();
      } else {
        alert('Failed to fix participants: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fixing session participants:', error);
      alert('Error fixing session participants: ' + error);
    }
  };

  const updateSessionStatus = async (sessionId: string, status: string) => {
    try {
      const response = await fetch(`/api/order-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setOrderSessions(prev => prev.map(session => 
          session.id === sessionId ? { ...session, status } : session
        ));
      }
    } catch (error) {
      console.error('Error updating session status:', error);
    }
  };

  const openEditDialog = (session: OrderSession) => {
    setEditingSession(session);
    // Convert UTC times to local datetime-local format
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    
    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const formatForInput = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    setEditSession({
      start_time: formatForInput(startTime),
      end_time: formatForInput(endTime)
    });
    setShowEditDialog(true);
  };

  const updateSessionTimes = async () => {
    if (!editingSession) return;

    try {
      // Convert local times back to UTC
      const startTimeUTC = new Date(editSession.start_time).toISOString();
      const endTimeUTC = new Date(editSession.end_time).toISOString();

      const response = await fetch(`/api/order-sessions/${editingSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          start_time: startTimeUTC,
          end_time: endTimeUTC
        })
      });

      if (response.ok) {
        await loadOrderSessions();
        setShowEditDialog(false);
        setEditingSession(null);
        alert('Session times updated successfully!');
      } else {
        const error = await response.json();
        alert(`Error updating session: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating session times:', error);
      alert('Error updating session times');
    }
  };

  const updateParticipantStatus = async (sessionId: string, userId: string, status: string) => {
    try {
      const response = await fetch('/api/order-sessions/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          session_id: sessionId, 
          user_id: userId, 
          response: status,
          preset_order: status === 'preset' ? 'Manager updated status' : null
        })
      });

      if (response.ok) {
        // Update the local state
        setOrderSessions(prev => prev.map(session => {
          if (session.id === sessionId) {
            return {
              ...session,
              participants: session.participants?.map(participant => 
                participant.user_id === userId 
                  ? { ...participant, status }
                  : participant
              ) || []
            };
          }
          return session;
        }));
      } else {
        console.error('Failed to update participant status');
      }
    } catch (error) {
      console.error('Error updating participant status:', error);
    }
  };

  const addRestaurantOption = () => {
    setNewSession(prev => ({
      ...prev,
      restaurant_options: [...prev.restaurant_options, '']
    }));
  };

  const updateRestaurantOption = (index: number, value: string) => {
    setNewSession(prev => ({
      ...prev,
      restaurant_options: prev.restaurant_options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const removeRestaurantOption = (index: number) => {
    setNewSession(prev => ({
      ...prev,
      restaurant_options: prev.restaurant_options.filter((_, i) => i !== index)
    }));
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-teal-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">FeedMe Manager</h1>
                <p className="text-sm text-gray-500">Order Session Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild variant="outline">
                <Link href="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button variant="outline" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Creation Section */}
        {showCreateCompany && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">Create Company</CardTitle>
              <p className="text-blue-700">You need to create a company to manage group orders.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter your company name"
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={createCompany} disabled={!companyName.trim()}>
                    Create Company
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateCompany(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('sessions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sessions'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Order Sessions
                </div>
              </button>
              <button
                onClick={() => setActiveTab('preset-orders')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'preset-orders'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Preset Orders
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'sessions' && (
          <>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Order Sessions</h2>
                <p className="text-gray-600">Manage group order sessions for your team</p>
              </div>
                  <div className="flex gap-2 items-center">
                    <Button variant="outline" onClick={() => setShowDebugTools(!showDebugTools)}>
                      <Wrench className="h-4 w-4 mr-2" />
                      Debug Tools
                      {showDebugTools ? <ChevronDown className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2 rotate-180" />}
                    </Button>
                    <Button variant="outline" onClick={fixCompanyAssociation}>
                      <Settings className="h-4 w-4 mr-2" />
                      Fix Company Association
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateCompany(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Company
                    </Button>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Session
                    </Button>
                  </div>
        </div>

        {/* Debug Tools Section */}
        {showDebugTools && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-lg text-orange-800">Debug Tools</CardTitle>
              <CardDescription className="text-orange-600">
                Advanced debugging tools for troubleshooting RLS and database issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                <Button variant="outline" size="sm" onClick={fixRLS}>
                  <Settings className="h-4 w-4 mr-2" />
                  Fix RLS
                </Button>
                <Button variant="outline" size="sm" onClick={fixOrderSessionsRLS}>
                  <Settings className="h-4 w-4 mr-2" />
                  Fix Order Sessions RLS
                </Button>
                <Button variant="outline" size="sm" onClick={testParticipantsRls}>
                  <Settings className="h-4 w-4 mr-2" />
                  Test Participants RLS
                </Button>
                <Button variant="outline" size="sm" onClick={fixParticipantsRlsPolicy}>
                  <Settings className="h-4 w-4 mr-2" />
                  Fix Participants RLS Policy
                </Button>
                <Button variant="outline" size="sm" onClick={disableParticipantsRlsDirect}>
                  <Settings className="h-4 w-4 mr-2" />
                  Disable Participants RLS
                </Button>
                <Button variant="outline" size="sm" onClick={testAdminClient}>
                  <Settings className="h-4 w-4 mr-2" />
                  Test Admin Client
                </Button>
                <Button variant="outline" size="sm" onClick={forceDisableRls}>
                  <Settings className="h-4 w-4 mr-2" />
                  Force Disable RLS
                </Button>
                <Button variant="outline" size="sm" onClick={testErrorResponse}>
                  <Settings className="h-4 w-4 mr-2" />
                  Test Error Response
                </Button>
                <Button variant="outline" size="sm" onClick={testSimpleError}>
                  <Settings className="h-4 w-4 mr-2" />
                  Test Simple Error
                </Button>
                <Button variant="outline" size="sm" onClick={debugParticipants}>
                  <Users className="h-4 w-4 mr-2" />
                  Debug Participants
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  const sessionId = prompt('Enter the session ID to fix participants:');
                  if (sessionId) {
                    fixSessionParticipants(sessionId);
                  }
                }}>
                  <Users className="h-4 w-4 mr-2" />
                  Fix Session Participants
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  const sessionId = prompt('Enter the session ID to delete:');
                  if (sessionId) {
                    deleteOrderSession(sessionId);
                  }
                }}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Test Delete Session
                </Button>
                <Button variant="outline" size="sm" onClick={async () => {
                  const sessionId = prompt('Enter the session ID to test delete:');
                  if (sessionId) {
                    try {
                      const response = await fetch('/api/test-delete-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId })
                      });
                      const result = await response.json();
                      console.log('Test delete result:', result);
                      alert(JSON.stringify(result, null, 2));
                    } catch (error) {
                      console.error('Test delete error:', error);
                      alert('Error: ' + error);
                    }
                  }
                }}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Debug Delete
                </Button>
                <Button variant="outline" size="sm" onClick={async () => {
                  try {
                    const testData = {
                      name: 'Test Restaurant',
                      restaurant_options: ['Option 1', 'Option 2'],
                      start_time: new Date().toISOString(),
                      end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                      expires_in_hours: 2
                    };
                    console.log('Testing session creation with data:', testData);
                    
                    const response = await fetch('/api/doordash/group-orders', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(testData)
                    });
                    
                    const result = await response.json();
                    console.log('Test session creation result:', result);
                    alert(JSON.stringify(result, null, 2));
                  } catch (error) {
                    console.error('Test session creation error:', error);
                    alert('Error: ' + error);
                  }
                }}>
                  <Settings className="h-4 w-4 mr-2" />
                  Test Session Creation
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  console.log('Current order sessions:', orderSessions);
                  console.log('Current user:', user);
                  alert(`Current sessions: ${orderSessions.length}\nCheck console for details.`);
                }}>
                  <Settings className="h-4 w-4 mr-2" />
                  Debug Sessions
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  // Simulate a user response event
                  window.dispatchEvent(new CustomEvent('userResponse', { 
                    detail: { 
                      sessionId: 'test-session',
                      response: 'passed',
                      userName: 'Test User'
                    } 
                  }));
                  alert('Test notification event dispatched! Check console and notification bell.');
                }}>
                  <Bell className="h-4 w-4 mr-2" />
                  Test Notifications
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  const startTimeInput = "2025-09-27T18:15";
                  const endTimeInput = "2025-09-27T18:20";
                  
                  // Parse start time
                  const [startDatePart, startTimePart] = startTimeInput.split('T');
                  const [startYear, startMonth, startDay] = startDatePart.split('-').map(Number);
                  const [startHours, startMinutes] = startTimePart.split(':').map(Number);
                  const startTime = new Date(startYear, startMonth - 1, startDay, startHours, startMinutes, 0);
                  
                  // Parse end time
                  const [endDatePart, endTimePart] = endTimeInput.split('T');
                  const [endYear, endMonth, endDay] = endDatePart.split('-').map(Number);
                  const [endHours, endMinutes] = endTimePart.split(':').map(Number);
                  const endTime = new Date(endYear, endMonth - 1, endDay, endHours, endMinutes, 0);
                  
                  console.log('Time conversion test:', {
                    start_input: startTimeInput,
                    start_parsed: startTime.toISOString(),
                    start_local: startTime.toLocaleString(),
                    end_input: endTimeInput,
                    end_parsed: endTime.toISOString(),
                    end_local: endTime.toLocaleString()
                  });
                  
                  alert(`Time Test:\nStart: ${startTimeInput} → ${startTime.toLocaleString()}\nEnd: ${endTimeInput} → ${endTime.toLocaleString()}`);
                }}>
                  <Clock className="h-4 w-4 mr-2" />
                  Test Time
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading order sessions...</p>
          </div>
        ) : orderSessions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Order Sessions</h3>
              <p className="text-gray-600 mb-4">Create your first order session to get started.</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Active Sessions */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Active Sessions</h3>
              <div className="grid gap-6">
                {orderSessions.filter((session) => {
                  const now = new Date();
                  const startTime = new Date(session.start_time);
                  const endTime = new Date(session.end_time);
                  const isActive = now >= startTime && now <= endTime;
                  const isUpcoming = now < startTime;
                  return isActive || isUpcoming;
                }).map((session) => {
              const now = new Date();
              const startTime = new Date(session.start_time);
              const endTime = new Date(session.end_time);
              const isActive = now >= startTime && now <= endTime;
              const isUpcoming = now < startTime;
              const isClosed = now > endTime;
              
              // Format times for display
              const startTimeFormatted = formatLocalTime(session.start_time);
              const endTimeFormatted = formatLocalTime(session.end_time);

              return (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          isActive ? 'bg-green-500' : isUpcoming ? 'bg-blue-500' : 'bg-gray-400'
                        }`} />
                        <div>
                          <CardTitle className="text-lg">{session.restaurant_name}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {startTimeFormatted.date}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {startTimeFormatted.time} - {endTimeFormatted.time}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {session.participants?.length || 0} participants
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <span className="font-mono">ID: {session.id}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isActive ? 'bg-green-100 text-green-800' :
                          isUpcoming ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {isActive ? 'Active' : isUpcoming ? 'Upcoming' : 'Closed'}
                        </span>
                        <Button
                          onClick={() => openEditDialog(session)}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Edit Times
                        </Button>
                        <Button
                          onClick={() => fixSessionParticipants(session.id)}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          <Users className="h-3 w-3 mr-1" />
                          Fix Participants
                        </Button>
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(session.id);
                            alert('Session ID copied to clipboard!');
                          }}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          <span className="text-xs">📋</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Order Session</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this order session? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteOrderSession(session.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Restaurant Options */}
                      <div>
                        <h4 className="font-semibold mb-2">Available Restaurants:</h4>
                        <div className="flex flex-wrap gap-2">
                          {session.restaurant_options.map((restaurant, index) => (
                            <span key={index} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                              {restaurant}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* DoorDash Link */}
                      {session.doordash_group_link && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-blue-900">DoorDash Group Order</h4>
                              <p className="text-sm text-blue-700">Group order link is ready</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => window.open(session.doordash_group_link, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open Link
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Participant Status */}
                      <div className="mt-4">
                        <h4 className="font-semibold mb-3 text-gray-900">Team Member Status:</h4>
                        <div className="space-y-3">
                          {session.participants && session.participants.length > 0 ? (
                            session.participants.map((participant, index) => (
                              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-600">
                                      {(participant.user_name || 'U').charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-gray-900">
                                      {participant.user_name || 'Unknown User'}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={participant.status || 'pending'}
                                    onValueChange={(value) => updateParticipantStatus(session.id, participant.user_id, value)}
                                  >
                                    <SelectTrigger className="w-32 h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                          Pending
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="ordered">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                          Ordering
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="passed">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                          Passed
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="preset">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                          Preset
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <div className="text-sm text-gray-500 italic">
                                No team members in this session
                              </div>
                            </div>
                          )}
                        </div>
                      </div>


                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t">
                        {isUpcoming && (
                          <Button
                            onClick={() => updateSessionStatus(session.id, 'active')}
                            size="sm"
                          >
                            Start Session
                          </Button>
                        )}
                        {isActive && (
                          <Button
                            onClick={() => updateSessionStatus(session.id, 'closed')}
                            variant="outline"
                            size="sm"
                          >
                            End Session
                          </Button>
                        )}
                        <Button
                          onClick={() => fixSessionParticipants(session.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Fix Participants
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
              </div>
            </div>

            {/* Previous Sessions */}
            {orderSessions.filter((session) => {
              const now = new Date();
              const endTime = new Date(session.end_time);
              return now > endTime || session.status === 'closed';
            }).length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Previous Sessions</h3>
                <div className="grid gap-6">
                  {orderSessions.filter((session) => {
                    const now = new Date();
                    const endTime = new Date(session.end_time);
                    return now > endTime || session.status === 'closed';
                  }).map((session) => {
                    const now = new Date();
                    const startTime = new Date(session.start_time);
                    const endTime = new Date(session.end_time);
                    const isActive = now >= startTime && now <= endTime;
                    const isUpcoming = now < startTime;
                    const isClosed = now > endTime;
                    
                    // Format times for display
                    const startTimeFormatted = formatLocalTime(session.start_time);
                    const endTimeFormatted = formatLocalTime(session.end_time);

                    return (
                      <Card key={session.id} className="opacity-75">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                isActive ? 'bg-green-500' : isUpcoming ? 'bg-blue-500' : 'bg-gray-400'
                              }`} />
                              <div>
                                <CardTitle className="text-lg">{session.restaurant_name}</CardTitle>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {startTimeFormatted.date}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {startTimeFormatted.time} - {endTimeFormatted.time}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {session.participants?.length || 0} participants
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <span className="font-mono">ID: {session.id}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                isActive ? 'bg-green-100 text-green-800' :
                                isUpcoming ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {isActive ? 'Active' : isUpcoming ? 'Upcoming' : 'Completed'}
                              </span>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Order Session</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this order session? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteOrderSession(session.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Restaurant Options */}
                            <div>
                              <h4 className="font-semibold mb-2">Available Restaurants:</h4>
                              <div className="flex flex-wrap gap-2">
                                {session.restaurant_options.map((restaurant, index) => (
                                  <span key={index} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                                    {restaurant}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* DoorDash Link */}
                            {session.doordash_group_link && (
                              <div className="p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-semibold text-blue-900">DoorDash Group Order</h4>
                                    <p className="text-sm text-blue-700">Group order link was available</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => window.open(session.doordash_group_link, '_blank')}
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View Link
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Participant Status Summary */}
                            <div className="mt-4">
                              <h4 className="font-semibold mb-3 text-gray-900">Final Results:</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-3 bg-green-50 rounded-lg">
                                  <div className="text-2xl font-bold text-green-600">
                                    {session.participants?.filter(p => p.status === 'ordered').length || 0}
                                  </div>
                                  <div className="text-sm text-green-700">Ordered</div>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                  <div className="text-2xl font-bold text-gray-600">
                                    {session.participants?.filter(p => p.status === 'passed').length || 0}
                                  </div>
                                  <div className="text-sm text-gray-700">Passed</div>
                                </div>
                                <div className="text-center p-3 bg-blue-50 rounded-lg">
                                  <div className="text-2xl font-bold text-blue-600">
                                    {session.participants?.filter(p => p.status === 'preset').length || 0}
                                  </div>
                                  <div className="text-sm text-blue-700">Preset</div>
                                </div>
                                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                  <div className="text-2xl font-bold text-yellow-600">
                                    {session.participants?.filter(p => p.status === 'pending').length || 0}
                                  </div>
                                  <div className="text-sm text-yellow-700">Pending</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create Session Dialog */}
        {showCreateDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Create Order Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="restaurant_name">Session Name</Label>
                  <Input
                    id="restaurant_name"
                    value={newSession.restaurant_name}
                    onChange={(e) => setNewSession(prev => ({ ...prev, restaurant_name: e.target.value }))}
                    placeholder="e.g., Lunch Order Session"
                  />
                </div>

                <div>
                  <Label>Restaurant Options</Label>
                  <div className="space-y-2">
                    {newSession.restaurant_options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateRestaurantOption(index, e.target.value)}
                          placeholder="Restaurant name"
                        />
                        {newSession.restaurant_options.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeRestaurantOption(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addRestaurantOption}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Restaurant
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={newSession.start_time}
                      onChange={(e) => setNewSession(prev => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={newSession.end_time}
                      onChange={(e) => setNewSession(prev => ({ ...prev, end_time: e.target.value }))}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      When should the order session close? (e.g., 6:20 PM for a 5-minute window)
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="doordash_link">DoorDash Group Link (Optional)</Label>
                  <Input
                    id="doordash_link"
                    value={newSession.doordash_group_link}
                    onChange={(e) => setNewSession(prev => ({ ...prev, doordash_group_link: e.target.value }))}
                    placeholder="https://doordash.com/group/..."
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={createOrderSession} className="flex-1">
                    Create Session
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Session Dialog */}
        {showEditDialog && editingSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Edit Session Times</CardTitle>
                <p className="text-sm text-gray-600">Update the start and end times for {editingSession.restaurant_name}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_start_time">Start Time</Label>
                    <Input
                      id="edit_start_time"
                      type="datetime-local"
                      value={editSession.start_time}
                      onChange={(e) => setEditSession(prev => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_end_time">End Time</Label>
                    <Input
                      id="edit_end_time"
                      type="datetime-local"
                      value={editSession.end_time}
                      onChange={(e) => setEditSession(prev => ({ ...prev, end_time: e.target.value }))}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      When should the order session close?
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={updateSessionTimes} className="flex-1">
                    Update Times
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditDialog(false);
                      setEditingSession(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
          </>
        )}

        {/* Preset Orders Tab */}
        {activeTab === 'preset-orders' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Preset Orders</h2>
              <p className="text-gray-600">View and manage preset order requests from team members</p>
            </div>
            
            {/* All Preset Orders from All Sessions */}
            <div className="space-y-4">
              {orderSessions.map((session) => (
                <Card key={session.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      {session.restaurant_name} - {new Date(session.start_time).toLocaleDateString()}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {new Date(session.start_time).toLocaleTimeString()} - {new Date(session.end_time).toLocaleTimeString()}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <PresetOrderNotifications
                      sessionId={session.id}
                      onAcknowledge={(requestId) => {
                        console.log('Acknowledged request:', requestId);
                      }}
                      onMarkComplete={(requestId) => {
                        console.log('Marked complete:', requestId);
                      }}
                      onDelete={(requestId) => {
                        console.log('Deleted request:', requestId);
                      }}
                    />
                  </CardContent>
                </Card>
              ))}
              
              {orderSessions.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Order Sessions</h3>
                    <p className="text-gray-600">
                      Create an order session to start receiving preset order requests from team members.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}