"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Clock, 
  User, 
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";

interface PresetOrderRequest {
  id: string;
  session_id: string;
  user_id: string;
  user_name: string;
  message: string;
  restaurant: string;
  created_at: string;
  status: 'pending' | 'acknowledged' | 'completed';
  is_read: boolean;
}

interface PresetOrderNotificationsProps {
  sessionId: string;
  onAcknowledge?: (requestId: string) => void;
  onMarkComplete?: (requestId: string) => void;
  onDelete?: (requestId: string) => void;
}

export default function PresetOrderNotifications({
  sessionId,
  onAcknowledge,
  onMarkComplete,
  onDelete
}: PresetOrderNotificationsProps) {
  const [requests, setRequests] = useState<PresetOrderRequest[]>([]);
  const [showRead, setShowRead] = useState(false);

  // Load preset order requests from localStorage (in a real app, this would be from a database)
  useEffect(() => {
    const savedRequests = localStorage.getItem(`presetRequests_${sessionId}`);
    if (savedRequests) {
      setRequests(JSON.parse(savedRequests));
    }
  }, [sessionId]);

  const handleAcknowledge = (requestId: string) => {
    const updatedRequests = requests.map(req => 
      req.id === requestId 
        ? { ...req, status: 'acknowledged' as const, is_read: true }
        : req
    );
    setRequests(updatedRequests);
    localStorage.setItem(`presetRequests_${sessionId}`, JSON.stringify(updatedRequests));
    onAcknowledge?.(requestId);
  };

  const handleMarkComplete = (requestId: string) => {
    const updatedRequests = requests.map(req => 
      req.id === requestId 
        ? { ...req, status: 'completed' as const, is_read: true }
        : req
    );
    setRequests(updatedRequests);
    localStorage.setItem(`presetRequests_${sessionId}`, JSON.stringify(updatedRequests));
    onMarkComplete?.(requestId);
  };

  const handleDelete = (requestId: string) => {
    const updatedRequests = requests.filter(req => req.id !== requestId);
    setRequests(updatedRequests);
    localStorage.setItem(`presetRequests_${sessionId}`, JSON.stringify(updatedRequests));
    onDelete?.(requestId);
  };

  const handleMarkAsRead = (requestId: string) => {
    const updatedRequests = requests.map(req => 
      req.id === requestId 
        ? { ...req, is_read: true }
        : req
    );
    setRequests(updatedRequests);
    localStorage.setItem(`presetRequests_${sessionId}`, JSON.stringify(updatedRequests));
  };

  const filteredRequests = showRead 
    ? requests 
    : requests.filter(req => !req.is_read);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'acknowledged': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'acknowledged': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Team Member Messages</h3>
          {requests.filter(req => !req.is_read).length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {requests.filter(req => !req.is_read).length} new
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowRead(!showRead)}
        >
          {showRead ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
          {showRead ? 'Hide Read' : 'Show Read'}
        </Button>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Messages</h3>
            <p className="text-gray-600">
              {showRead 
                ? 'No messages have been sent for this session yet.'
                : 'No new messages from team members at the moment.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => (
            <Card 
              key={request.id} 
              className={`${!request.is_read ? 'border-blue-200 bg-blue-50' : ''} hover:shadow-md transition-shadow`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{request.user_name}</h4>
                        <Badge className={getStatusColor(request.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(request.status)}
                            {request.status}
                          </div>
                        </Badge>
                        {!request.is_read && (
                          <Badge variant="destructive" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatTime(request.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!request.is_read && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsRead(request.id)}
                      >
                        Mark Read
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(request.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Message:</p>
                    <div className="p-3 bg-white rounded border text-sm whitespace-pre-wrap">
                      {request.message}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {request.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAcknowledge(request.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Acknowledge
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkComplete(request.id)}
                        >
                          Mark Complete
                        </Button>
                      </>
                    )}
                    {request.status === 'acknowledged' && (
                      <Button
                        size="sm"
                        onClick={() => handleMarkComplete(request.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Complete
                      </Button>
                    )}
                    {request.status === 'completed' && (
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        Order completed
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {requests.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {requests.filter(req => req.status === 'pending').length}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {requests.filter(req => req.status === 'acknowledged').length}
                </p>
                <p className="text-sm text-gray-600">Acknowledged</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {requests.filter(req => req.status === 'completed').length}
                </p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
