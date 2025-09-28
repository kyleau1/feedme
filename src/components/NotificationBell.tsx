'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Clock, CheckCircle, AlertCircle, Users, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Notification {
  id: string;
  type: 'deadline' | 'order_placed' | 'order_missing' | 'session_ending' | 'order_passed' | 'preset_order' | 'auto_passed' | 'session_created';
  title: string;
  message: string;
  timestamp: Date;
  sessionId?: string;
  userId?: string;
  userName?: string;
}

interface NotificationBellProps {
  userRole: 'manager' | 'team_member';
  currentSession?: any;
  participants?: any[];
}

export default function NotificationBell({ userRole, currentSession, participants = [] }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [previousParticipants, setPreviousParticipants] = useState<any[]>([]);
  const lastNotificationTime = useRef<number>(0);
  const generatedNotificationIds = useRef<Set<string>>(new Set());
  const lastCleanupTime = useRef<number>(0);

  // Auto-pass users who haven't responded by deadline
  useEffect(() => {
    const checkAndAutoPass = async () => {
      if (!currentSession || currentSession.status !== 'active') return;

      const now = new Date();
      const endTime = new Date(currentSession.end_time);
      
      // If session is past deadline, auto-pass pending users
      if (now > endTime) {
        try {
          const response = await fetch('/api/order-sessions/auto-pass', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: currentSession.id })
          });

          if (response.ok) {
            const result = await response.json();
            console.log('Auto-pass result:', result);
            
            // If users were auto-passed, refresh the page to update the UI
            if (result.autoPassedCount > 0) {
              window.location.reload();
            }
          }
        } catch (error) {
          console.error('Error auto-passing users:', error);
        }
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkAndAutoPass, 30000);
    return () => clearInterval(interval);
  }, [currentSession]);

  // Generate notifications based on user role and session data
  useEffect(() => {
    if (!currentSession) return;

    console.log('🔔 NotificationBell: useEffect triggered', {
      userRole,
      currentSession: currentSession.id,
      participantsCount: participants.length,
      previousParticipantsCount: previousParticipants.length
    });
    console.log('🔔 Full participants data:', participants);
    console.log('🔔 User role detected as:', userRole, '(should be "manager" for manager account)');
    console.log('🔔 userRole type:', typeof userRole, 'value:', userRole);

    const newNotifications: Notification[] = [];
    let hasStatusChanges = false;

    // Check if participants data has actually changed
    const participantsChanged = previousParticipants.length !== participants.length || 
      participants.some(current => {
        const previous = previousParticipants.find(prev => prev.user_id === current.user_id);
        return !previous || previous.status !== current.status;
      });

    console.log('🔍 Participants changed check:', { 
      participantsChanged, 
      prevLength: previousParticipants.length, 
      currLength: participants.length 
    });

    // Early return if no changes and not first load
    if (previousParticipants.length > 0 && !participantsChanged) {
      console.log('🔔 No changes detected, skipping notification generation');
      return;
    }

    // Debounce: prevent notifications from being generated too frequently
    const now = Date.now();
    const timeSinceLastNotification = now - lastNotificationTime.current;
    const DEBOUNCE_TIME = 2000; // 2 seconds

    if (previousParticipants.length > 0 && timeSinceLastNotification < DEBOUNCE_TIME) {
      console.log('🔔 Debouncing notifications, too soon since last generation');
      return;
    }

    lastNotificationTime.current = now;

    // Clean up old notification IDs every 5 minutes to prevent memory buildup
    const timeSinceLastCleanup = now - lastCleanupTime.current;
    if (timeSinceLastCleanup > 300000) { // 5 minutes
      generatedNotificationIds.current.clear();
      lastCleanupTime.current = now;
      console.log('🔔 Cleaned up old notification IDs');
    }

    // Check for changes in participant status (for managers)
    if (userRole === 'manager' && previousParticipants.length > 0 && participantsChanged) {
      console.log('🔍 Checking for participant changes...');
      console.log('🔍 Previous participants:', previousParticipants.map(p => ({ name: p.user_name, status: p.status })));
      console.log('🔍 Current participants:', participants.map(p => ({ name: p.user_name, status: p.status })));

      // Find users who changed status
      const changedUsers = participants.filter(current => {
        const previous = previousParticipants.find(prev => prev.user_id === current.user_id);
        return previous && previous.status !== current.status;
      });

      console.log('🔍 Changed users:', changedUsers);

      // Generate notifications for status changes
      changedUsers.forEach(user => {
        const previousUser = previousParticipants.find(prev => prev.user_id === user.user_id);
        if (previousUser && previousUser.status !== user.status) {
          hasStatusChanges = true;
          const timestamp = Date.now();
          let notificationId = '';
          
          if (user.status === 'ordered') {
            notificationId = `order_placed_${user.user_id}_${currentSession.id}_${Math.floor(timestamp / 1000)}`;
            if (!generatedNotificationIds.current.has(notificationId)) {
              newNotifications.push({
                id: notificationId,
                type: 'order_placed',
                title: 'Order Placed',
                message: `${user.user_name || 'Unknown User'} has placed their order`,
                timestamp: new Date(timestamp),
                sessionId: currentSession.id,
                userId: user.user_id,
                userName: user.user_name
              });
              generatedNotificationIds.current.add(notificationId);
            }
          } else if (user.status === 'passed') {
            notificationId = `order_passed_${user.user_id}_${currentSession.id}_${Math.floor(timestamp / 1000)}`;
            if (!generatedNotificationIds.current.has(notificationId)) {
              newNotifications.push({
                id: notificationId,
                type: 'order_passed',
                title: 'Order Passed',
                message: `${user.user_name || 'Unknown User'} has passed on the order`,
                timestamp: new Date(timestamp),
                sessionId: currentSession.id,
                userId: user.user_id,
                userName: user.user_name
              });
              generatedNotificationIds.current.add(notificationId);
            }
          } else if (user.status === 'preset') {
            notificationId = `preset_order_${user.user_id}_${currentSession.id}_${Math.floor(timestamp / 1000)}`;
            if (!generatedNotificationIds.current.has(notificationId)) {
              newNotifications.push({
                id: notificationId,
                type: 'preset_order',
                title: 'Preset Order',
                message: `${user.user_name || 'Unknown User'} sent a preset order: ${user.preset_order || 'No message'}`,
                timestamp: new Date(timestamp),
                sessionId: currentSession.id,
                userId: user.user_id,
                userName: user.user_name
              });
              generatedNotificationIds.current.add(notificationId);
            }
          }
        }
      });
    }

    // Update previous participants for next comparison
    setPreviousParticipants(participants);

    if (userRole === 'team_member') {
      // Team member notifications
      const now = new Date();
      const sessionEnd = new Date(currentSession.end_time);
      const timeLeft = sessionEnd.getTime() - now.getTime();
      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

      // Check if this is a new session (first load)
      const isFirstLoad = previousParticipants.length === 0;
      if (isFirstLoad && currentSession) {
        newNotifications.push({
          id: `session_created_${currentSession.id}`,
          type: 'session_created',
          title: 'New Order Session',
          message: 'A new order session has been created. You can now place your order!',
          timestamp: now,
          sessionId: currentSession.id
        });
      }

      if (timeLeft > 0) {
        // Session ending soon notification (last 5 minutes)
        if (minutesLeft <= 5 && minutesLeft > 0) {
          const notificationId = `session_ending_5min_${currentSession.id}`;
          if (!generatedNotificationIds.current.has(notificationId)) {
            newNotifications.push({
              id: notificationId,
              type: 'session_ending',
              title: 'Session Ending Soon',
              message: `The order session will end in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`,
              timestamp: now,
              sessionId: currentSession.id
            });
            generatedNotificationIds.current.add(notificationId);
          }
        } else if (hoursLeft < 1 && minutesLeft <= 30) {
          newNotifications.push({
            id: 'deadline_warning',
            type: 'deadline',
            title: 'Order Deadline Approaching',
            message: `Only ${minutesLeft} minutes left to place your order!`,
            timestamp: now,
            sessionId: currentSession.id
          });
        } else if (hoursLeft < 2) {
          newNotifications.push({
            id: 'deadline_reminder',
            type: 'deadline',
            title: 'Order Deadline Reminder',
            message: `Only ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} left to place your order!`,
            timestamp: now,
            sessionId: currentSession.id
          });
        }
      } else {
        // Check if user was auto-passed
        const currentUserParticipant = participants.find(p => p.user_id === localStorage.getItem('clerk_user_id'));
        if (currentUserParticipant && currentUserParticipant.status === 'passed' && currentUserParticipant.preset_order === 'Auto-passed due to deadline') {
          newNotifications.push({
            id: 'auto_passed_notification',
            type: 'auto_passed',
            title: 'Auto-Passed Due to Deadline',
            message: 'You were automatically passed on this order because you did not respond by the deadline.',
            timestamp: now,
            sessionId: currentSession.id
          });
        } else {
          newNotifications.push({
            id: 'deadline_passed',
            type: 'deadline',
            title: 'Order Deadline Passed',
            message: 'The order deadline has passed. You can no longer place an order.',
            timestamp: now,
            sessionId: currentSession.id
          });
        }
      }
    } else if (userRole === 'manager') {
      // Manager notifications
      const pendingParticipants = participants.filter(p => p.status === 'pending');
      const orderedParticipants = participants.filter(p => p.status === 'ordered');
      const passedParticipants = participants.filter(p => p.status === 'passed');
      const presetParticipants = participants.filter(p => p.status === 'preset');
      const totalParticipants = participants.length;

      // Only generate static notifications on first load, not on every status change
      const isFirstLoad = previousParticipants.length === 0;
      
      console.log('🔍 Static notification check:', { 
        isFirstLoad, 
        hasStatusChanges, 
        participantsChanged, 
        shouldGenerateStatic: isFirstLoad
      });
      
      // Only generate static notifications on first load to avoid duplicates
      if (isFirstLoad) {
        if (pendingParticipants.length > 0) {
          const pendingNames = pendingParticipants.map(p => p.user_name || 'Unknown User').join(', ');
          const notificationId = `pending_orders_${currentSession.id}_${Math.floor(now / 1000)}`;
          if (!generatedNotificationIds.current.has(notificationId)) {
            newNotifications.push({
              id: notificationId,
              type: 'order_missing',
              title: 'Pending Orders',
              message: `${pendingParticipants.length} team member${pendingParticipants.length !== 1 ? 's' : ''} haven't placed their order yet: ${pendingNames}`,
              timestamp: new Date(now),
              sessionId: currentSession.id
            });
            generatedNotificationIds.current.add(notificationId);
          }
        }

        if (orderedParticipants.length > 0) {
          const orderedNames = orderedParticipants.map(p => p.user_name || 'Unknown User').join(', ');
          const notificationId = `orders_placed_${currentSession.id}_${Math.floor(now / 1000)}`;
          if (!generatedNotificationIds.current.has(notificationId)) {
            newNotifications.push({
              id: notificationId,
              type: 'order_placed',
              title: 'Orders Placed',
              message: `${orderedParticipants.length} team member${orderedParticipants.length !== 1 ? 's' : ''} have placed their order: ${orderedNames}`,
              timestamp: new Date(now),
              sessionId: currentSession.id
            });
            generatedNotificationIds.current.add(notificationId);
          }
        }
      }

      console.log('Manager notifications - passed participants:', {
        passedParticipants: passedParticipants.length,
        passedDetails: passedParticipants.map(p => ({ name: p.user_name, status: p.status, preset_order: p.preset_order }))
      });

      // Only generate these static notifications on first load to avoid duplicates
      if (isFirstLoad) {
        if (passedParticipants.length > 0) {
          const passedNames = passedParticipants.map(p => p.user_name || 'Unknown User').join(', ');
          
          // Separate auto-passed from manually passed
          const autoPassedParticipants = passedParticipants.filter(p => p.preset_order === 'Auto-passed due to deadline');
          const manualPassedParticipants = passedParticipants.filter(p => p.preset_order !== 'Auto-passed due to deadline');
          
          console.log('Separated passed participants:', {
            autoPassed: autoPassedParticipants.length,
            manualPassed: manualPassedParticipants.length
          });
          
          if (autoPassedParticipants.length > 0) {
            const autoPassedNames = autoPassedParticipants.map(p => p.user_name || 'Unknown User').join(', ');
            const notificationId = `auto_passed_orders_${currentSession.id}_${Math.floor(now / 1000)}`;
            if (!generatedNotificationIds.current.has(notificationId)) {
              newNotifications.push({
                id: notificationId,
                type: 'auto_passed',
                title: 'Auto-Passed Orders',
                message: `${autoPassedParticipants.length} team member${autoPassedParticipants.length !== 1 ? 's' : ''} were automatically passed due to deadline: ${autoPassedNames}`,
                timestamp: new Date(now),
                sessionId: currentSession.id
              });
              generatedNotificationIds.current.add(notificationId);
            }
          }
          
          if (manualPassedParticipants.length > 0) {
            const manualPassedNames = manualPassedParticipants.map(p => p.user_name || 'Unknown User').join(', ');
            const notificationId = `manual_passed_orders_${currentSession.id}_${Math.floor(now / 1000)}`;
            if (!generatedNotificationIds.current.has(notificationId)) {
              newNotifications.push({
                id: notificationId,
                type: 'order_passed',
                title: 'Orders Passed',
                message: `${manualPassedParticipants.length} team member${manualPassedParticipants.length !== 1 ? 's' : ''} passed on this order: ${manualPassedNames}`,
                timestamp: new Date(now),
                sessionId: currentSession.id
              });
              generatedNotificationIds.current.add(notificationId);
            }
          }
        }

        if (presetParticipants.length > 0) {
          const presetNames = presetParticipants.map(p => p.user_name || 'Unknown User').join(', ');
          const notificationId = `preset_orders_${currentSession.id}_${Math.floor(now / 1000)}`;
          if (!generatedNotificationIds.current.has(notificationId)) {
            newNotifications.push({
              id: notificationId,
              type: 'preset_order',
              title: 'Preset Orders',
              message: `${presetParticipants.length} team member${presetParticipants.length !== 1 ? 's' : ''} sent preset order messages: ${presetNames}`,
              timestamp: new Date(now),
              sessionId: currentSession.id
            });
            generatedNotificationIds.current.add(notificationId);
          }
        }
      }

      // Check for session ending soon - only in last 5 minutes
      const sessionEnd = new Date(currentSession.end_time);
      const timeLeft = sessionEnd.getTime() - now;
      const minutesLeft = Math.floor(timeLeft / (1000 * 60));

      // Only show notification in last 5 minutes and only once per session
      if (timeLeft > 0 && minutesLeft <= 5 && minutesLeft > 0) {
        const notificationId = `session_ending_5min_${currentSession.id}`;
        if (!generatedNotificationIds.current.has(notificationId)) {
          newNotifications.push({
            id: notificationId,
            type: 'session_ending',
            title: 'Session Ending Soon',
            message: `The order session will end in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`,
            timestamp: new Date(now),
            sessionId: currentSession.id
          });
          generatedNotificationIds.current.add(notificationId);
        }
      }
    }

    console.log('Setting notifications:', {
      count: newNotifications.length,
      notifications: newNotifications.map(n => ({ type: n.type, title: n.title, message: n.message }))
    });
    console.log('Full notifications array:', newNotifications);
    
    // Only update notifications if there are new ones or this is the first load
    if (newNotifications.length > 0 || previousParticipants.length === 0) {
      console.log('🔔 Updating notifications:', { 
        newCount: newNotifications.length, 
        isFirstLoad: previousParticipants.length === 0,
        hasStatusChanges 
      });
      
      if (userRole === 'manager' && previousParticipants.length > 0) {
        // For managers, append new notifications to existing ones but prevent duplicates
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const uniqueNewNotifications = newNotifications.filter(n => !existingIds.has(n.id));
          console.log('🔔 Appending unique notifications:', uniqueNewNotifications.length);
          
          // Clean up old notifications (keep only last 10) to prevent accumulation
          const allNotifications = [...prev, ...uniqueNewNotifications];
          const sortedNotifications = allNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          const recentNotifications = sortedNotifications.slice(0, 10);
          
          return recentNotifications;
        });
        setUnreadCount(prev => prev + newNotifications.length);
      } else {
        // For team members or first load, replace all notifications
        console.log('🔔 Replacing all notifications');
        setNotifications(newNotifications);
        setUnreadCount(newNotifications.length);
      }
    } else {
      console.log('🔔 No notifications to update');
    }
  }, [userRole, currentSession, participants]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deadline':
        return <Clock className="h-4 w-4 text-teal-500" />;
      case 'order_placed':
        return <CheckCircle className="h-4 w-4 text-teal-500" />;
      case 'order_missing':
        return <AlertCircle className="h-4 w-4 text-teal-500" />;
      case 'session_ending':
        return <Users className="h-4 w-4 text-teal-500" />;
      case 'order_passed':
        return <X className="h-4 w-4 text-teal-500" />;
      case 'preset_order':
        return <MessageSquare className="h-4 w-4 text-teal-500" />;
      case 'auto_passed':
        return <Clock className="h-4 w-4 text-teal-500" />;
      case 'session_created':
        return <Bell className="h-4 w-4 text-teal-500" />;
      default:
        return <Bell className="h-4 w-4 text-teal-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'deadline':
        return 'border-teal-200 bg-teal-50';
      case 'order_placed':
        return 'border-teal-200 bg-teal-50';
      case 'order_missing':
        return 'border-teal-200 bg-teal-50';
      case 'session_ending':
        return 'border-teal-200 bg-teal-50';
      case 'order_passed':
        return 'border-teal-200 bg-teal-50';
      case 'preset_order':
        return 'border-teal-200 bg-teal-50';
      case 'auto_passed':
        return 'border-teal-200 bg-teal-50';
      case 'session_created':
        return 'border-teal-200 bg-teal-50';
      default:
        return 'border-teal-200 bg-teal-50';
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const dismissAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-80">
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notifications</CardTitle>
                <div className="flex gap-2">
                  {notifications.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={dismissAllNotifications}
                      className="text-xs"
                    >
                      Clear All
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${getNotificationColor(notification.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissNotification(notification.id)}
                        className="p-1 h-auto"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
