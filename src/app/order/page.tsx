"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import DoorDashGroupOrder from "@/components/DoorDashGroupOrder";

interface OrderSession {
  id: string;
  restaurant_name: string;
  restaurant_options: string[];
  start_time: string;
  end_time: string;
  status: 'upcoming' | 'active' | 'closed' | 'completed';
  participants: {
    user_id: string;
    user_name: string;
    status: 'pending' | 'ordered' | 'passed' | 'preset';
    preset_order?: string;
  }[];
  doordash_group_link?: string;
}

export default function OrderPage() {
  const { user } = useUser();
  const router = useRouter();
  const [companyData, setCompanyData] = useState<any>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [orderSessions, setOrderSessions] = useState<OrderSession[]>([]);
  const [currentSession, setCurrentSession] = useState<OrderSession | null>(null);
  const [userResponse, setUserResponse] = useState<'pending' | 'ordered' | 'passed' | 'preset'>('pending');
  const [presetOrder, setPresetOrder] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // Check if user is part of a company
  useEffect(() => {
    const checkCompanyMembership = async () => {
      if (!user) {
        setIsLoadingCompany(false);
        return;
      }

      try {
        const response = await fetch('/api/companies');
        if (response.ok) {
          const companyData = await response.json();
          setCompanyData(companyData);
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
      } finally {
        setIsLoadingCompany(false);
      }
    };

    checkCompanyMembership();
  }, [user]);

  // Load all order sessions
  const loadOrderSessions = async () => {
    if (!user || !companyData) return;

    try {
      const response = await fetch('/api/doordash/group-orders');
      if (response.ok) {
        const sessions = await response.json();
        setOrderSessions(sessions);
        
        // Get the most recent active session
        const activeSession = sessions.find((s: any) => s.status === 'active');
        setCurrentSession(activeSession || null);
        
        // Check user's response status
        if (activeSession) {
          const userParticipant = activeSession.participants?.find((p: any) => p.user_id === user.id);
          if (userParticipant) {
            setUserResponse(userParticipant.status);
            setPresetOrder(userParticipant.preset_order || '');
          }
        }
      }
    } catch (error) {
      console.error('Error loading order sessions:', error);
    }
  };

  // Load order sessions
  useEffect(() => {
    loadOrderSessions();
  }, [user, companyData]);

  const handleUserResponse = async (response: 'ordered' | 'passed' | 'preset') => {
    if (!user || !currentSession) return;

    setIsSubmitting(true);
    setSubmitMessage('');

    // For preset responses, just set the state to show the message interface
    if (response === 'preset') {
      setUserResponse(response);
      setIsSubmitting(false);
      return;
    }

    try {
      const responseData = await fetch('/api/order-sessions/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSession.id,
          user_id: user.id,
          response: response,
          preset_order: response === 'preset' ? presetOrder : undefined
        })
      });

      if (responseData.ok) {
        setUserResponse(response);
        setSubmitMessage(`✅ Successfully ${response === 'ordered' ? 'ordered' : 'passed'}!`);
        
        // Reload session to get updated data
        const sessionsResponse = await fetch('/api/doordash/group-orders');
        if (sessionsResponse.ok) {
          const sessions = await sessionsResponse.json();
          const activeSession = sessions.find((s: any) => s.status === 'active');
          setCurrentSession(activeSession || null);
        }
        
        // Trigger notification refresh for managers
        console.log('Dispatching userResponse event:', {
          sessionId: currentSession?.id,
          response: response,
          userName: user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'Unknown User'
        });
        console.log('Full user object:', user);
        window.dispatchEvent(new CustomEvent('userResponse', { 
          detail: { 
            sessionId: currentSession?.id,
            response: response,
            userName: user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'Unknown User'
          } 
        }));
      } else {
        let errorMessage = 'Unknown error';
        console.log('Response status:', responseData.status);
        console.log('Response headers:', responseData.headers);
        console.log('Response ok:', responseData.ok);
        console.log('Response type:', responseData.type);
        
        try {
          const errorData = await responseData.json();
          console.error('Failed to submit response - Raw error data:', errorData);
          console.error('Error data type:', typeof errorData);
          console.error('Error data keys:', Object.keys(errorData || {}));
          console.error('Error data values:', {
            error: errorData?.error,
            details: errorData?.details,
            code: errorData?.code,
            message: errorData?.message
          });
          console.error('Full error object:', JSON.stringify(errorData, null, 2));
          
          // Handle different error formats
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData && errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData && errorData.details) {
            errorMessage = errorData.details;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else {
            errorMessage = `HTTP ${responseData.status}: ${responseData.statusText}`;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          // Try to get text response instead
          try {
            const errorText = await responseData.text();
            console.error('Error response text:', errorText);
            errorMessage = `HTTP ${responseData.status}: ${errorText || responseData.statusText}`;
          } catch (textError) {
            console.error('Failed to get text response:', textError);
            errorMessage = `HTTP ${responseData.status}: ${responseData.statusText}`;
          }
        }
        setSubmitMessage(`❌ Failed to submit: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error updating user response:', error);
      setSubmitMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePresetMessage = async (message: string) => {
    if (!user || !currentSession) return;

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const responseData = await fetch('/api/order-sessions/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSession.id,
          user_id: user.id,
          response: 'preset',
          preset_order: message
        })
      });

      if (responseData.ok) {
        setUserResponse('preset');
        setSubmitMessage('✅ Preset message sent successfully!');
        
        // Reload session to get updated data
        const sessionsResponse = await fetch('/api/doordash/group-orders');
        if (sessionsResponse.ok) {
          const sessions = await sessionsResponse.json();
          const activeSession = sessions.find((s: any) => s.status === 'active');
          setCurrentSession(activeSession || null);
        }
        
        // Trigger notification refresh for managers
        window.dispatchEvent(new CustomEvent('userResponse', { 
          detail: { 
            sessionId: currentSession?.id,
            response: 'preset',
            userName: user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'Unknown User'
          } 
        }));
      } else {
        let errorMessage = 'Unknown error';
        console.log('Preset response status:', responseData.status);
        
        try {
          const errorData = await responseData.json();
          console.error('Failed to send preset message:', errorData);
          console.error('Preset error data type:', typeof errorData);
          console.error('Preset error data keys:', Object.keys(errorData || {}));
          console.error('Preset error data values:', {
            error: errorData?.error,
            details: errorData?.details,
            code: errorData?.code,
            message: errorData?.message
          });
          console.error('Full preset error object:', JSON.stringify(errorData, null, 2));
          
          // Handle different error formats
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData && errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData && errorData.details) {
            errorMessage = errorData.details;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else {
            errorMessage = `HTTP ${responseData.status}: ${responseData.statusText}`;
          }
        } catch (parseError) {
          console.error('Failed to parse preset error response:', parseError);
          try {
            const errorText = await responseData.text();
            console.error('Preset error response text:', errorText);
            errorMessage = `HTTP ${responseData.status}: ${errorText || responseData.statusText}`;
          } catch (textError) {
            console.error('Failed to get preset text response:', textError);
            errorMessage = `HTTP ${responseData.status}: ${responseData.statusText}`;
          }
        }
        setSubmitMessage(`❌ Failed to send message: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error sending preset message:', error);
      setSubmitMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDoorDashGroup = () => {
    if (currentSession?.doordash_group_link) {
      window.open(currentSession.doordash_group_link, '_blank');
    }
  };

  if (!user) return <p>Loading user info...</p>;

  if (isLoadingCompany) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center">
          <p>Loading company information...</p>
        </div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="h-8 w-8" />
            Order Management
          </h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-red-600">Company Membership Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-lg text-gray-600">
              You must be part of a company to participate in group orders.
            </p>
            <p className="text-sm text-gray-500">
              Please contact your company administrator to be added to a company, or create a company if you're an admin.
            </p>
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <a href="/settings">Go to Settings</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/dashboard">Go to Dashboard</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter sessions into active and previous
  const now = new Date();
  const activeSessions = orderSessions.filter(session => {
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    return now >= startTime && now <= endTime && session.status === 'active';
  });
  
  const previousSessions = orderSessions.filter(session => {
    const endTime = new Date(session.end_time);
    return now > endTime || session.status === 'closed';
  });

  // Helper function to format time
  const formatLocalTime = (utcTimeString: string) => {
    const date = new Date(utcTimeString);
    return date.toLocaleString();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Clock className="h-8 w-8" />
          Order Sessions
        </h1>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="flex items-center gap-2"
        >
          <Clock className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Feedback Message */}
      {submitMessage && (
        <div className={`p-4 rounded-lg border ${
          submitMessage.includes('✅') 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {submitMessage.includes('✅') ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="font-medium">{submitMessage}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isSubmitting && (
        <div className="p-4 rounded-lg border bg-blue-50 border-blue-200 text-blue-800">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Submitting your response...</span>
          </div>
        </div>
      )}

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-green-800">Active Sessions</h2>
          {activeSessions.map((session) => {
            const startTime = new Date(session.start_time);
            const endTime = new Date(session.end_time);
            const isActive = now >= startTime && now <= endTime;
            const isUpcoming = now < startTime;
            const isClosed = now > endTime;

            return (
              <Card key={session.id} className="border-green-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-green-800">
                      {session.restaurant_name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {isActive && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Active
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Upcoming
                        </span>
                      )}
                      {isClosed && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          Closed
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Start: {formatLocalTime(session.start_time)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>End: {formatLocalTime(session.end_time)}</span>
                      </div>
                    </div>

                    {isActive && (
                      <DoorDashGroupOrder
                        session={session}
                        userResponse={userResponse}
                        onResponse={handleUserResponse}
                        onPresetMessage={handlePresetMessage}
                        onOpenDoorDash={openDoorDashGroup}
                        user={user}
                        isSubmitting={isSubmitting}
                      />
                    )}

                    {isUpcoming && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-800 text-sm">
                          This session hasn't started yet. Check back at {formatLocalTime(session.start_time)}.
                        </p>
                      </div>
                    )}

                    {isClosed && (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-gray-800 text-sm">
                          This session has ended. You can no longer place orders.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* No Active Sessions */}
      {activeSessions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Order Sessions</h3>
            <p className="text-muted-foreground mb-4">
              There are no active group orders at the moment. Check back later or contact your manager.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Previous Sessions */}
      {previousSessions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Previous Sessions</h2>
          <div className="space-y-3">
            {previousSessions.map((session) => {
              const userParticipant = session.participants?.find((p: any) => p.user_id === user?.id);
              const userStatus = userParticipant?.status || 'pending';

              return (
                <Card key={session.id} className="opacity-75 border-gray-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-gray-700">
                        {session.restaurant_name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          Completed
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          userStatus === 'ordered' ? 'bg-green-100 text-green-800' :
                          userStatus === 'passed' ? 'bg-gray-100 text-gray-800' :
                          userStatus === 'preset' ? 'bg-purple-100 text-purple-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {userStatus === 'ordered' ? 'Ordered' :
                           userStatus === 'passed' ? 'Passed' :
                           userStatus === 'preset' ? 'Preset' : 'No Response'}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Start: {formatLocalTime(session.start_time)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>End: {formatLocalTime(session.end_time)}</span>
                      </div>
                    </div>
                    {userParticipant?.preset_order && (
                      <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-sm text-purple-800">
                          <strong>Your preset message:</strong> {userParticipant.preset_order}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}