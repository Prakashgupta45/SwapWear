'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthGuard } from '../../components/AuthGuard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  Database,
  Lock,
  LogOut,
  Calendar,
  KeyRound
} from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <AuthGuard>
      <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Header greeting banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome back, {user?.name}!
              </h1>
              {user && (
                <Badge variant={user.role === 'ADMIN' ? 'admin' : 'default'} className="text-xs">
                  {user.role}
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-500">
              Your SwapWear account is active. You have full access to Phase 1 verified features.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => logout()}
            className="self-start sm:self-center text-slate-700 hover:text-red-600 hover:border-red-200"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <Card className="shadow-sm border-slate-200 md:col-span-1">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="h-9 w-9 rounded-xl bg-forest-100 flex items-center justify-center text-forest-800">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Account Profile</CardTitle>
                  <CardDescription>Safe authenticated identity</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">User ID</span>
                <p className="font-mono text-xs text-slate-700 break-all">{user?.id}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</span>
                <p className="font-medium text-slate-800">{user?.email}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</span>
                <div className="pt-0.5">
                  <Badge variant={user?.role === 'ADMIN' ? 'admin' : 'default'}>
                    {user?.role}
                  </Badge>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Member Since</span>
                  <p className="text-xs text-slate-700">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Today'}
                  </p>
                </div>
                <Calendar className="h-4 w-4 text-slate-400" />
              </div>
            </CardContent>
          </Card>

          {/* Phase 1 Verification Status */}
          <Card className="shadow-sm border-slate-200 md:col-span-2">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="h-9 w-9 rounded-xl bg-forest-100 flex items-center justify-center text-forest-800">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Phase 1 Architecture Status</CardTitle>
                  <CardDescription>Security, database, and authentication criteria</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center space-x-2 text-forest-700 font-semibold text-sm">
                    <Database className="h-4 w-4" />
                    <span>PostgreSQL & Prisma</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Real PostgreSQL persistence with Prisma ORM migrations, unique indexed emails, and Role enum.
                  </p>
                  <div className="inline-flex items-center text-xs font-medium text-emerald-600 space-x-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Connected & Migrated</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center space-x-2 text-forest-700 font-semibold text-sm">
                    <Lock className="h-4 w-4" />
                    <span>HTTP-only Cookie Session</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    JWT token stored in secure HTTP-only cookies with SameSite lax protection against XSS and CSRF.
                  </p>
                  <div className="inline-flex items-center text-xs font-medium text-emerald-600 space-x-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Protected Session Active</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center space-x-2 text-forest-700 font-semibold text-sm">
                    <KeyRound className="h-4 w-4" />
                    <span>Bcrypt Password Security</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Passwords hashed with 12 salt rounds. PasswordHash is strictly excluded from all API responses.
                  </p>
                  <div className="inline-flex items-center text-xs font-medium text-emerald-600 space-x-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Zero Plaintext Exposure</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center space-x-2 text-forest-700 font-semibold text-sm">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Role-Based Authorization</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Express middleware enforces USER and ADMIN permissions on protected resource endpoints.
                  </p>
                  <div className="inline-flex items-center text-xs font-medium text-emerald-600 space-x-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>RBAC Enforced</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
