'use client';

import { useUser, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Package, Home, ShoppingCart, User, Settings } from 'lucide-react';

export default function Navigation() {
  const { user, isLoaded } = useUser();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-teal-600" />
            <span className="text-xl font-bold text-gray-900">FeedMe</span>
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


