'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { AdminAnalytics } from '../../types/admin';
import {
  Users,
  Shirt,
  RefreshCw,
  MessageSquare,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCcw,
} from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getAdminAnalytics();
      if (res.success && res.data) {
        setAnalytics(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load platform analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-900 border border-slate-800 rounded-2xl p-5" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-900 border border-slate-800 rounded-2xl" />
          <div className="h-72 bg-slate-900 border border-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-red-900/40 rounded-2xl space-y-4">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Error Loading Platform Metrics</h2>
        <p className="text-sm text-slate-400">{error || 'An unexpected error occurred.'}</p>
        <Button onClick={fetchAnalytics} variant="outline" className="text-xs">
          Try Again
        </Button>
      </div>
    );
  }

  const { users, listings, swaps, messages, recentActivity } = analytics;

  // Derive Platform Health Metrics
  const swapAcceptanceRate =
    swaps.total > 0 ? Math.round((swaps.accepted / swaps.total) * 100) : 0;
  const listingAvailabilityRate =
    listings.total > 0 ? Math.round((listings.available / listings.total) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black tracking-tight text-white">Platform Overview</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950 text-rose-300 border border-rose-800/40">
              Live DB
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time aggregate data, moderation monitoring, and circular marketplace health.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            onClick={fetchAnalytics}
            variant="outline"
            size="sm"
            className="text-xs border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── 1. Key Statistics Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Users</span>
            <div className="p-2 rounded-xl bg-blue-950/60 text-blue-400 border border-blue-900/40">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-white">{users.total.toLocaleString()}</p>
            <div className="mt-2 flex items-center text-xs text-slate-400 space-x-2">
              <span className="text-emerald-400 font-semibold">{users.active.toLocaleString()} Active</span>
              <span>•</span>
              <span>Engaged in closet/swaps</span>
            </div>
          </div>
        </div>

        {/* Listings Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Listings</span>
            <div className="p-2 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-900/40">
              <Shirt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-white">{listings.total.toLocaleString()}</p>
            <div className="mt-2 flex items-center text-xs text-slate-400 space-x-2">
              <span className="text-emerald-400 font-semibold">{listings.available.toLocaleString()} Available</span>
              <span>•</span>
              <span className="text-amber-400">{listings.reserved.toLocaleString()} Reserved</span>
            </div>
          </div>
        </div>

        {/* Swap Requests Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Swap Requests</span>
            <div className="p-2 rounded-xl bg-purple-950/60 text-purple-400 border border-purple-900/40">
              <RefreshCw className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-white">{swaps.total.toLocaleString()}</p>
            <div className="mt-2 flex items-center text-xs text-slate-400 space-x-2">
              <span className="text-emerald-400 font-semibold">{swaps.accepted.toLocaleString()} Accepted</span>
              <span>•</span>
              <span className="text-amber-400">{swaps.pending.toLocaleString()} Pending</span>
            </div>
          </div>
        </div>

        {/* Messages Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Messages Sent</span>
            <div className="p-2 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-900/40">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-white">{messages.total.toLocaleString()}</p>
            <div className="mt-2 flex items-center text-xs text-slate-400 space-x-2">
              <span className="text-slate-300 font-medium">Phase 5 Real-Time Chat</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Marketplace Health & Distributions ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Swap Pipeline Distribution */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center">
                <Activity className="h-4 w-4 mr-2 text-rose-400" />
                Swap Request Pipeline
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Status breakdown of all platform exchange offers</p>
            </div>
            <Link
              href="/admin/swaps"
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center"
            >
              Manage Swaps <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>

          {/* Progress bar visualizing pipeline */}
          <div className="space-y-3">
            <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${swaps.total > 0 ? (swaps.accepted / swaps.total) * 100 : 0}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Accepted: ${swaps.accepted}`}
              />
              <div
                style={{ width: `${swaps.total > 0 ? (swaps.pending / swaps.total) * 100 : 0}%` }}
                className="bg-amber-500 h-full transition-all"
                title={`Pending: ${swaps.pending}`}
              />
              <div
                style={{ width: `${swaps.total > 0 ? (swaps.rejected / swaps.total) * 100 : 0}%` }}
                className="bg-rose-500 h-full transition-all"
                title={`Rejected: ${swaps.rejected}`}
              />
              <div
                style={{ width: `${swaps.total > 0 ? (swaps.cancelled / swaps.total) * 100 : 0}%` }}
                className="bg-slate-600 h-full transition-all"
                title={`Cancelled: ${swaps.cancelled}`}
              />
            </div>

            {/* Status Breakdown Legend & Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Accepted</span>
                </div>
                <p className="text-lg font-bold text-white mt-1">{swaps.accepted}</p>
                <span className="text-[11px] text-slate-500">
                  {swaps.total > 0 ? Math.round((swaps.accepted / swaps.total) * 100) : 0}% of total
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-1.5 text-xs text-amber-400 font-semibold">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Pending</span>
                </div>
                <p className="text-lg font-bold text-white mt-1">{swaps.pending}</p>
                <span className="text-[11px] text-slate-500">
                  {swaps.total > 0 ? Math.round((swaps.pending / swaps.total) * 100) : 0}% of total
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-1.5 text-xs text-rose-400 font-semibold">
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Rejected</span>
                </div>
                <p className="text-lg font-bold text-white mt-1">{swaps.rejected}</p>
                <span className="text-[11px] text-slate-500">
                  {swaps.total > 0 ? Math.round((swaps.rejected / swaps.total) * 100) : 0}% of total
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-semibold">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Cancelled</span>
                </div>
                <p className="text-lg font-bold text-white mt-1">{swaps.cancelled}</p>
                <span className="text-[11px] text-slate-500">
                  {swaps.total > 0 ? Math.round((swaps.cancelled / swaps.total) * 100) : 0}% of total
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-1.5 text-xs text-blue-400 font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Completed</span>
                </div>
                <p className="text-lg font-bold text-white mt-1">{swaps.completed}</p>
                <span className="text-[11px] text-slate-500">
                  {swaps.total > 0 ? Math.round((swaps.completed / swaps.total) * 100) : 0}% of total
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="border-t border-slate-800 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/80">
              <span className="text-xs text-slate-400 font-medium">Swap Acceptance Rate</span>
              <span className="text-sm font-bold text-emerald-400">{swapAcceptanceRate}%</span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-slate-950/40 rounded-xl border border-slate-800/80">
              <span className="text-xs text-slate-400 font-medium">Available Inventory Ratio</span>
              <span className="text-sm font-bold text-rose-400">{listingAvailabilityRate}%</span>
            </div>
          </div>
        </div>

        {/* Listing Inventory Status */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center">
                <Shirt className="h-4 w-4 mr-2 text-rose-400" />
                Listings Status
              </h2>
              <Link
                href="/admin/listings"
                className="text-xs font-semibold text-rose-400 hover:text-rose-300"
              >
                Inspect
              </Link>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Availability breakdown across circular fashion items</p>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Available (Active in Market)</span>
                  <span className="text-emerald-400">{listings.available} items</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${listings.total > 0 ? (listings.available / listings.total) * 100 : 0}%`,
                    }}
                    className="bg-emerald-500 h-full rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Reserved / Moderated</span>
                  <span className="text-amber-400">{listings.reserved} items</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${listings.total > 0 ? (listings.reserved / listings.total) * 100 : 0}%`,
                    }}
                    className="bg-amber-500 h-full rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-300">Swapped (Completed)</span>
                  <span className="text-blue-400">{listings.swapped} items</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${listings.total > 0 ? (listings.swapped / listings.total) * 100 : 0}%`,
                    }}
                    className="bg-blue-500 h-full rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400">
            <span className="text-white font-semibold block mb-0.5">Moderation Note:</span>
            When a listing is moderated, it transitions to RESERVED, immediately removing it from public marketplace discovery without deleting historical swap references.
          </div>
        </div>
      </div>

      {/* ── 3. Real Recent Activity Feed ─────────────────────────────────── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-rose-400" />
              Recent Marketplace Activity
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live chronological feed constructed from database timestamps
            </p>
          </div>
        </div>

        {recentActivity.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No recent activity recorded in the database.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {recentActivity.map((act) => {
              const formattedTime = new Date(act.timestamp).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={act.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 min-w-0">
                    <span
                      className={`h-2 w-2 rounded-full flex-shrink-0 ${
                        act.type === 'USER_REGISTERED'
                          ? 'bg-blue-400'
                          : act.type === 'LISTING_CREATED'
                          ? 'bg-rose-400'
                          : 'bg-emerald-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{act.description}</p>
                      <span className="text-[11px] text-slate-500 font-mono">{act.type}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-mono whitespace-nowrap">{formattedTime}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 4. Admin Management Quick Actions ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/users"
          className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:bg-slate-900 hover:border-slate-700 transition-all flex items-center justify-between group"
        >
          <div>
            <h3 className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors">
              User Management
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Inspect closets & manage roles</p>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href="/admin/listings"
          className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:bg-slate-900 hover:border-slate-700 transition-all flex items-center justify-between group"
        >
          <div>
            <h3 className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors">
              Listing Moderation
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Review items & moderate listings</p>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href="/admin/swaps"
          className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl hover:bg-slate-900 hover:border-slate-700 transition-all flex items-center justify-between group"
        >
          <div>
            <h3 className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors">
              Swap Activity
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Audit requests & trade flow</p>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>
    </div>
  );
}
