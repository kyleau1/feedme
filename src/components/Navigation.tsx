'use client';
// Version: 2.0 - Fixed role detection

import { useUser, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Home, ShoppingCart, User, Settings, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import NotificationBell from '@/components/NotificationBell';

export default function Navigation() {
  const { user, isLoaded } = useUser();
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<'manager' | 'team_member'>('team_member');

  useEffect(() => {
    const fetchCompanyName = async () => {
      if (!user) {
        setCompanyName(null);
        return;
      }

      try {
        const response = await fetch('/api/companies');
        if (response.ok) {
          const data = await response.json();
          if (data && data.name) {
            setCompanyName(data.name);
          }
        }
      } catch (error) {
        console.error('Error fetching company name:', error);
      }
    };

    fetchCompanyName();
  }, [user]);

  // Fetch current session and user role for notifications
  useEffect(() => {
    const fetchSessionData = async () => {
      if (!user) {
        console.log('No user, skipping session data fetch');
        setCurrentSession(null);
        setParticipants([]);
        setUserRole('team_member');
        return;
      }

      try {
        // Fetch current session
        try {
          const sessionResponse = await fetch('/api/order-sessions/current');
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            setCurrentSession(sessionData);
            setParticipants(sessionData?.participants || []);
          } else {
            console.log('Session API failed:', sessionResponse.status, sessionResponse.statusText);
            setCurrentSession(null);
            setParticipants([]);
          }
        } catch (sessionError) {
          console.error('Error fetching current session:', sessionError);
          setCurrentSession(null);
          setParticipants([]);
        }

        // Fetch user role
        try {
          const roleResponse = await fetch('/api/check-user-role');
          if (roleResponse.ok) {
            const roleData = await roleResponse.json();
            console.log('🔍 Role API response:', roleData);
            
            // Map database roles to notification roles
            const actualRole = roleData.actualRole || roleData.role;
            let notificationRole: 'manager' | 'team_member' = 'team_member';
            
            console.log('🔍 actualRole from API:', actualRole);
            
            if (actualRole === 'admin' || actualRole === 'manager') {
              notificationRole = 'manager';
              console.log('🔍 Mapped to manager role');
            } else if (actualRole === 'employee' || actualRole === 'team_member') {
              notificationRole = 'team_member';
              console.log('🔍 Mapped to team_member role');
            }
            
            setUserRole(notificationRole);
            console.log('✅ User role set to:', notificationRole, '(from actualRole:', actualRole, ')');
          } else {
            console.log('❌ Role API failed:', roleResponse.status, roleResponse.statusText);
            setUserRole('team_member'); // Default fallback
          }
        } catch (roleError) {
          console.error('Error fetching user role:', roleError);
          setUserRole('team_member'); // Default fallback
        }
      } catch (error) {
        console.error('Error in fetchSessionData:', error);
      }
    };

    fetchSessionData();
    
    // Refresh every 5 seconds for real-time updates
    const interval = setInterval(fetchSessionData, 5000);
    
    // Listen for user response events to refresh immediately
    const handleUserResponse = (event: any) => {
      console.log('User response detected, refreshing session data...', event.detail);
      console.log('Full event object:', event);
      fetchSessionData();
    };
    
    window.addEventListener('userResponse', handleUserResponse);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('userResponse', handleUserResponse);
    };
  }, [user]);

  // Calculate notification count
  useEffect(() => {
    const calculateNotificationCount = () => {
      // Get all localStorage keys that start with 'presetRequests_'
      let totalNew = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('presetRequests_')) {
          const notifications = JSON.parse(localStorage.getItem(key) || '[]');
          const newCount = notifications.filter((n: any) => !n.is_read).length;
          totalNew += newCount;
        }
      }
      setNotificationCount(totalNew);
    };

    calculateNotificationCount();
    // Recalculate every 5 seconds to catch new notifications
    const interval = setInterval(calculateNotificationCount, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-teal-600" />
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-gray-900">FeedMe</span>
              {companyName && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-lg font-medium text-gray-700">{companyName}</span>
                </>
              )}
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="flex items-center space-x-1 text-gray-600 hover:text-teal-600 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            <Link 
              href="/order" 
              className="flex items-center space-x-1 text-gray-600 hover:text-teal-600 transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Order Food</span>
            </Link>
                    {user && (
                      <>
                        <Link 
                          href="/orders" 
                          className="flex items-center space-x-1 text-gray-600 hover:text-teal-600 transition-colors"
                        >
                          <Package className="h-4 w-4" />
                          <span>My Orders</span>
                        </Link>
                        <Link 
                          href="/manager-dashboard?tab=preset-orders" 
                          className="flex items-center space-x-1 text-gray-600 hover:text-teal-600 transition-colors"
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>Preset Orders</span>
                          {notificationCount > 0 && (
                            <Badge variant="destructive" className="ml-1 text-xs">
                              {notificationCount} new
                            </Badge>
                          )}
                        </Link>
                        <Link 
                          href="/settings" 
                          className="flex items-center space-x-1 text-gray-600 hover:text-teal-600 transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                      </>
                    )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user && (
              <NotificationBell
                userRole={userRole}
                currentSession={currentSession}
                participants={participants}
              />
            )}
            {!isLoaded ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : user ? (
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="outline" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}


