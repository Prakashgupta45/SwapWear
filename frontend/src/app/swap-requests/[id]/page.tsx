'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { SwapRequest } from '../../../types/swapRequest';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Alert } from '../../../components/ui/alert';
import {
  ArrowLeft,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Shirt,
  Calendar,
  User,
  MapPin,
  MessageSquare,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function SwapRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const swapRequestId = params?.id as string;

  const [swapRequest, setSwapRequest] = useState<SwapRequest | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!swapRequestId) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getSwapRequestById(swapRequestId);
      if (res.success && res.data?.swapRequest) {
        setSwapRequest(res.data.swapRequest);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load swap request details.');
    } finally {
      setIsLoading(false);
    }
  }, [swapRequestId]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=/swap-requests/${swapRequestId}`);
      return;
    }
    if (isAuthenticated) {
      fetchDetail();
    }
  }, [authLoading, isAuthenticated, router, swapRequestId, fetchDetail]);

  const handleAccept = async () => {
    if (!confirm('Are you sure you want to accept this swap? Both listings will be marked as RESERVED.')) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      const res = await api.acceptSwapRequest(swapRequestId);
      if (res.success) {
        setSuccessMessage('Swap accepted! Both garments are now reserved.');
        await fetchDetail();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to accept swap request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('Are you sure you want to decline this swap proposal?')) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      const res = await api.rejectSwapRequest(swapRequestId);
      if (res.success) {
        setSuccessMessage('Swap request has been declined.');
        await fetchDetail();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reject swap request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to withdraw this swap proposal?')) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      const res = await api.cancelSwapRequest(swapRequestId);
      if (res.success) {
        setSuccessMessage('Swap request cancelled.');
        await fetchDetail();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to cancel swap request.');
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#841d37]" />
        <p className="text-xs font-semibold text-slate-500">Loading swap proposal details...</p>
      </div>
    );
  }

  if (error || !swapRequest) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 space-y-4">
        <Alert variant="destructive">{error || 'Swap request not found.'}</Alert>
        <Link href="/swap-requests">
          <Button variant="outline" size="sm" className="rounded-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Swap Requests
          </Button>
        </Link>
      </div>
    );
  }

  const isRequester = user?.id === swapRequest.requesterId;
  const isRecipient = user?.id === swapRequest.recipientId;
  const isPending = swapRequest.status === 'PENDING';

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-8">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-3">
          <Link href="/swap-requests">
            <Button variant="ghost" size="sm" className="rounded-full h-8 px-2 text-xs font-semibold">
              <ArrowLeft className="h-4 w-4 mr-1" />
              All Swaps
            </Button>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs text-slate-500 font-mono">Proposal #{swapRequest.id.slice(0, 8)}</span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400 flex items-center">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            Proposed on {new Date(swapRequest.createdAt).toLocaleDateString()}
          </span>
          <Badge
            className={`font-bold text-xs uppercase px-3 py-1 ${
              swapRequest.status === 'ACCEPTED'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : swapRequest.status === 'REJECTED'
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : swapRequest.status === 'PENDING'
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            {swapRequest.status}
          </Badge>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-semibold">{successMessage}</span>
          </div>
        </Alert>
      )}

      {/* Status Highlights Banner */}
      {swapRequest.status === 'ACCEPTED' && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start space-x-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 space-y-1">
            <p className="font-bold text-sm">Swap Request Confirmed!</p>
            <p>
              Both garments have been automatically marked as <span className="font-bold uppercase">RESERVED</span> so
              they cannot be claimed by other members.
            </p>
          </div>
        </div>
      )}

      {swapRequest.status === 'REJECTED' && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3">
          <XCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900 space-y-1">
            <p className="font-bold text-sm">Proposal Declined</p>
            <p>This swap request was declined by the recipient. Both listings remain in their standard status.</p>
          </div>
        </div>
      )}

      {swapRequest.status === 'CANCELLED' && (
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex items-start space-x-3">
          <Clock className="h-5 w-5 text-slate-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 space-y-1">
            <p className="font-bold text-sm">Request Cancelled</p>
            <p>This swap request was withdrawn and cancelled by the requester.</p>
          </div>
        </div>
      )}

      {/* Side-by-side Item Comparison */}
      <div className="space-y-4">
        <h2 className="text-lg font-serif font-bold text-slate-900 flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-[#841d37]" />
          Garment Exchange Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {/* Offered Item */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Offered Item ({isRequester ? 'From You' : `From ${swapRequest.requester.name}`})
              </span>
              <Badge variant="outline" className="text-[10px]">
                {swapRequest.offeredListing.status}
              </Badge>
            </div>

            <div className="aspect-4/3 w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
              {swapRequest.offeredListing.images?.[0]?.imageUrl ? (
                <img
                  src={swapRequest.offeredListing.images[0].imageUrl}
                  alt={swapRequest.offeredListing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Shirt className="h-10 w-10" />
                  <span className="text-xs">No image provided</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-[#841d37] uppercase tracking-wider block">
                {swapRequest.offeredListing.brand || 'Unbranded'}
              </span>
              <h3 className="text-lg font-serif font-bold text-slate-900">
                {swapRequest.offeredListing.title}
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Size</span>
                  <span className="font-semibold text-slate-800">{swapRequest.offeredListing.size}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Condition</span>
                  <span className="font-semibold text-slate-800">
                    {swapRequest.offeredListing.condition.replace('_', ' ')}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Category</span>
                  <span className="font-semibold text-slate-800">{swapRequest.offeredListing.category}</span>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 font-bold block uppercase">Est. Value</span>
                  <span className="font-bold text-emerald-900">
                    {swapRequest.offeredListing.estimatedSwapValue !== null
                      ? `$${swapRequest.offeredListing.estimatedSwapValue.toFixed(2)}`
                      : 'Not set'}
                  </span>
                </div>
              </div>

              <Link
                href={`/marketplace/${swapRequest.offeredListing.id}`}
                target="_blank"
                className="text-xs font-semibold text-[#841d37] hover:underline inline-flex items-center pt-2"
              >
                View full marketplace listing
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </div>

          {/* Requested Item */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Requested Item ({isRecipient ? 'Your Item' : `From ${swapRequest.recipient.name}`})
              </span>
              <Badge variant="outline" className="text-[10px]">
                {swapRequest.requestedListing.status}
              </Badge>
            </div>

            <div className="aspect-4/3 w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
              {swapRequest.requestedListing.images?.[0]?.imageUrl ? (
                <img
                  src={swapRequest.requestedListing.images[0].imageUrl}
                  alt={swapRequest.requestedListing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Shirt className="h-10 w-10" />
                  <span className="text-xs">No image provided</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-[#841d37] uppercase tracking-wider block">
                {swapRequest.requestedListing.brand || 'Unbranded'}
              </span>
              <h3 className="text-lg font-serif font-bold text-slate-900">
                {swapRequest.requestedListing.title}
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Size</span>
                  <span className="font-semibold text-slate-800">{swapRequest.requestedListing.size}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Condition</span>
                  <span className="font-semibold text-slate-800">
                    {swapRequest.requestedListing.condition.replace('_', ' ')}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Category</span>
                  <span className="font-semibold text-slate-800">{swapRequest.requestedListing.category}</span>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 font-bold block uppercase">Est. Value</span>
                  <span className="font-bold text-emerald-900">
                    {swapRequest.requestedListing.estimatedSwapValue !== null
                      ? `$${swapRequest.requestedListing.estimatedSwapValue.toFixed(2)}`
                      : 'Not set'}
                  </span>
                </div>
              </div>

              <Link
                href={`/marketplace/${swapRequest.requestedListing.id}`}
                target="_blank"
                className="text-xs font-semibold text-[#841d37] hover:underline inline-flex items-center pt-2"
              >
                View full marketplace listing
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Proposal Notes & Participant Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Note / Message */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2 text-slate-700">
            <MessageSquare className="h-4 w-4 text-[#841d37]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Proposal Message</h4>
          </div>
          {swapRequest.message ? (
            <p className="text-sm text-slate-700 italic bg-slate-50/70 p-4 rounded-xl border border-slate-100 leading-relaxed">
              &ldquo;{swapRequest.message}&rdquo;
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">No custom message attached to this swap proposal.</p>
          )}
        </div>

        {/* Participant Overview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Participants</h4>
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 block font-semibold">Proposer</span>
              <p className="font-bold text-slate-900">{swapRequest.requester.name}</p>
              {swapRequest.requester.city && (
                <p className="text-[11px] text-slate-500 flex items-center">
                  <MapPin className="h-3 w-3 mr-1 text-[#841d37]" />
                  {[swapRequest.requester.city, swapRequest.requester.state].filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            <div className="h-px bg-slate-100" />

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 block font-semibold">Recipient</span>
              <p className="font-bold text-slate-900">{swapRequest.recipient.name}</p>
              {swapRequest.recipient.city && (
                <p className="text-[11px] text-slate-500 flex items-center">
                  <MapPin className="h-3 w-3 mr-1 text-[#841d37]" />
                  {[swapRequest.recipient.city, swapRequest.recipient.state].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role-Specific Actions Bar */}
      {isPending && (
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              {isRecipient ? 'Respond to this Swap Offer' : 'Manage your Pending Proposal'}
            </h4>
            <p className="text-xs text-slate-500">
              {isRecipient
                ? 'Accepting will immediately reserve both items for the exchange.'
                : 'You can withdraw this proposal as long as it has not yet been accepted.'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {isRecipient && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={actionLoading}
                  onClick={handleReject}
                  className="rounded-full text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 px-4"
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Decline Swap
                </Button>
                <Button
                  size="sm"
                  disabled={actionLoading}
                  onClick={handleAccept}
                  className="bg-[#841d37] hover:bg-[#731c33] text-white rounded-full text-xs font-semibold px-5 shadow-xs"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Accept Swap
                    </>
                  )}
                </Button>
              </>
            )}

            {isRequester && (
              <Button
                variant="outline"
                size="sm"
                disabled={actionLoading}
                onClick={handleCancel}
                className="rounded-full text-xs font-semibold text-slate-700 hover:text-rose-600 hover:bg-rose-50 border-slate-300 px-4"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Cancel Proposal'
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
