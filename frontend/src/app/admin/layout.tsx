'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminGuard } from '../../components/AdminGuard';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Shirt,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  ArrowLeft,
  Shield,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

const ADMIN_NAV = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Listings', href: '/admin/listings', icon: Shirt },
  { label: 'Swap Requests', href: '/admin/swaps', icon: RefreshCw },
  { label: 'Conversations', href: '/admin/conversations', icon: MessageSquare },
  { label: 'Reports', href: '/admin/reports', icon: AlertTriangle },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#841d37] to-[#d54868] text-white">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight text-white">SwapWear Admin</span>
          </div>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-0 hidden md:flex'
          }`}
        >
          <div className="p-6 space-y-6">
            {/* Admin Header */}
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#841d37] to-[#d54868] text-white shadow-lg shadow-rose-950/40">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-white text-base tracking-tight leading-none">SwapWear</h1>
                <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
                  Admin Console
                </span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1">
              {ADMIN_NAV.map((item) => {
                const isActive =
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom user badge & exit */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 space-y-3">
            <div className="flex items-center space-x-3 px-2 py-1.5">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-rose-400">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'Admin User'}</p>
                <span className="inline-flex items-center text-[10px] text-rose-400 font-medium bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-900/50">
                  <Sparkles className="h-2.5 w-2.5 mr-1" />
                  Administrator
                </span>
              </div>
            </div>

            <Link
              href="/marketplace"
              className="flex items-center justify-center space-x-2 w-full py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Marketplace</span>
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
