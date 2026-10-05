'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../../lib/api';
import { AdminListing, AdminPagination } from '../../../types/admin';
import {
  Shirt,
  Search,
  Filter,
  Eye,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  MapPin,
  Calendar,
  DollarSign,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';

export default function AdminListingsPage() {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [conditionFilter, setConditionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [selectedListing, setSelectedListing] = useState<AdminListing | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [modModalOpen, setModModalOpen] = useState(false);
  const [isModerating, setIsModerating] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const fetchListings = useCallback(
    async (pageToLoad = 1) => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await api.getAdminListings({
          page: pageToLoad,
          limit: 20,
          search: search.trim() || undefined,
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
          condition: conditionFilter !== 'ALL' ? conditionFilter : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        });

        if (res.success && res.data) {
          setListings(res.data.listings);
          setPagination(res.data.pagination);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load platform listings.');
      } finally {
        setIsLoading(false);
      }
    },
    [search, categoryFilter, conditionFilter, statusFilter]
  );

  useEffect(() => {
    fetchListings(1);
  }, [fetchListings]);

  const handleInspect = async (listing: AdminListing) => {
    setSelectedListing(listing);
    setInspectModalOpen(true);
    try {
      const res = await api.getAdminListingById(listing.id);
      if (res.success && res.data?.listing) {
        setSelectedListing(res.data.listing);
      }
    } catch {
      // keep basic
    }
  };

  const handleOpenModModal = (listing: AdminListing) => {
    setSelectedListing(listing);
    setModModalOpen(true);
    setFeedbackMessage(null);
  };

  const handleConfirmModeration = async () => {
    if (!selectedListing) return;
    const action = selectedListing.status === 'AVAILABLE' ? 'REMOVE' : 'RESTORE';

    try {
      setIsModerating(true);
      const res = await api.moderateListing(selectedListing.id, action);
      if (res.success) {
        setFeedbackMessage(res.message);
        setModModalOpen(false);
        fetchListings(pagination.page);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to moderate listing.');
    } finally {
      setIsModerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center">
            <Shirt className="h-6 w-6 mr-2 text-rose-400" />
            Clothing Listings & Moderation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit circular marketplace inventory, examine clothing items, and moderate inappropriate content.
          </p>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Search & Filter Controls ───────────────────────────────────────── */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col lg:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, brand, color, or description..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Categories</option>
            <option value="TOPWEAR">Topwear</option>
            <option value="BOTTOMWEAR">Bottomwear</option>
            <option value="DRESS">Dress</option>
            <option value="OUTERWEAR">Outerwear</option>
            <option value="FOOTWEAR">Footwear</option>
            <option value="ACCESSORIES">Accessories</option>
          </select>

          {/* Condition */}
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Conditions</option>
            <option value="NEW">New</option>
            <option value="LIKE_NEW">Like New</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved / Moderated</option>
            <option value="SWAPPED">Swapped</option>
          </select>

          <Button
            onClick={() => fetchListings(1)}
            size="sm"
            className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
          >
            Filter
          </Button>
        </div>
      </div>

      {/* ── Listings Table ─────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
            <p className="text-xs">Querying listings inventory...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 space-y-3">
            <AlertCircle className="h-8 w-8 mx-auto" />
            <p className="text-xs">{error}</p>
            <Button onClick={() => fetchListings(1)} variant="outline" size="sm" className="text-xs">
              Retry
            </Button>
          </div>
        ) : listings.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Shirt className="h-8 w-8 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No listings match criteria</p>
            <p className="text-xs text-slate-500">Try changing your filters or searching another keyword.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Item Details</th>
                  <th className="py-3.5 px-4">Category & Brand</th>
                  <th className="py-3.5 px-4">Owner</th>
                  <th className="py-3.5 px-4">Swap Value</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Listed Date</th>
                  <th className="py-3.5 px-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {listings.map((item) => {
                  const thumbnail = item.images?.[0]?.imageUrl;
                  const isModerated = item.status === 'RESERVED';
                  const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Thumbnail & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3 max-w-xs">
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={item.title}
                              className="h-11 w-11 object-cover rounded-lg bg-slate-800 flex-shrink-0 border border-slate-700/60"
                            />
                          ) : (
                            <div className="h-11 w-11 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 flex-shrink-0">
                              <Shirt className="h-5 w-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-200 truncate">{item.title}</p>
                            <span className="text-[11px] text-slate-400">
                              Size {item.size} • {item.condition}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category & Brand */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-200">{item.category}</p>
                        <p className="text-[11px] text-slate-400">{item.brand || 'Unbranded'}</p>
                      </td>

                      {/* Owner */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-200">{item.owner?.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {item.owner?.city || item.owner?.state
                            ? `${item.owner.city || ''}, ${item.owner.state || ''}`
                            : 'Location hidden'}
                        </p>
                      </td>

                      {/* Value */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                        ${item.estimatedSwapValue || 0}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {item.status === 'AVAILABLE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
                            AVAILABLE
                          </span>
                        ) : item.status === 'RESERVED' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/50">
                            RESERVED / MODERATED
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-950/80 text-blue-300 border border-blue-800/50">
                            SWAPPED
                          </span>
                        )}
                      </td>

                      {/* Listed Date */}
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{dateStr}</td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            onClick={() => handleInspect(item)}
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Inspect
                          </Button>

                          {item.status === 'AVAILABLE' ? (
                            <Button
                              onClick={() => handleOpenModModal(item)}
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-red-900/60 bg-red-950/40 text-red-300 hover:bg-red-900/80 hover:text-white"
                            >
                              <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                              Remove
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleOpenModModal(item)}
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-emerald-900/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/80 hover:text-white"
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1" />
                              Restore
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        {!isLoading && listings.length > 0 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {listings.length} of {pagination.total} listings (Page {pagination.page} of{' '}
              {pagination.totalPages})
            </span>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => fetchListings(pagination.page - 1)}
                disabled={pagination.page <= 1}
                variant="outline"
                size="sm"
                className="h-7 text-xs border-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                onClick={() => fetchListings(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                variant="outline"
                size="sm"
                className="h-7 text-xs border-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Inspect Listing Modal ──────────────────────────────────────────── */}
      {inspectModalOpen && selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white truncate flex-1">{selectedListing.title}</h3>
              <button
                onClick={() => setInspectModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Images carousel / grid */}
            {selectedListing.images && selectedListing.images.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {selectedListing.images.map((img, i) => (
                  <img
                    key={i}
                    src={img.imageUrl}
                    alt={selectedListing.title}
                    className="h-36 w-full object-cover rounded-xl bg-slate-800 border border-slate-800"
                  />
                ))}
              </div>
            )}

            {/* Key info badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block uppercase">Category</span>
                <span className="font-bold text-slate-200">{selectedListing.category}</span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block uppercase">Size</span>
                <span className="font-bold text-slate-200">{selectedListing.size}</span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block uppercase">Condition</span>
                <span className="font-bold text-slate-200">{selectedListing.condition}</span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block uppercase">Swap Value</span>
                <span className="font-bold text-emerald-400">${selectedListing.estimatedSwapValue || 0}</span>
              </div>
            </div>

            {selectedListing.description && (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 block mb-1 font-semibold">Description:</span>
                <p className="text-slate-300 leading-relaxed">{selectedListing.description}</p>
              </div>
            )}

            {/* Owner & History */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Owner:</span>
                <span className="font-semibold text-slate-200">{selectedListing.owner?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Owner Email:</span>
                <span className="font-mono text-slate-300">{selectedListing.owner?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Offered / Requested in Swaps:</span>
                <span className="font-semibold text-rose-400">
                  {(selectedListing._count?.offeredInSwaps || 0) +
                    (selectedListing._count?.requestedInSwaps || 0)}{' '}
                  swap offers
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={() => setInspectModalOpen(false)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Moderation Confirmation Modal ──────────────────────────────────── */}
      {modModalOpen && selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-400">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-base font-bold text-white">Listing Moderation Action</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedListing.status === 'AVAILABLE' ? (
                <>
                  You are about to moderate and remove{' '}
                  <span className="font-bold text-white">{`"${selectedListing.title}"`}</span> from the public
                  marketplace.
                </>
              ) : (
                <>
                  You are about to restore{' '}
                  <span className="font-bold text-white">{`"${selectedListing.title}"`}</span> back to active
                  discovery in the public marketplace.
                </>
              )}
            </p>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-200">Reversible Architecture Note:</p>
              <p>
                Removing transitions the status to RESERVED. This safely conceals it from public search and
                category browsing without breaking foreign keys or active swap histories.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button
                onClick={() => setModModalOpen(false)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmModeration}
                disabled={isModerating}
                size="sm"
                className={`text-xs font-bold text-white ${
                  selectedListing.status === 'AVAILABLE'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isModerating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                {selectedListing.status === 'AVAILABLE' ? 'Confirm Removal' : 'Confirm Restore'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
