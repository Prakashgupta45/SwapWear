'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { AuthGuard } from '../../components/AuthGuard';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  User as UserIcon,
  LogOut,
  Calendar,
  Shirt,
  ArrowLeftRight,
  PlusCircle,
  ShoppingBag,
  ArrowUpRight,
  UserCheck,
  Zap,
  Inbox,
  Send,
  Shield,
  Layers,
  CheckCircle,
  MapPin,
  CheckCircle2,
  Bot,
  Sparkles,
} from 'lucide-react';
import { SwapMatchItem } from '../../types/match';
import { ClothingListing } from '../../types/listing';
import AiRecommendationsSection from '../../components/AiRecommendationsSection';
import { SwapRequestModal } from '../../components/SwapRequestModal';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    myListings: 0,
    receivedSwaps: 0,
    sentSwaps: 0,
    loading: true,
  });
  const [recommendations, setRecommendations] = useState<SwapMatchItem[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState<boolean>(true);
  const [activeRecommendationTab, setActiveRecommendationTab] = useState<'ai' | 'smart' | 'both'>('ai');
  const [isSwapModalOpen, setIsSwapModalOpen] = useState<boolean>(false);
  const [swapTargetListing, setSwapTargetListing] = useState<ClothingListing | null>(null);

  const handleInitiateSwap = (target: ClothingListing) => {
    setSwapTargetListing(target);
    setIsSwapModalOpen(true);
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchStats() {
      try {
        const [listingsRes, receivedRes, sentRes, recsRes] = await Promise.allSettled([
          api.getMyListings(),
          api.getReceivedSwapRequests(),
          api.getSentSwapRequests(),
          api.getUserRecommendations({ limit: 4 }),
        ]);

        if (!isMounted) return;

        const myListings =
          listingsRes.status === 'fulfilled' && listingsRes.value?.success && listingsRes.value.data?.listings
            ? listingsRes.value.data.listings.length
            : 0;

        const receivedSwaps =
          receivedRes.status === 'fulfilled' && receivedRes.value?.success && receivedRes.value.data?.swapRequests
            ? receivedRes.value.data.swapRequests.length
            : 0;

        const sentSwaps =
          sentRes.status === 'fulfilled' && sentRes.value?.success && sentRes.value.data?.swapRequests
            ? sentRes.value.data.swapRequests.length
            : 0;

        if (recsRes.status === 'fulfilled' && recsRes.value?.success && recsRes.value.data?.recommendations) {
          setRecommendations(recsRes.value.data.recommendations);
        }

        setStats({
          myListings,
          receivedSwaps,
          sentSwaps,
          loading: false,
        });
      } catch {
        if (isMounted) {
          setStats((prev) => ({ ...prev, loading: false }));
        }
      } finally {
        if (isMounted) {
          setIsLoadingRecommendations(false);
        }
      }
    }

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AuthGuard>
      <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Header Greeting Banner - Premium Burgundy & Rose Gradient */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#731c33] via-[#841d37] to-[#a32243] p-7 sm:p-9 shadow-lg shadow-posh-900/15 border border-posh-700/40 text-white">
          {/* Subtle decorative glow circles */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-52 h-52 bg-rose-400/15 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center justify-center h-11 w-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white font-bold text-lg shadow-inner overflow-hidden shrink-0">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                  )}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Welcome back, {user?.name}!
                </h1>
                {user && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-rose-100 border border-white/25 backdrop-blur-sm">
                    {user.role}
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base text-rose-100/90 max-w-2xl font-light">
                Your SwapWear account is active. Manage your wardrobe, explore community styles, and exchange clothing with ease.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
              <Link href="/profile">
                <Button
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm font-medium shadow-sm transition-all"
                >
                  <UserCheck className="h-4 w-4 mr-2 text-rose-200" />
                  Edit Profile
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => logout()}
                className="bg-black/20 hover:bg-red-600/80 text-rose-100 hover:text-white border-white/20 backdrop-blur-sm font-medium transition-all"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* My Closet Stat */}
          <Link href="/my-listings" className="group">
            <div className="h-full p-6 rounded-2xl bg-gradient-to-br from-rose-50/70 via-white to-posh-50/40 border border-rose-200/80 shadow-sm transition-all duration-200 hover:shadow-md hover:border-posh-400 hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-posh-700 uppercase tracking-wider">
                  My Closet
                </span>
                <div className="h-10 w-10 rounded-xl bg-posh-100 text-posh-800 flex items-center justify-center group-hover:bg-posh-800 group-hover:text-white transition-all shadow-sm">
                  <Shirt className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <p className="text-3xl font-extrabold text-slate-900">
                  {stats.loading ? '—' : stats.myListings}
                </p>
                <span className="text-xs text-posh-700 font-semibold flex items-center group-hover:translate-x-0.5 transition-transform">
                  View Items <ArrowUpRight className="h-3.5 w-3.5 ml-0.5" />
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">Active clothes listed for exchange</p>
            </div>
          </Link>

          {/* Received Offers Stat */}
          <Link href="/swap-requests" className="group">
            <div className="h-full p-6 rounded-2xl bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 border border-amber-200/80 shadow-sm transition-all duration-200 hover:shadow-md hover:border-amber-400 hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Received Offers
                </span>
                <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
                  <Inbox className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <p className="text-3xl font-extrabold text-slate-900">
                  {stats.loading ? '—' : stats.receivedSwaps}
                </p>
                <span className="text-xs text-amber-700 font-semibold flex items-center group-hover:translate-x-0.5 transition-transform">
                  Review <ArrowUpRight className="h-3.5 w-3.5 ml-0.5" />
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">Pending incoming trade proposals</p>
            </div>
          </Link>

          {/* Sent Requests Stat */}
          <Link href="/swap-requests" className="group">
            <div className="h-full p-6 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 border border-emerald-200/80 shadow-sm transition-all duration-200 hover:shadow-md hover:border-emerald-400 hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Sent Requests
                </span>
                <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-all shadow-sm">
                  <Send className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <p className="text-3xl font-extrabold text-slate-900">
                  {stats.loading ? '—' : stats.sentSwaps}
                </p>
                <span className="text-xs text-emerald-700 font-semibold flex items-center group-hover:translate-x-0.5 transition-transform">
                  Track <ArrowUpRight className="h-3.5 w-3.5 ml-0.5" />
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">Propositions sent to other members</p>
            </div>
          </Link>
        </div>

        {/* Phase 6 & Phase 8 Recommendation Suite: Tabs & AI Layer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveRecommendationTab('ai')}
              className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeRecommendationTab === 'ai'
                  ? 'bg-gradient-to-r from-[#841d37] to-[#a32243] text-white shadow-sm'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Bot className="h-3.5 w-3.5 mr-1.5" />
              AI Picks For You
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] bg-white/20 text-white font-extrabold">NEW</span>
            </button>

            <button
              onClick={() => setActiveRecommendationTab('smart')}
              className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeRecommendationTab === 'smart'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Zap className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
              Smart Matches
            </button>

            <button
              onClick={() => setActiveRecommendationTab('both')}
              className={`flex items-center px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeRecommendationTab === 'both'
                  ? 'bg-slate-200 text-slate-900 font-bold'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              View Both
            </button>
          </div>

          <p className="text-[11px] text-slate-400 px-1 hidden md:block">
            Phase 8 Hybrid Recommendation Architecture (Phase 6 Rule Engine + AI Ranking)
          </p>
        </div>

        {/* Phase 8: AI Picks For You */}
        {(activeRecommendationTab === 'ai' || activeRecommendationTab === 'both') && (
          <AiRecommendationsSection
            onInitiateSwap={handleInitiateSwap}
            userListingCount={stats.myListings}
          />
        )}

        {/* Phase 6: Dynamic Smart Matches */}
        {(activeRecommendationTab === 'smart' || activeRecommendationTab === 'both') && (
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-2xl bg-[#841d37]/10 text-[#841d37] flex items-center justify-center font-bold">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">Smart Matches for Your Closet</h2>
                  <p className="text-xs text-slate-500">
                    Rule-based high-compatibility trade suggestions tailored to your wardrobe and location
                  </p>
                </div>
              </div>

              <Link href="/marketplace">
                <Button variant="ghost" size="sm" className="text-xs font-semibold text-[#841d37] hover:bg-rose-50">
                  Explore All Items <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            {isLoadingRecommendations ? (
              <div className="py-10 flex flex-col items-center justify-center space-y-2">
                <div className="h-6 w-6 border-2 border-[#841d37] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-500 font-medium">Finding compatible swap opportunities...</p>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="p-6 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                <p className="text-xs text-slate-600 font-medium">
                  No personalized match recommendations available yet.
                </p>
                <p className="text-[11px] text-slate-400">
                  List more clothing items in your closet with category, size, and swap value to activate smart recommendations.
                </p>
                <Link href="/listings/new" className="inline-block pt-1">
                  <Button size="sm" className="bg-[#841d37] hover:bg-[#731c33] text-white text-xs">
                    List an Item
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {recommendations.map((rec) => {
                  const { listing, matchScore, matchLevel, locationMatch, matchedWithMyItem } = rec;
                  const primaryImage = listing.images?.[0]?.imageUrl;

                  return (
                    <div
                      key={listing.id}
                      className="group rounded-2xl border border-slate-200/80 bg-white hover:border-[#841d37]/40 hover:shadow-md transition-all flex flex-col overflow-hidden"
                    >
                      <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                        {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={listing.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Shirt className="h-8 w-8" />
                          </div>
                        )}

                        <div className="absolute top-2 right-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              matchLevel === 'EXCELLENT'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : matchLevel === 'GREAT'
                                ? 'bg-teal-100 text-teal-800 border border-teal-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {matchScore}% • {matchLevel}
                          </span>
                        </div>

                        {locationMatch === 'SAME_CITY' && (
                          <div className="absolute bottom-2 left-2 bg-emerald-900/85 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center">
                            <MapPin className="h-2.5 w-2.5 mr-1 text-emerald-400" />
                            Local
                          </div>
                        )}
                      </div>

                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-[#841d37] uppercase tracking-wider block">
                            {listing.brand || 'Unbranded'} • {listing.size}
                          </span>
                          <Link
                            href={`/marketplace/${listing.id}`}
                            className="text-xs font-bold text-slate-900 line-clamp-1 hover:text-[#841d37] transition-colors"
                          >
                            {listing.title}
                          </Link>
                          <p className="text-[11px] font-semibold text-slate-600">
                            {listing.estimatedSwapValue !== null ? `₹${listing.estimatedSwapValue.toLocaleString()}` : 'Valued fair'}
                          </p>
                        </div>

                        {matchedWithMyItem && (
                          <div className="bg-slate-50 border border-slate-100 rounded-lg p-1.5 text-[10px] text-slate-600 truncate">
                            <span className="font-semibold text-slate-700">Pairs with:</span> {matchedWithMyItem.title}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <Link href={`/marketplace/${listing.id}`} className="block">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-[10px] font-semibold h-7 border-slate-200 hover:border-[#841d37] hover:text-[#841d37]"
                            >
                              View Item
                            </Button>
                          </Link>

                          <Button
                            size="sm"
                            onClick={() => handleInitiateSwap(listing)}
                            className="w-full text-[10px] font-semibold h-7 bg-slate-900 hover:bg-[#841d37] text-white"
                          >
                            Swap With This
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <Card className="shadow-sm border-slate-200/90 rounded-2xl md:col-span-1 flex flex-col justify-between overflow-hidden bg-white">
            <div>
              <CardHeader className="pb-4 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-posh-100 flex items-center justify-center text-posh-800 shadow-sm">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">Account Profile</CardTitle>
                    <CardDescription className="text-xs text-slate-500">Authenticated identity details</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3.5 p-6 text-sm">
                <div className="p-3.5 bg-slate-50/80 rounded-xl space-y-1 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">User ID</span>
                  <p className="font-mono text-xs text-slate-700 break-all">{user?.id}</p>
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-xl space-y-1 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Address</span>
                  <p className="font-medium text-slate-800">{user?.email}</p>
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-xl space-y-1 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role</span>
                  <div className="pt-0.5">
                    <Badge variant={user?.role === 'ADMIN' ? 'admin' : 'default'} className="bg-posh-50 text-posh-700 border-posh-200">
                      {user?.role}
                    </Badge>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-xl space-y-1 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Member Since</span>
                    <p className="text-xs font-medium text-slate-700">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Today'}
                    </p>
                  </div>
                  <Calendar className="h-4 w-4 text-slate-400" />
                </div>
              </CardContent>
            </div>

            <div className="p-6 pt-0">
              <Link href="/profile" className="w-full block">
                <Button
                  variant="outline"
                  className="w-full border-posh-200 text-posh-800 hover:bg-posh-50 hover:border-posh-400 font-medium transition-all"
                >
                  <UserCheck className="h-4 w-4 mr-2 text-posh-700" />
                  Edit Profile & Bio
                </Button>
              </Link>
            </div>
          </Card>

          {/* Quick Actions & Hub */}
          <Card className="shadow-sm border-slate-200/90 rounded-2xl md:col-span-2 overflow-hidden bg-white">
            <CardHeader className="pb-4 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-posh-100 flex items-center justify-center text-posh-800 shadow-sm">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">Quick Actions & Hub</CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Manage your wardrobe, exchanges, and discover new styles
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Hero Action: List a Clothing Item */}
                <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-[#841d37] to-[#5b1325] text-white shadow-md shadow-posh-900/10 space-y-3.5 flex flex-col justify-between transition-all hover:shadow-lg hover:scale-[1.01]">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2 text-rose-100 font-bold text-sm">
                      <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
                        <PlusCircle className="h-4 w-4" />
                      </div>
                      <span>List a Clothing Item</span>
                    </div>
                    <p className="text-xs text-rose-100/85 font-light leading-relaxed">
                      Upload fresh items with photos, condition, brand, and swap value to exchange with others.
                    </p>
                  </div>
                  <Link href="/listings/new">
                    <Button size="sm" className="w-full bg-white text-posh-900 hover:bg-rose-50 font-semibold shadow-sm">
                      Create New Listing
                    </Button>
                  </Link>
                </div>

                {/* My Closet Card */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-forest-300 hover:shadow-sm transition-all space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2 text-forest-800 font-bold text-sm">
                      <div className="h-7 w-7 rounded-lg bg-forest-100 flex items-center justify-center text-forest-800">
                        <Shirt className="h-4 w-4" />
                      </div>
                      <span>My Closet</span>
                    </div>
                    <p className="text-xs text-slate-500 font-light leading-relaxed">
                      View all your listed clothes, edit details, track availability, or remove items anytime.
                    </p>
                  </div>
                  <Link href="/my-listings">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-forest-200 text-forest-800 hover:bg-forest-50 hover:border-forest-400 font-medium"
                    >
                      Manage My Closet
                    </Button>
                  </Link>
                </div>

                {/* Swap Requests Card */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-amber-300 hover:shadow-sm transition-all space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
                      <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                        <ArrowLeftRight className="h-4 w-4" />
                      </div>
                      <span>Swap Requests</span>
                    </div>
                    <p className="text-xs text-slate-500 font-light leading-relaxed">
                      Review offers received from community members, accept or decline, and track sent requests.
                    </p>
                  </div>
                  <Link href="/swap-requests">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-amber-200 text-amber-800 hover:bg-amber-50 hover:border-amber-400 font-medium"
                    >
                      Review Swap Requests
                    </Button>
                  </Link>
                </div>

                {/* Explore Marketplace Card */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm transition-all space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2 text-indigo-800 font-bold text-sm">
                      <div className="h-7 w-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-800">
                        <ShoppingBag className="h-4 w-4" />
                      </div>
                      <span>Explore Marketplace</span>
                    </div>
                    <p className="text-xs text-slate-500 font-light leading-relaxed">
                      Browse clothing by department, size, and brand to find unique pre-loved fashion gems.
                    </p>
                  </div>
                  <Link href="/marketplace">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-indigo-200 text-indigo-800 hover:bg-indigo-50 hover:border-indigo-400 font-medium"
                    >
                      Browse Marketplace
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Phase 4 Swap Request Modal */}
      {swapTargetListing && (
        <SwapRequestModal
          isOpen={isSwapModalOpen}
          onClose={() => {
            setIsSwapModalOpen(false);
            setSwapTargetListing(null);
          }}
          requestedListing={swapTargetListing}
        />
      )}
    </AuthGuard>
  );
}
