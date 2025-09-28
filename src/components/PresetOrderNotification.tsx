"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Send, 
  Clock, 
  User, 
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface PresetOrderNotificationProps {
  session: {
    id: string;
    restaurant_name: string;
    restaurant_options: string[];
    start_time: string;
    end_time: string;
    status: 'upcoming' | 'active' | 'closed' | 'completed';
  };
  onSendNotification: (message: string) => void;
  userResponse?: 'pending' | 'ordered' | 'passed' | 'preset';
}

export default function PresetOrderNotification({
  session,
  onSendNotification,
  userResponse = 'pending'
}: PresetOrderNotificationProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendNotification = async () => {
    if (!message.trim()) return;
    
    setIsSending(true);
    try {
      await onSendNotification(message.trim());
      setSent(true);
      setMessage('');
    } catch (error) {
      console.error('Error sending notification:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString();
  };

  if (userResponse === 'preset' && sent) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">Message Sent!</h3>
              <p className="text-sm text-green-700">
                Your message has been sent to your team leader. 
                They'll handle your order during the group order session.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Send Message to Team Leader
        </CardTitle>
        <p className="text-sm text-gray-600">
          Send a message to your team leader with your order details since you won't be available during the group order.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Info */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Upcoming Group Order</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span><strong>Restaurant:</strong> {session.restaurant_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span><strong>Date:</strong> {formatDate(session.start_time)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span><strong>Time:</strong> {formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
            </div>
          </div>
          
          {session.restaurant_options.length > 1 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-blue-900 mb-2">Available Restaurants:</p>
              <div className="flex flex-wrap gap-1">
                {session.restaurant_options.map((restaurant, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {restaurant}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="space-y-2">
          <Label htmlFor="preset-message">
            Your Message
          </Label>
          <Textarea
            id="preset-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Hi! I won't be available during the ${session.restaurant_name} group order on ${formatDate(session.start_time)} at ${formatTime(session.start_time)}. 

Could you please order for me:
- [Your specific order details here]
- [Any special instructions or modifications]

Thanks!`}
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-gray-500">
            Be specific about what you want to order and any special instructions.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={handleSendNotification}
            disabled={!message.trim() || isSending}
            className="flex-1"
          >
            {isSending ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </div>

        {/* Help Text */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-gray-600 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">How this works:</p>
              <ul className="space-y-1 text-xs">
                <li>• Your team leader will receive this message in their dashboard</li>
                <li>• They'll handle your order during the group order session</li>
                <li>• You'll be marked as "preset" in the participant list</li>
                <li>• Include specific order details and any special requests</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
