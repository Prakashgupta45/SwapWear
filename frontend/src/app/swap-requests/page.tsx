'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { SwapRequest } from '../../types/swapRequest';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert } from '../../components/ui/alert';
import {
  RefreshCw,
  ArrowRight,
  ArrowLeftRight,
  Check,
  X,
  Clock,
  Shirt,
  Calendar,
  UserCheck,
  AlertCircle,
  Loader2,
  Inbox,
  Send,
  ExternalLink,
} from 'lucide-react';

export default function SwapRequestsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [sentRequests, setSentRequests] = useState<SwapRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<SwapRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const [sentRes, receivedRes] = await Promise.all([
        api.getSentSwapRequests(),
        api.getReceivedSwapRequests(),
      ]);

      if (sentRes.success && sentRes.data?.swapRequests) {
        setSentRequests(sentRes.data.swapRequests);
      }
      if (receivedRes.success && receivedRes.data?.swapRequests) {
        setReceivedRequests(receivedRes.data.swapRequests);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to load swap requests.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/swap-requests');
      return;
    }
    if (isAuthenticated) {
      fetchRequests();
    }
  }, [authLoading, isAuthenticated, router, fetchRequests]);

  const handleAccept = async (id: string) => {
    if (!confirm('Are you sure you want to accept this swap? Both items will be marked as RESERVED.')) {
      return;
    }

    try {
      setActionLoadingId(id);
      setFeedback(null);
      const res = await api.acceptSwapRequest(id);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Swap request accepted! Both garments are now reserved.',
        });
        await fetchRequests();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to accept swap request.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to decline this swap request?')) {
      return;
    }

    try {
      setActionLoadingId(id);
      setFeedback(null);
      const res = await api.rejectSwapRequest(id);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Swap request rejected.',
        });
        await fetchRequests();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to reject swap request.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to withdraw and cancel this swap request?')) {
      return;
    }

    try {
      setActionLoadingId(id);
      setFeedback(null);
      const res = await api.cancelSwapRequest(id);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Swap request cancelled successfully.',
        });
        await fetchRequests();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to cancel swap request.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-[10px] tracking-wide">
            <Clock className="h-3 w-3 mr-1 inline" />
            PENDING
          </Badge>
        );
      case 'ACCEPTED':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px] tracking-wide">
            <Check className="h-3 w-3 mr-1 inline" />
            ACCEPTED
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-bold text-[10px] tracking-wide">
            <X className="h-3 w-3 mr-1 inline" />
            DECLINED
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="outline" className="text-slate-500 border-slate-300 font-bold text-[10px] tracking-wide">
            CANCELLED
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingReceivedCount = receivedRequests.filter((r) => r.status === 'PENDING').length;
  const pendingSentCount = sentRequests.filter((r) => r.status === 'PENDING').length;

  if (authLoading || (isLoading && !sentRequests.length && !receivedRequests.length)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#841d37]" />
        <p className="text-xs font-semibold text-slate-500">Loading your swap exchanges...</p>
      </div>
    );
  }

  const currentList = activeTab === 'received' ? receivedRequests : sentRequests;

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-bold text-[#841d37] uppercase tracking-widest block">
            Phase 4 Clothing Exchange
          </span>
          <h1 className="text-3xl font-serif font-extrabold text-slate-900 tracking-tight">
            My Swap Requests
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your outgoing proposals and incoming exchange offers
          </p>
        </div>

        <Link href="/marketplace">
          <Button variant="outline" size="sm" className="rounded-full text-xs font-semibold border-slate-300">
            <Shirt className="h-3.5 w-3.5 mr-1.5" />
            Browse More Clothes
          </Button>
        </Link>
      </div>

      {/* Notifications / Alerts */}
      {feedback && (
        <Alert
          variant={feedback.type === 'error' ? 'destructive' : 'default'}
          className={feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : ''}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4 text-emerald-600" />
            )}
            <span className="text-xs font-medium">{feedback.message}</span>
          </div>
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('received')}
          className={`flex items-center space-x-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'received'
              ? 'border-[#841d37] text-[#841d37]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Inbox className="h-4 w-4" />
          <span>Received Offers</span>
          {pendingReceivedCount > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-[10px] font-bold bg-[#841d37] text-white rounded-full">
              {pendingReceivedCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sent')}
          className={`flex items-center space-x-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'sent'
              ? 'border-[#841d37] text-[#841d37]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="h-4 w-4" />
          <span>Sent Proposals</span>
          {pendingSentCount > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
              {pendingSentCount}
            </span>
          )}
        </button>
      </div>

      {/* Requests List */}
      {currentList.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl p-8 space-y-4">
          <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            {activeTab === 'received' ? <Inbox className="h-8 w-8" /> : <Send className="h-8 w-8" />}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-serif font-bold text-slate-800">
              {activeTab === 'received' ? 'No received swap offers yet' : 'No sent swap proposals yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {activeTab === 'received'
                ? 'When another member wants to swap for one of your listed items, their offer will appear here.'
                : 'Browse the marketplace to find pieces you love and offer items from your closet in exchange.'}
            </p>
          </div>
          <Link href="/marketplace">
            <Button size="sm" className="bg-[#841d37] hover:bg-[#731c33] text-white rounded-full text-xs">
              Explore Marketplace
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((req) => {
            const isPending = req.status === 'PENDING';
            const isProcessing = actionLoadingId === req.id;

            return (
              <div
                key={req.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  {/* Left: Swapped Items Comparison */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    {/* Item 1 */}
                    <div className="flex items-center space-x-3.5 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      <div className="h-16 w-16 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-200">
                        {activeTab === 'received' ? (
                          req.offeredListing.images?.[0]?.imageUrl ? (
                            <img
                              src={req.offeredListing.images[0].imageUrl}
                              alt={req.offeredListing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Shirt className="h-5 w-5" />
                            </div>
                          )
                        ) : (
                          req.requestedListing.images?.[0]?.imageUrl ? (
                            <img
                              src={req.requestedListing.images[0].imageUrl}
                              alt={req.requestedListing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Shirt className="h-5 w-5" />
                            </div>
                          )
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {activeTab === 'received' ? "They're Offering" : 'You Want'}
                        </span>
                        <h4 className="text-xs font-serif font-bold text-slate-900 truncate">
                          {activeTab === 'received' ? req.offeredListing.title : req.requestedListing.title}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Size {activeTab === 'received' ? req.offeredListing.size : req.requestedListing.size} •{' '}
                          <span className="text-emerald-700 font-bold">
                            {activeTab === 'received'
                              ? req.offeredListing.estimatedSwapValue !== null
                                ? `$${req.offeredListing.estimatedSwapValue.toFixed(2)}`
                                : 'No value'
                              : req.requestedListing.estimatedSwapValue !== null
                              ? `$${req.requestedListing.estimatedSwapValue.toFixed(2)}`
                              : 'No value'}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Exchange Icon / Divider */}
                    <div className="flex items-center space-x-3.5 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      <div className="h-16 w-16 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-200">
                        {activeTab === 'received' ? (
                          req.requestedListing.images?.[0]?.imageUrl ? (
                            <img
                              src={req.requestedListing.images[0].imageUrl}
                              alt={req.requestedListing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Shirt className="h-5 w-5" />
                            </div>
                          )
                        ) : (
                          req.offeredListing.images?.[0]?.imageUrl ? (
                            <img
                              src={req.offeredListing.images[0].imageUrl}
                              alt={req.offeredListing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Shirt className="h-5 w-5" />
                            </div>
                          )
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {activeTab === 'received' ? 'For Your Item' : 'You Offered'}
                        </span>
                        <h4 className="text-xs font-serif font-bold text-slate-900 truncate">
                          {activeTab === 'received' ? req.requestedListing.title : req.offeredListing.title}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Size {activeTab === 'received' ? req.requestedListing.size : req.offeredListing.size} •{' '}
                          <span className="text-emerald-700 font-bold">
                            {activeTab === 'received'
                              ? req.requestedListing.estimatedSwapValue !== null
                                ? `$${req.requestedListing.estimatedSwapValue.toFixed(2)}`
                                : 'No value'
                              : req.offeredListing.estimatedSwapValue !== null
                              ? `$${req.offeredListing.estimatedSwapValue.toFixed(2)}`
                              : 'No value'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Middle / Right: Details & Status */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(req.status)}
                      <span className="text-[11px] text-slate-400 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      {activeTab === 'received' ? (
                        <>From: <span className="font-bold text-slate-900">{req.requester.name}</span></>
                      ) : (
                        <>To: <span className="font-bold text-slate-900">{req.recipient.name}</span></>
                      )}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 pt-1">
                      <Link href={`/swap-requests/${req.id}`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-semibold rounded-full px-3">
                          Details
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>

                      {activeTab === 'received' && isPending && (
                        <>
                          <Button
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handleReject(req.id)}
                            variant="outline"
                            className="h-8 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-full px-3"
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handleAccept(req.id)}
                            className="h-8 text-xs font-semibold bg-[#841d37] hover:bg-[#731c33] text-white rounded-full px-3.5 shadow-2xs"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Accept
                              </>
                            )}
                          </Button>
                        </>
                      )}

                      {activeTab === 'sent' && isPending && (
                        <Button
                          size="sm"
                          disabled={isProcessing}
                          onClick={() => handleCancel(req.id)}
                          variant="outline"
                          className="h-8 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border-slate-300 rounded-full px-3"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            'Cancel Request'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Message preview if provided */}
                {req.message && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-start space-x-2 text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-lg">
                    <span className="font-semibold text-slate-700 flex-shrink-0">Note:</span>
                    <p className="italic text-slate-600 line-clamp-1">&ldquo;{req.message}&rdquo;</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
