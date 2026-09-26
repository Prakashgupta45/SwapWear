'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Search,
  PlusCircle,
  User as UserIcon,
  LogOut,
  Shirt,
  UserCheck,
  LayoutDashboard,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

const CATEGORIES = [
  'Women',
  'Men',
  'Kids',
  'Topwear',
  'Bottomwear',
  'Dresses',
  'Outerwear',
  'Footwear',
  'Accessories',
  'Luxury',
  'Beauty',
  'Trending',
  'Brands',
  'Sustainable',
];

export function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState('Listings');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-xs">
      {/* ── Top Header Row ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
          <div className="h-8 w-8 rounded-lg bg-posh-900 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-posh-900 font-serif">
            SWAPWEAR
          </span>
        </Link>

        {/* Search Bar Container (Poshmark Style) */}
        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-2xl hidden md:flex items-center rounded-full border border-slate-300 bg-white hover:border-slate-400 focus-within:border-posh-800 focus-within:ring-1 focus-within:ring-posh-800 transition-all shadow-xs h-10 px-1"
        >
          {/* Scope Selector */}
          <div className="relative flex items-center px-3 border-r border-slate-200 text-xs font-semibold text-slate-700 space-x-1 cursor-pointer select-none">
            <span>{selectedScope}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer text-xs"
            >
              <option value="Listings">Listings</option>
              <option value="People">People</option>
              <option value="Brands">Brands</option>
            </select>
          </div>

          {/* Search Input */}
          <input
            type="text"
            placeholder="What are you looking for?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />

          {/* Search Submit Button */}
          <button
            type="submit"
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-500 hover:text-posh-900 hover:bg-slate-100 transition-colors mr-0.5"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>

        {/* Right Header Actions */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          {/* Sell Now Button */}
          <Link href={isAuthenticated ? '/listings/new' : '/login?redirect=/listings/new'}>
            <Button
              variant="outline"
              size="sm"
              className="font-semibold text-xs px-4 py-2 rounded-full border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-slate-400"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1.5 text-posh-800" />
              Sell Now
            </Button>
          </Link>

          {/* User Authentication Actions */}
          {isLoading ? (
            <div className="h-9 w-24 bg-slate-100 rounded-full animate-pulse" />
          ) : isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 bg-slate-50/80 transition-colors text-xs font-semibold text-slate-800"
              >
                <div className="h-6 w-6 rounded-full bg-posh-900 text-white flex items-center justify-center text-xs font-bold">
                  {user.name[0]?.toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100 space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <Badge variant={user.role === 'ADMIN' ? 'admin' : 'default'} className="mt-1 text-[9px]">
                      {user.role}
                    </Badge>
                  </div>

                  <Link
                    href="/my-listings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-posh-900"
                  >
                    <Shirt className="h-3.5 w-3.5 mr-2 text-posh-800" />
                    My Closet & Listings
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-posh-900"
                  >
                    <UserCheck className="h-3.5 w-3.5 mr-2 text-posh-800" />
                    My Profile
                  </Link>

                  <Link
                    href="/dashboard"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-posh-900"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5 mr-2 text-posh-800" />
                    Account Dashboard
                  </Link>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 text-left"
                  >
                    <LogOut className="h-3.5 w-3.5 mr-2 text-red-500" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login">
              <Button
                variant="primary"
                size="sm"
                className="bg-slate-900 text-white hover:bg-posh-900 rounded-full px-5 py-2 text-xs font-semibold shadow-xs"
              >
                Log in / Sign up
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* ── Sub-Header Category Navigation Bar (Poshmark Style) ─────────────── */}
      <nav className="border-t border-slate-100 bg-white overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-6 h-10 text-xs font-medium text-slate-600 whitespace-nowrap">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/?category=${cat.toUpperCase()}`}
              className="hover:text-posh-900 hover:border-b-2 hover:border-posh-900 py-2.5 transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
