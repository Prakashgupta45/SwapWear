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
import { Shirt, ArrowLeft, MapPin, User as UserIcon, Calendar, DollarSign, Tag, Trash2, Loader2 } from 'lucide-react';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const listingId = params?.id as string;

  const [listing, setListing] = useState<ClothingListing | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    async function loadListing() {
      if (!listingId) return;
      try {
        setIsLoading(true);
        const res = await api.getListingById(listingId);
        if (res.success && res.data?.listing) {
          setListing(res.data.listing);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load listing.');
      } finally {
        setIsLoading(false);
      }
    }
    loadListing();
  }, [listingId]);

  const handleDelete = async () => {
    if (!listing) return;
    if (!window.confirm(`Are you sure you want to delete "${listing.title}"?`)) return;

    setIsDeleting(true);
    try {
      const res = await api.deleteListing(listing.id);
      if (res.success) {
        router.push('/my-listings');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete listing.');
    } finally {
      setIsDeleting(false);
    }
  };

  const isOwner = user && listing && user.id === listing.ownerId;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-forest-700" />
        <p className="text-sm text-slate-500">Loading item details...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-4">
        <Alert variant="destructive">{error || 'Listing not found.'}</Alert>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        {isOwner && (
          <Button variant="outline" size="sm" onClick={handleDelete} isLoading={isDeleting} className="text-red-600 border-red-200">
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete Listing
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          {listing.images && listing.images.length > 0 ? (
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
              <img
                src={listing.images[0].imageUrl}
                alt={listing.title}
                className="w-full h-96 object-cover"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-100 h-96 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Shirt className="h-16 w-16" />
              <span className="text-sm">No Images Provided</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Badge variant={listing.status === 'AVAILABLE' ? 'default' : 'outline'}>
                {listing.status}
              </Badge>
              <Badge variant="outline">{listing.category}</Badge>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{listing.title}</h1>
            {listing.brand && (
              <p className="text-sm font-semibold text-forest-700">Brand: {listing.brand}</p>
            )}
          </div>

          <Card className="shadow-sm border-slate-200">
            <CardContent className="p-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Size</span>
                  <span className="font-bold text-slate-800">{listing.size}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Condition</span>
                  <span className="font-bold text-slate-800">{listing.condition.replace('_', ' ')}</span>
                </div>
              </div>

              {listing.estimatedSwapValue && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Est. Swap Value</span>
                  <span className="font-extrabold text-emerald-900 text-base">${listing.estimatedSwapValue.toFixed(2)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-base">Description</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {listing.description || 'No description provided.'}
            </p>
          </div>

          {/* Owner info */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Garment Owner</h3>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center font-bold">
                {listing.owner.name[0]}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{listing.owner.name}</p>
                {(listing.owner.city || listing.owner.state) && (
                  <p className="text-xs text-slate-500 flex items-center mt-0.5">
                    <MapPin className="h-3 w-3 mr-1 text-forest-700" />
                    {listing.owner.city}{listing.owner.city && listing.owner.state ? ', ' : ''}{listing.owner.state}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
