'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { ClothingListing } from '../../../types/listing';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Alert } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import {
  Shirt,
  ArrowLeft,
  MapPin,
  Loader2,
  RefreshCw,
} from 'lucide-react';

import { CURATED_SHOWCASE_LISTINGS } from '../../../lib/curatedListings';
import { SwapRequestModal } from '../../../components/SwapRequestModal';

export default function MarketplaceListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const listingId = params?.id as string;

  const [listing, setListing] = useState<ClothingListing | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadListing() {
      if (!listingId) return;
      try {
        setIsLoading(true);
        const res = await api.getListingById(listingId);
        if (res.success && res.data?.listing) {
          setListing(res.data.listing);
          return;
        }
      } catch (err: any) {
        // Check if item is in curated showcase listings
        const curatedMatch = CURATED_SHOWCASE_LISTINGS.find((item) => item.id === listingId);
        if (curatedMatch) {
          setListing(curatedMatch);
          setError(null);
          return;
        }
        setError(err.message || 'Listing not found.');
      } finally {
        setIsLoading(false);
      }
    }
    loadListing();
  }, [listingId]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#841d37]" />
        <p className="text-xs font-semibold text-slate-500">Loading item details...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 space-y-4">
        <Alert variant="destructive">{error || 'Listing not found.'}</Alert>
        <Link href="/marketplace">
          <Button variant="outline" size="sm" className="rounded-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
        </Link>
      </div>
    );
  }

  const isOwner = user && listing && user.id === listing.ownerId;
  const images = listing.images || [];
  const currentImageUrl = images[selectedImageIndex]?.imageUrl;

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-8">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-xs font-semibold">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Listings
        </Button>

        <div className="flex items-center space-x-2">
          <Badge variant={listing.status === 'AVAILABLE' ? 'default' : 'outline'}>
            {listing.status}
          </Badge>
          <Badge variant="outline" className="text-xs uppercase">
            {listing.category}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-4/5 w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200/80 shadow-xs relative">
            {currentImageUrl ? (
              <img
                src={currentImageUrl}
                alt={listing.title}
                fetchPriority="high"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Shirt className="h-16 w-16" />
                <span className="text-xs">No Photo Provided</span>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="flex items-center space-x-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  aria-label={`View photo ${idx + 1} of ${images.length}`}
                  aria-pressed={selectedImageIndex === idx}
                  className={`h-20 w-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    selectedImageIndex === idx ? 'border-[#841d37] ring-2 ring-[#841d37]/20' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.imageUrl} alt={`${listing.title}, photo ${idx + 1}`} loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Item Details & Actions */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            {/* Title & Brand */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#841d37] uppercase tracking-widest block">
                {listing.brand || 'Unbranded'}
              </span>
              <h1 className="text-3xl font-serif font-extrabold text-slate-900 tracking-tight leading-tight">
                {listing.title}
              </h1>
            </div>

            {/* Price & Specs Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Size</span>
                <span className="font-extrabold text-slate-800 text-sm">{listing.size}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Color</span>
                <span className="font-extrabold text-slate-800 text-sm">{listing.color || 'Not specified'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Condition</span>
                <span className="font-extrabold text-slate-800 text-sm">{listing.condition.replace('_', ' ')}</span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-lg space-y-0.5">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Est. Value</span>
                <span className="font-extrabold text-emerald-900 text-sm">
                  {listing.estimatedSwapValue !== null ? `$${listing.estimatedSwapValue.toFixed(2)}` : 'Not set'}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Garment Description</h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/60 p-4 rounded-lg border border-slate-100">
                {listing.description || 'No detailed description provided by the seller.'}
              </p>
            </div>

            {/* Owner Info Card */}
            <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Listed By Swapper</span>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-[#841d37] text-white flex items-center justify-center font-bold text-sm">
                    {listing.owner.name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{listing.owner.name}</p>
                    {listing.owner.city && (
                      <p className="text-xs text-slate-500 flex items-center mt-0.5">
                        <MapPin className="h-3 w-3 mr-1 text-[#841d37]" />
                        {[listing.owner.city, listing.owner.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                <Badge variant="outline" className="text-[10px]">
                  Verified Member
                </Badge>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            {isOwner ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
                You are the owner of this garment listing. You can manage or delete it in{' '}
                <Link href="/my-listings" className="underline font-bold">
                  My Listings
                </Link>.
              </div>
            ) : listing.status !== 'AVAILABLE' ? (
              <div className="space-y-2">
                <Button
                  size="lg"
                  disabled
                  className="w-full bg-slate-300 text-slate-500 font-bold py-3.5 rounded-lg text-sm cursor-not-allowed"
                >
                  Item {listing.status}
                </Button>
                <p className="text-center text-xs text-slate-400">
                  This item is currently {listing.status.toLowerCase()} and cannot be requested for swap.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  size="lg"
                  onClick={() => {
                    if (!user) {
                      router.push(`/login?redirect=/marketplace/${listingId}`);
                      return;
                    }
                    setIsSwapModalOpen(true);
                  }}
                  className="w-full bg-[#841d37] hover:bg-[#731c33] text-white font-bold py-3.5 rounded-lg shadow-md text-sm transition-all"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Request Swap
                </Button>
                <p className="text-center text-xs text-slate-500">
                  Propose an exchange with an item from your closet
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Phase 4 Swap Request Modal */}
      {listing && (
        <SwapRequestModal
          isOpen={isSwapModalOpen}
          onClose={() => setIsSwapModalOpen(false)}
          requestedListing={listing}
        />
      )}
    </div>
  );
}

