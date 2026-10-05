'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../../lib/api';
import { AdminSwap, AdminPagination } from '../../../types/admin';
import {
  RefreshCw,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Shirt,
  ArrowRight,
  X,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';

export default function AdminSwapsPage() {
  const [swaps, setSwaps] = useState<AdminSwap[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inspection modal
  const [selectedSwap, setSelectedSwap] = useState<AdminSwap | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);

  const fetchSwaps = useCallback(
    async (pageToLoad = 1) => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await api.getAdminSwaps({
          page: pageToLoad,
          limit: 20,
          search: search.trim() || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        });

        if (res.success && res.data) {
          setSwaps(res.data.swaps);
          setPagination(res.data.pagination);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load swap records.');
      } finally {
        setIsLoading(false);
      }
    },
    [search, statusFilter]
  );

  useEffect(() => {
    fetchSwaps(1);
  }, [fetchSwaps]);

  const handleInspect = async (swap: AdminSwap) => {
    setSelectedSwap(swap);
    setInspectModalOpen(true);
    try {
      const res = await api.getAdminSwapById(swap.id);
      if (res.success && res.data?.swap) {
        setSelectedSwap(res.data.swap);
      }
    } catch {
      // keep basic
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            ACCEPTED
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/50">
            <Clock className="h-3 w-3 mr-1" />
            PENDING
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/50">
            <XCircle className="h-3 w-3 mr-1" />
            REJECTED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            CANCELLED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-950/80 text-blue-300 border border-blue-800/50">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            COMPLETED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center">
            <RefreshCw className="h-6 w-6 mr-2 text-rose-400" />
            Swap Activity Monitoring
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time circular exchange audit, trade state transitions, and counterpart tracking.
          </p>
        </div>
      </div>

      {/* ── Search & Filter Controls ───────────────────────────────────────── */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by participant name, email, or item title..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <Button
            onClick={() => fetchSwaps(1)}
            size="sm"
            className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
          >
            Filter
          </Button>
        </div>
      </div>

      {/* ── Swaps Table ────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
            <p className="text-xs">Loading swap trades from database...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 space-y-3">
            <AlertCircle className="h-8 w-8 mx-auto" />
            <p className="text-xs">{error}</p>
            <Button onClick={() => fetchSwaps(1)} variant="outline" size="sm" className="text-xs">
              Retry
            </Button>
          </div>
        ) : swaps.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="h-8 w-8 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No swap requests found</p>
            <p className="text-xs text-slate-500">Try adjusting your status filter or search keyword.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Swap ID</th>
                  <th className="py-3.5 px-4">Participants</th>
                  <th className="py-3.5 px-4">Offered Listing</th>
                  <th className="py-3.5 px-4">Requested Listing</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Last Activity</th>
                  <th className="py-3.5 px-4 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {swaps.map((s) => {
                  const updatedStr = new Date(s.updatedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                        #{s.id.slice(0, 8)}
                      </td>

                      {/* Requester -> Recipient */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-200">
                            <span className="text-slate-400">From:</span> {s.requester.name}
                          </p>
                          <p className="font-semibold text-slate-300">
                            <span className="text-slate-400">To:</span> {s.recipient.name}
                          </p>
                        </div>
                      </td>

                      {/* Offered */}
                      <td className="py-3.5 px-4 max-w-[180px]">
                        <p className="font-bold text-slate-200 truncate">{s.offeredListing.title}</p>
                        <span className="text-[11px] text-slate-400">
                          ${s.offeredListing.estimatedSwapValue || 0} • {s.offeredListing.category}
                        </span>
                      </td>

                      {/* Requested */}
                      <td className="py-3.5 px-4 max-w-[180px]">
                        <p className="font-bold text-slate-200 truncate">{s.requestedListing.title}</p>
                        <span className="text-[11px] text-slate-400">
                          ${s.requestedListing.estimatedSwapValue || 0} • {s.requestedListing.category}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">{getStatusBadge(s.status)}</td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{updatedStr}</td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          onClick={() => handleInspect(s)}
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        {!isLoading && swaps.length > 0 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {swaps.length} of {pagination.total} swaps (Page {pagination.page} of{' '}
              {pagination.totalPages})
            </span>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => fetchSwaps(pagination.page - 1)}
                disabled={pagination.page <= 1}
                variant="outline"
                size="sm"
                className="h-7 text-xs border-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                onClick={() => fetchSwaps(pagination.page + 1)}
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

      {/* ── Inspect Swap Modal ─────────────────────────────────────────────── */}
      {inspectModalOpen && selectedSwap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>Swap Trade Audit</span>
                  <span className="font-mono text-xs text-slate-400">#{selectedSwap.id.slice(0, 8)}</span>
                </h3>
              </div>
              <button
                onClick={() => setInspectModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status & Timestamps */}
            <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Status:</span>
                {getStatusBadge(selectedSwap.status)}
              </div>
              <div className="text-slate-400 font-mono text-[11px]">
                Created: {new Date(selectedSwap.createdAt).toLocaleDateString()}
              </div>
            </div>

            {/* Pair Comparison Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Offered */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">
                  Offered by {selectedSwap.requester.name}
                </span>
                <p className="font-bold text-slate-200 text-sm truncate">{selectedSwap.offeredListing.title}</p>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Category: {selectedSwap.offeredListing.category}</span>
                  <span className="font-bold text-white">${selectedSwap.offeredListing.estimatedSwapValue}</span>
                </div>
                <p className="text-[11px] font-mono text-slate-500 truncate">{selectedSwap.requester.email}</p>
              </div>

              {/* Requested */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                  Requested from {selectedSwap.recipient.name}
                </span>
                <p className="font-bold text-slate-200 text-sm truncate">{selectedSwap.requestedListing.title}</p>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Category: {selectedSwap.requestedListing.category}</span>
                  <span className="font-bold text-white">${selectedSwap.requestedListing.estimatedSwapValue}</span>
                </div>
                <p className="text-[11px] font-mono text-slate-500 truncate">{selectedSwap.recipient.email}</p>
              </div>
            </div>

            {/* Note / Message */}
            {selectedSwap.message && (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 block mb-1 font-semibold">Requester Note:</span>
                <p className="text-slate-300 italic">{`"${selectedSwap.message}"`}</p>
              </div>
            )}

            {/* Conversation Metadata */}
            {selectedSwap.conversation && (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-300">
                  <MessageSquare className="h-4 w-4 text-purple-400" />
                  <span>Real-time Negotiation Channel Active</span>
                </div>
                <span className="font-semibold text-rose-400">
                  {selectedSwap.conversation._count?.messages || 0} messages
                </span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button
                onClick={() => setInspectModalOpen(false)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Close Audit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
