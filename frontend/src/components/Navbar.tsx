'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Search,
  User as UserIcon,
  LogOut,
  Shirt,
  UserCheck,
  LayoutDashboard,
  ChevronDown,
  Sparkles,
  Radio,
} from 'lucide-react';

const SEARCH_TYPES = ['Listings', 'Closets', 'Brands', 'Boutiques'];

const NAV_CATEGORIES = [
  { label: 'Women', href: '/marketplace?department=women' },
  { label: 'Men', href: '/marketplace?department=men' },
  { label: 'Kids', href: '/marketplace?department=kids' },
  { label: 'Home', href: '/marketplace?q=home' },
  { label: 'Pets', href: '/marketplace?q=pets' },
  { label: 'Electronics', href: '/marketplace?q=electronics' },
  { label: 'Luxury', href: '/marketplace?sort=price_desc&q=luxury' },
  { label: 'Beauty', href: '/marketplace?category=ACCESSORIES&q=beauty' },
  { label: 'Plus', href: '/marketplace?size=XL' },
  { label: 'Petite', href: '/marketplace?size=XS' },
  { label: 'Trending', href: '/marketplace?sort=newest' },
  { label: 'Brand', href: '/marketplace?sort=newest' },
  { label: 'Posh Live', href: '/marketplace?live=true', isLive: true },
];

export function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Listings');
  const [isSearchFilterOpen, setIsSearchFilterOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}&type=${selectedFilter.toLowerCase()}`);
    } else {
      router.push('/marketplace');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200">
      {/* ── Top Header Row ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-2 flex-shrink-0 group">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#841d37] flex items-center justify-center text-white shadow-sm">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
              </svg>
            </div>
            <span className="text-2xl sm:text-[24px] font-serif font-black tracking-[0.1em] text-[#841d37] group-hover:text-[#731c33] transition-colors">
              SWAPWEAR
            </span>
          </div>
        </Link>

        {/* Search Bar Container */}
        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-2xl hidden md:flex items-center rounded-full border border-slate-300 bg-white hover:border-slate-400 focus-within:border-[#841d37] focus-within:ring-1 focus-within:ring-[#841d37] transition-all h-10 px-3 shadow-2xs"
        >
          {/* Listings Type Dropdown */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsSearchFilterOpen(!isSearchFilterOpen)}
              className="flex items-center text-xs font-semibold text-slate-700 hover:text-slate-900 py-1 pr-1.5 focus:outline-none"
            >
              <span>{selectedFilter}</span>
              <ChevronDown className="h-3.5 w-3.5 ml-1 text-slate-400" />
            </button>

            {isSearchFilterOpen && (
              <div
                className="absolute left-0 top-full mt-2 w-32 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1"
                onMouseLeave={() => setIsSearchFilterOpen(false)}
              >
                {SEARCH_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setSelectedFilter(type);
                      setIsSearchFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-slate-50 transition-colors ${
                      selectedFilter === type ? 'text-[#841d37] font-bold bg-[#fdf2f4]' : 'text-slate-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vertical Divider */}
          <div className="h-4 w-px bg-slate-200 mx-2 flex-shrink-0" />

          {/* Search Input Field */}
          <input
            type="text"
            aria-label="Search clothing listings"
            placeholder="What are you looking for?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent px-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />

          {/* Search Submit Button */}
          <button
            type="submit"
            className="p-1.5 text-slate-500 hover:text-[#841d37] transition-colors focus:outline-none"
            aria-label="Submit Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>

        {/* Right Header Actions */}
        <div className="flex items-center space-x-4 flex-shrink-0">
          {/* Sell Now Button / Link */}
          <Link
            href={isAuthenticated ? '/listings/new' : '/login?redirect=/listings/new'}
            className="text-xs font-semibold text-slate-700 hover:text-[#841d37] transition-colors whitespace-nowrap px-1 py-1"
          >
            Sell Now
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
                <div className="h-6 w-6 rounded-full bg-[#841d37] text-white flex items-center justify-center text-xs font-bold">
                  {user.name[0]?.toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
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
                    className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#841d37]"
                  >
                    <Shirt className="h-3.5 w-3.5 mr-2 text-[#841d37]" />
                    My Closet & Listings
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#841d37]"
                  >
                    <UserCheck className="h-3.5 w-3.5 mr-2 text-[#841d37]" />
                    My Profile
                  </Link>

                  <Link
                    href="/dashboard"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#841d37]"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5 mr-2 text-[#841d37]" />
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
              <button
                type="button"
                className="bg-[#1c1c1c] text-white hover:bg-black rounded-md px-4 py-2 text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
              >
                Log in / Sign up
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Search Row */}
      <form
        onSubmit={handleSearch}
        className="md:hidden px-4 pb-2.5 flex items-center gap-2"
      >
        <div className="flex-1 flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-600 mr-2 flex-shrink-0">{selectedFilter}</span>
          <div className="h-3.5 w-px bg-slate-200 mr-2 flex-shrink-0" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="What are you looking for?"
            className="min-w-0 flex-1 bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          aria-label="Search Marketplace"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1c1c1c] text-white hover:bg-black transition-colors flex-shrink-0"
        >
          <Search className="h-3.5 w-3.5" />
        </button>
      </form>

      {/* ── Sub-Header Category Navigation Bar ─────────────────────────────── */}
      <nav aria-label="Marketplace categories" className="border-t border-slate-200 bg-white overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between space-x-6 sm:space-x-8 h-10 text-xs font-medium text-slate-700 whitespace-nowrap">
          {NAV_CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className={`py-2 hover:text-[#841d37] hover:border-b-2 hover:border-[#841d37] transition-all flex items-center space-x-1.5 ${
                cat.isLive ? 'text-[#d54868] font-bold' : ''
              }`}
            >
              {cat.isLive && (
                <span className="flex items-center space-x-1 text-[#d54868]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  <Radio className="h-3 w-3" />
                </span>
              )}
              <span>{cat.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
