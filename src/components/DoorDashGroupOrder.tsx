"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ExternalLink, CheckCircle, XCircle, AlertCircle, MessageSquare } from "lucide-react";
import PresetOrderNotification from "./PresetOrderNotification";

interface DoorDashGroupOrderProps {
  session: {
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
  };
  userResponse?: 'pending' | 'ordered' | 'passed' | 'preset';
  onResponse: (response: 'ordered' | 'passed' | 'preset') => void;
  onPresetMessage: (message: string) => void;
  onOpenDoorDash: () => void;
  user?: any;
  isSubmitting?: boolean;
}

export default function DoorDashGroupOrder({ 
  session, 
  userResponse = 'pending',
  onResponse,
  onPresetMessage,
  onOpenDoorDash,
  user,
  isSubmitting = false
}: DoorDashGroupOrderProps) {
  const [presetOrder, setPresetOrder] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getParticipantStatusIcon = (status: string) => {
    switch (status) {
      case 'ordered': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'passed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'preset': return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };


  return (
    <div className="space-y-6">
      {/* Main Group Order Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              {session.restaurant_name}
            </CardTitle>
            <Badge className={getStatusColor(session.status)}>
              {session.status.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Ends at {formatTime(session.end_time)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{session.participants.length} participants</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Restaurant Options */}
          <div>
            <h3 className="font-semibold mb-2">Available Restaurants:</h3>
            <div className="flex flex-wrap gap-2">
              {session.restaurant_options.map((restaurant, index) => (
                <Badge key={index} variant="outline">
                  {restaurant}
                </Badge>
              ))}
            </div>
          </div>

          {/* DoorDash Group Link */}
          {session.doordash_group_link && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-blue-900">DoorDash Group Order</h3>
                <p className="text-sm text-blue-700">
                  Click to join the group order and place your order
                </p>
              </div>
              <Button 
                onClick={onOpenDoorDash}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Join Group Order
              </Button>
            </div>
          )}

          {/* User Response Section */}
          {session.status === 'active' && (
            <div className="space-y-4">
              <h3 className="font-semibold">Your Response:</h3>
              
              {userResponse === 'pending' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button 
                    onClick={() => onResponse('ordered')}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={isSubmitting}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Submitting...' : "I'll Order"}
                  </Button>
                  <Button 
                    onClick={() => onResponse('passed')}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    disabled={isSubmitting}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Submitting...' : 'Pass'}
                  </Button>
                  <Button 
                    onClick={() => onResponse('preset')}
                    variant="outline"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    disabled={isSubmitting}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message to Team Leader
                  </Button>
                </div>
              )}

              {userResponse === 'preset' && (
                <PresetOrderNotification
                  session={session}
                  onSendNotification={async (message: string) => {
                    // Save the notification to localStorage for the manager to see
                    const notification = {
                      id: `notification_${Date.now()}`,
                      session_id: session.id,
                      user_id: user?.id || 'current_user',
                      user_name: user?.fullName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'Team Member',
                      message,
                      restaurant: session.restaurant_name,
                      created_at: new Date().toISOString(),
                      status: 'pending',
                      is_read: false
                    };
                    
                    // Save to localStorage (in a real app, this would be sent to the server)
                    const existingNotifications = JSON.parse(
                      localStorage.getItem(`presetRequests_${session.id}`) || '[]'
                    );
                    existingNotifications.push(notification);
                    localStorage.setItem(`presetRequests_${session.id}`, JSON.stringify(existingNotifications));
                    
                    // Call the preset message handler
                    onPresetMessage(message);
                  }}
                  userResponse={userResponse}
                />
              )}

              {userResponse !== 'pending' && userResponse !== 'preset' && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getParticipantStatusIcon(userResponse)}
                    <span className="font-medium">
                      You have {userResponse === 'ordered' ? 'ordered' : 'passed'} on this group order
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
