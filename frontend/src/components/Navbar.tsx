'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sparkles, LogOut, LayoutDashboard, User as UserIcon } from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="h-9 w-9 rounded-xl bg-forest-700 flex items-center justify-center text-white shadow-sm shadow-forest-900/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-forest-900">SwapWear</span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-forest-600 -mt-1">
              Clothing Exchange
            </span>
          </div>
        </Link>

        {/* Navigation actions */}
        <nav className="flex items-center space-x-3 sm:space-x-4">
          {isLoading ? (
            <div className="h-9 w-24 bg-slate-100 rounded-lg animate-pulse" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center space-x-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-slate-700">
                  <LayoutDashboard className="h-4 w-4 mr-2 text-forest-700" />
                  Dashboard
                </Button>
              </Link>

              <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200 text-xs font-medium text-slate-700">
                <UserIcon className="h-3.5 w-3.5 text-forest-700" />
                <span className="max-w-[120px] truncate">{user.name}</span>
                <Badge variant={user.role === 'ADMIN' ? 'admin' : 'default'} className="text-[10px] py-0 px-1.5">
                  {user.role}
                </Badge>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="text-slate-600 hover:text-red-600 hover:border-red-200"
              >
                <LogOut className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-slate-700">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Join SwapWear
                </Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
