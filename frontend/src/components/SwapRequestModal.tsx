'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import { ClothingListing } from '../types/listing';
import { Button } from './ui/button';
import { Alert } from './ui/alert';
import { Badge } from './ui/badge';
import {
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Shirt,
  ArrowRight,
  Loader2,
  PlusCircle,
} from 'lucide-react';

interface SwapRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestedListing: ClothingListing;
}

export function SwapRequestModal({
  isOpen,
  onClose,
  requestedListing,
}: SwapRequestModalProps) {
  const router = useRouter();
  const [myListings, setMyListings] = useState<ClothingListing[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('Would you be interested in this swap?');
  const [isLoadingListings, setIsLoadingListings] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    async function fetchMyListings() {
      try {
        setIsLoadingListings(true);
        setError(null);
        setSuccess(false);
        const res = await api.getMyListings();
        if (mounted && res.success && res.data?.listings) {
          // Filter only available items and exclude the requested item if somehow listed
          const available = res.data.listings.filter(
            (item: ClothingListing) =>
              item.status === 'AVAILABLE' && item.id !== requestedListing.id
          );
          setMyListings(available);
          if (available.length > 0) {
            setSelectedListingId(available[0].id);
          }
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to load your listings.');
        }
      } finally {
        if (mounted) {
          setIsLoadingListings(false);
        }
      }
    }

    fetchMyListings();

    return () => {
      mounted = false;
    };
  }, [isOpen, requestedListing.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListingId) {
      setError('Please select one of your items to offer in exchange.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await api.createSwapRequest({
        requestedListingId: requestedListing.id,
        offeredListingId: selectedListingId,
        message: message.trim() || undefined,
      });

      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.message || 'Failed to send swap request.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while sending the swap request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedListing = myListings.find((i) => i.id === selectedListingId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#841d37] text-white flex items-center justify-center shadow-xs">
              <RefreshCw className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-slate-900">Request a Swap</h2>
              <p className="text-xs text-slate-500">Offer one of your pre-loved garments in exchange</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {success ? (
            <div className="py-8 text-center space-y-4">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-serif font-bold text-slate-900">
                  Swap Request Sent!
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Your offer has been submitted to <span className="font-semibold text-slate-900">{requestedListing.owner.name}</span>.
                  You will be notified once they review and accept or reject your proposal.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="rounded-full px-5 text-xs font-semibold"
                >
                  Back to Marketplace
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onClose();
                    router.push('/swap-requests');
                  }}
                  className="bg-[#841d37] hover:bg-[#731c33] text-white rounded-full px-5 text-xs font-semibold shadow-xs"
                >
                  View My Swaps
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="text-xs">{error}</span>
                </Alert>
              )}

              {/* Step 1: Requested Item Overview */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  You are requesting:
                </span>
                <div className="flex items-center space-x-4 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                  <div className="h-16 w-16 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-200">
                    {requestedListing.images?.[0]?.imageUrl ? (
                      <img
                        src={requestedListing.images[0].imageUrl}
                        alt={requestedListing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Shirt className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#841d37] uppercase tracking-wider truncate">
                      {requestedListing.brand || 'Unbranded'}
                    </p>
                    <h4 className="text-sm font-serif font-bold text-slate-900 truncate">
                      {requestedListing.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500 font-medium">Size: {requestedListing.size}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-emerald-700 font-bold">
                        {requestedListing.estimatedSwapValue !== null
                          ? `$${requestedListing.estimatedSwapValue.toFixed(2)}`
                          : 'Value not set'}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500">By {requestedListing.owner.name}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Offered Item Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Choose an item from your closet to offer:
                  </span>
                  <Link
                    href="/listings/new"
                    className="text-xs font-semibold text-[#841d37] hover:underline flex items-center"
                    target="_blank"
                  >
                    <PlusCircle className="h-3 w-3 mr-1" />
                    List New Item
                  </Link>
                </div>

                {isLoadingListings ? (
                  <div className="py-8 flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin text-[#841d37]" />
                    <p className="text-xs text-slate-400 font-medium">Loading your closet...</p>
                  </div>
                ) : myListings.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-3">
                    <Shirt className="h-8 w-8 text-slate-400 mx-auto" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-700">No available listings in your closet</p>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                        You need at least one available listing to propose a swap exchange.
                      </p>
                    </div>
                    <Link href="/listings/new">
                      <Button size="sm" type="button" className="bg-[#841d37] hover:bg-[#731c33] text-white text-xs">
                        <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                        Create a Listing
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                    {myListings.map((item) => {
                      const isSelected = selectedListingId === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedListingId(item.id)}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center space-x-3 text-left ${
                            isSelected
                              ? 'border-[#841d37] bg-[#841d37]/5 shadow-xs ring-1 ring-[#841d37]'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="h-14 w-14 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                            {item.images?.[0]?.imageUrl ? (
                              <img
                                src={item.images[0].imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Shirt className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-slate-900 truncate">
                              {item.title}
                            </h5>
                            <p className="text-[11px] text-slate-500 truncate">
                              Size {item.size} • {item.condition.replace('_', ' ')}
                            </p>
                            <p className="text-[11px] font-bold text-emerald-700">
                              {item.estimatedSwapValue !== null
                                ? `$${item.estimatedSwapValue.toFixed(2)}`
                                : 'No value set'}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="h-5 w-5 text-[#841d37] flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 3: Message to Recipient */}
              <div className="space-y-1.5">
                <label htmlFor="swap-message" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Add a note to {requestedListing.owner.name} (Optional):
                </label>
                <textarea
                  id="swap-message"
                  rows={2}
                  maxLength={1000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Would you be interested in this swap? Let's trade!"
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#841d37] focus:ring-1 focus:ring-[#841d37] transition-colors resize-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-full px-4 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !selectedListingId || myListings.length === 0}
                  className="bg-[#841d37] hover:bg-[#731c33] text-white rounded-full px-6 text-xs font-semibold shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 mr-2" />
                      Send Swap Request
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
