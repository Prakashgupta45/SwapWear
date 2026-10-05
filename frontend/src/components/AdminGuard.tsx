'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, LayoutDashboard, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=/admin');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center space-y-4 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-[#d54868]" />
        <p className="text-sm font-medium text-slate-400">Verifying administrative credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Role check: If user role is NOT ADMIN, render 403 Forbidden screen
  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-600 border border-red-200">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase tracking-wider font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
              403 Forbidden
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-2">Access Denied</h1>
            <p className="text-sm text-slate-600">
              Your account (<span className="font-semibold">{user?.email}</span>) is assigned the standard{' '}
              <span className="font-semibold text-slate-900">USER</span> role. Administrator permissions are
              required to access the SwapWear Admin Panel.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl text-left border border-slate-200 text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">Security Notice:</p>
            <p>Admin endpoints are enforced server-side. Tampering with client headers or role tokens will be rejected by backend authorization.</p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link href="/marketplace" className="flex-1">
              <Button variant="outline" className="w-full text-xs">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Marketplace
              </Button>
            </Link>
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full text-xs bg-[#1c1c1c] hover:bg-black text-white">
                <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
                User Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
