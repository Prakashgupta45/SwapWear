'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';
import { AiPersonalizedRecommendation } from '../types/ai';
import { ClothingListing } from '../types/listing';
import { Button } from './ui/button';
import {
  Sparkles,
  Bot,
  Zap,
  ArrowRightLeft,
  MapPin,
  ExternalLink,
  PlusCircle,
  ShoppingBag,
  RefreshCw,
  Shirt,
  Quote,
} from 'lucide-react';

interface AiRecommendationsSectionProps {
  onInitiateSwap?: (targetListing: ClothingListing) => void;
  userListingCount?: number;
}

export default function AiRecommendationsSection({
  onInitiateSwap,
  userListingCount = 0,
}: AiRecommendationsSectionProps) {
  const [recommendations, setRecommendations] = useState<AiPersonalizedRecommendation[]>([]);
  const [isAiActive, setIsAiActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorFallback, setErrorFallback] = useState<boolean>(false);

  const fetchPhase6Fallback = useCallback(async () => {
    try {
      setErrorFallback(true);
      const res = await api.getUserRecommendations({ limit: 6 });
      if (res.success && res.data?.recommendations) {
        const mapped: AiPersonalizedRecommendation[] = res.data.recommendations.map((item) => ({
          ...item,
          isAiRecommended: false,
          aiReason: null,
          phase6Score: item.matchScore,
        }));
        setRecommendations(mapped);
        setIsAiActive(false);
      }
    } catch {
      setRecommendations([]);
    }
  }, []);

  const fetchRecommendations = useCallback(
    async (bypassCache: boolean = false) => {
      try {
        if (bypassCache) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setErrorFallback(false);

        const res = await api.getAiRecommendations({
          limit: 6,
          minScore: 45,
          bypassCache,
        });

        if (res.success && res.data) {
          setRecommendations(res.data.recommendations || []);
          setIsAiActive(Boolean(res.data.isAiActive));
        } else {
          // Fallback to Phase 6 smart matches
          await fetchPhase6Fallback();
        }
      } catch {
        await fetchPhase6Fallback();
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [fetchPhase6Fallback]
  );

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 'Valued fairly';
    return `₹${val.toLocaleString()}`;
  };

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#841d37] to-[#5b1325] text-white flex items-center justify-center font-bold shadow-sm shadow-rose-900/10">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">AI Picks For You</h2>
              {isAiActive && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-[#841d37] border border-rose-200/70">
                  <Sparkles className="h-2.5 w-2.5 mr-1 text-[#841d37]" />
                  AI POWERED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Personalized swap recommendations based on your closet, sizing, values, and swap activity
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRecommendations(true)}
            disabled={isLoading || isRefreshing}
            className="text-xs font-medium border-slate-200 text-slate-700 hover:bg-slate-50 h-8"
          >
            <RefreshCw className={`h-3 w-3 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Analyzing...' : 'Refresh AI'}
          </Button>

          <Link href="/marketplace">
            <Button variant="ghost" size="sm" className="text-xs font-semibold text-[#841d37] hover:bg-rose-50 h-8">
              Explore All <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="h-10 w-10 rounded-2xl bg-rose-100 flex items-center justify-center text-[#841d37] animate-pulse">
              <Sparkles className="h-5 w-5 animate-spin" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-slate-800">Finding your best swap matches...</p>
            <p className="text-xs text-slate-400">Evaluating closet compatibility, sizes, and swap parity</p>
          </div>
          {/* Skeleton Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full pt-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-2xl border border-slate-100 p-4 space-y-3 bg-slate-50/60 animate-pulse">
                <div className="aspect-4/3 bg-slate-200/80 rounded-xl" />
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                <div className="h-12 bg-slate-200 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      ) : recommendations.length === 0 ? (
        /* Empty State */
        userListingCount === 0 ? (
          <div className="p-8 bg-slate-50/80 border border-dashed border-slate-200 rounded-2xl text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-rose-50 text-[#841d37] mx-auto flex items-center justify-center">
              <Shirt className="h-6 w-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <p className="text-sm font-bold text-slate-800">
                Add your first clothing listing to get personalized AI swap recommendations.
              </p>
              <p className="text-xs text-slate-500">
                Once you list clothes with categories, sizes, and estimated values, our AI will match you with the best available trades.
              </p>
            </div>
            <Link href="/listings/new" className="inline-block pt-1">
              <Button size="sm" className="bg-[#841d37] hover:bg-[#731c33] text-white text-xs font-semibold px-4 shadow-sm">
                <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                Add Clothing
              </Button>
            </Link>
          </div>
        ) : (
          <div className="p-8 bg-slate-50/80 border border-dashed border-slate-200 rounded-2xl text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <p className="text-sm font-bold text-slate-800">No personalized matches yet.</p>
              <p className="text-xs text-slate-500">
                Check back soon as other community members list new clothes or explore current marketplace pieces.
              </p>
            </div>
            <Link href="/marketplace" className="inline-block pt-1">
              <Button size="sm" variant="outline" className="border-slate-300 text-slate-700 text-xs font-semibold">
                Browse Marketplace
              </Button>
            </Link>
          </div>
        )
      ) : (
        /* Recommendations Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recommendations.map((rec) => {
            const { listing, matchScore, matchLevel, locationMatch, matchedWithMyItem, isAiRecommended, aiReason, reasons } = rec;
            const primaryImage = listing.images?.[0]?.imageUrl;
            const explanation = aiReason || (reasons && reasons[0]) || 'Strong style & value swap match';

            return (
              <div
                key={listing.id}
                className="group rounded-2xl border border-slate-200/90 bg-white hover:border-[#841d37]/50 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden"
              >
                {/* Image Banner */}
                <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                  {primaryImage ? (
                    <img
                      src={primaryImage}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Shirt className="h-10 w-10" />
                    </div>
                  )}

                  {/* Badges Overlay */}
                  <div className="absolute top-2.5 left-2.5">
                    {isAiRecommended ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#841d37] text-white shadow-sm">
                        <Bot className="h-3 w-3 mr-1" />
                        🤖 AI Recommended
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900 text-white shadow-sm">
                        <Zap className="h-3 w-3 mr-1 text-amber-400" />
                        Smart Match
                      </span>
                    )}
                  </div>

                  {/* Match Score Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold shadow-sm ${
                        matchScore >= 80
                          ? 'bg-emerald-600 text-white'
                          : matchScore >= 70
                          ? 'bg-teal-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      {matchScore}% Match
                    </span>
                  </div>

                  {/* Location Tag */}
                  {listing.owner?.city && (
                    <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center">
                      <MapPin className="h-2.5 w-2.5 mr-1 text-rose-300" />
                      {listing.owner.city}
                      {listing.owner.state ? `, ${listing.owner.state}` : ''}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold text-[#841d37] uppercase tracking-wider">
                        {listing.brand || 'Unbranded'} • Size {listing.size}
                      </span>
                      <span className="text-[11px] font-bold text-slate-900">
                        {formatCurrency(listing.estimatedSwapValue)}
                      </span>
                    </div>

                    <Link
                      href={`/marketplace/${listing.id}`}
                      className="text-sm font-bold text-slate-900 hover:text-[#841d37] transition-colors line-clamp-1 block"
                    >
                      {listing.title}
                    </Link>

                    {/* AI Explanation Quote Box */}
                    <div className="p-2.5 bg-rose-50/60 rounded-xl border border-rose-100 text-[11px] text-slate-700 relative">
                      <div className="flex items-start space-x-1.5">
                        <Quote className="h-3 w-3 text-[#841d37] shrink-0 mt-0.5 rotate-180 opacity-70" />
                        <p className="italic leading-relaxed text-slate-700 font-normal line-clamp-2">
                          &ldquo;{explanation}&rdquo;
                        </p>
                      </div>
                    </div>

                    {/* Closet pairing indicator */}
                    {matchedWithMyItem && (
                      <div className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-[10px] text-slate-500 truncate flex items-center">
                        <Shirt className="h-2.5 w-2.5 mr-1 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-600 mr-1">Pairs with:</span>
                        <span className="truncate">{matchedWithMyItem.title}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <Link href={`/marketplace/${listing.id}`} className="block">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs font-semibold h-8 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      >
                        View Item
                      </Button>
                    </Link>

                    <Button
                      size="sm"
                      onClick={() => onInitiateSwap && onInitiateSwap(listing)}
                      className="w-full text-xs font-semibold h-8 bg-slate-900 hover:bg-[#841d37] text-white transition-colors"
                    >
                      <ArrowRightLeft className="h-3 w-3 mr-1" />
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
  );
}
