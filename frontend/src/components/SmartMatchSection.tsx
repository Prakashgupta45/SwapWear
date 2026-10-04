'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';
import { SwapMatchItem } from '../types/match';
import { ClothingListing } from '../types/listing';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Zap,
  ArrowRightLeft,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Shirt,
  Info,
  SlidersHorizontal,
} from 'lucide-react';

interface SmartMatchSectionProps {
  targetListing: ClothingListing;
  onInitiateSwap?: (targetListing: ClothingListing) => void;
}

export default function SmartMatchSection({
  targetListing,
  onInitiateSwap,
}: SmartMatchSectionProps) {
  const [matches, setMatches] = useState<SwapMatchItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterCityOnly, setFilterCityOnly] = useState<boolean>(false);
  const [filterMinScore, setFilterMinScore] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    async function fetchMatches() {
      try {
        setIsLoading(true);
        const res = await api.getListingMatches(targetListing.id, {
          cityOnly: filterCityOnly,
          minScore: filterMinScore,
          limit: 8,
        });

        if (isMounted && res.success && res.data?.matches) {
          setMatches(res.data.matches);
        }
      } catch (err) {
        // Fallback gracefully if error
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (targetListing?.id) {
      fetchMatches();
    }

    return () => {
      isMounted = false;
    };
  }, [targetListing.id, filterCityOnly, filterMinScore]);

  const getMatchBadge = (level: string, score: number) => {
    switch (level) {
      case 'EXCELLENT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
            {score}% • EXCELLENT
          </span>
        );
      case 'GREAT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
            <Zap className="h-3 w-3 mr-1 text-teal-600" />
            {score}% • GREAT
          </span>
        );
      case 'GOOD':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            {score}% • GOOD
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
            {score}% • FAIR
          </span>
        );
    }
  };

  return (
    <section className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6">
      {/* Header with Title and Filter Options */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-[#841d37]">
            <Zap className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Phase 6 Smart Match Engine
            </span>
          </div>
          <h2 className="text-xl font-serif font-bold text-slate-900 mt-0.5">
            Top Compatible Swap Matches
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranked dynamically by value parity, category outfit pairing, condition, and local proximity.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto [scrollbar-width:none]">
          <button
            onClick={() => {
              setFilterMinScore(0);
              setFilterCityOnly(false);
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
              filterMinScore === 0 && !filterCityOnly
                ? 'bg-[#841d37] text-white border-[#841d37]'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            All Matches
          </button>

          <button
            onClick={() => setFilterMinScore(filterMinScore === 80 ? 0 : 80)}
            className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all whitespace-nowrap ${
              filterMinScore === 80
                ? 'bg-[#841d37] text-white border-[#841d37]'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            High Compatibility (80%+)
          </button>

          {targetListing.owner?.city && (
            <button
              onClick={() => setFilterCityOnly(!filterCityOnly)}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all whitespace-nowrap flex items-center ${
                filterCityOnly
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <MapPin className="h-3 w-3 mr-1" />
              In {targetListing.owner.city}
            </button>
          )}
        </div>
      </div>

      {/* Matches Grid */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="h-7 w-7 animate-spin text-[#841d37]" />
          <p className="text-xs font-semibold text-slate-500">Calculating swap compatibility...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="py-8 text-center bg-slate-50/70 rounded-2xl p-6 border border-dashed border-slate-200 space-y-2">
          <p className="text-xs text-slate-600 font-medium">
            No compatible swap listings match the selected filters right now.
          </p>
          <button
            onClick={() => {
              setFilterMinScore(0);
              setFilterCityOnly(false);
            }}
            className="text-xs font-bold text-[#841d37] hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {matches.map((matchItem) => {
            const { listing, matchScore, matchLevel, locationMatch, reasons, valueDifference } = matchItem;
            const primaryImage = listing.images?.[0]?.imageUrl;

            return (
              <div
                key={listing.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-[#841d37]/40 hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                {/* Image and Badges */}
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

                  {/* Top-Right Match Score Badge */}
                  <div className="absolute top-2 right-2">
                    {getMatchBadge(matchLevel, matchScore)}
                  </div>

                  {/* Location Badge */}
                  {locationMatch === 'SAME_CITY' && (
                    <div className="absolute bottom-2 left-2 bg-emerald-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center">
                      <MapPin className="h-2.5 w-2.5 mr-1 text-emerald-400" />
                      Local City
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#841d37] uppercase tracking-wider block">
                      {listing.brand || 'Unbranded'} • {listing.size}
                    </span>
                    <Link
                      href={`/marketplace/${listing.id}`}
                      target="_blank"
                      className="text-sm font-bold text-slate-900 line-clamp-1 hover:text-[#841d37] transition-colors"
                    >
                      {listing.title}
                    </Link>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-semibold text-slate-700">
                        {listing.estimatedSwapValue !== null
                          ? `$${listing.estimatedSwapValue.toFixed(0)}`
                          : 'Value Unset'}
                      </span>
                      {valueDifference !== null && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          {valueDifference === 0 ? 'Exact Value' : `±$${valueDifference.toFixed(0)} diff`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Top Match Reason Chip */}
                  {reasons && reasons[0] && (
                    <div className="bg-slate-50 rounded-lg p-1.5 text-[10px] text-slate-600 font-medium line-clamp-1 flex items-center border border-slate-100">
                      <Info className="h-3 w-3 mr-1 text-[#841d37] shrink-0" />
                      <span className="truncate">{reasons[0]}</span>
                    </div>
                  )}

                  {/* Propose Swap Button */}
                  {onInitiateSwap && (
                    <Button
                      size="sm"
                      onClick={() => onInitiateSwap(listing)}
                      className="w-full text-xs font-semibold rounded-xl bg-slate-900 hover:bg-[#841d37] text-white transition-colors h-8"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
                      Swap With This
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
