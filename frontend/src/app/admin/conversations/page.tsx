'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../../lib/api';
import { AdminConversation, AdminPagination } from '../../../types/admin';
import {
  MessageSquare,
  Lock,
  Eye,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  Loader2,
  ShieldCheck,
  User,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restricted Audit Modal
  const [auditConversationId, setAuditConversationId] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<any>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const fetchConversations = useCallback(async (pageToLoad = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getAdminConversations({
        page: pageToLoad,
        limit: 20,
      });

      if (res.success && res.data) {
        setConversations(res.data.conversations);
        setPagination(res.data.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations(1);
  }, [fetchConversations]);

  const handleOpenAudit = async (conversationId: string) => {
    setAuditConversationId(conversationId);
    setIsAuditing(true);
    setAuditData(null);
    try {
      const res = await api.getAdminConversationAudit(conversationId, { page: 1, limit: 50 });
      if (res.success && res.data) {
        setAuditData(res.data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to load conversation audit stream.');
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center">
            <MessageSquare className="h-6 w-6 mr-2 text-rose-400" />
            Chat & Negotiation Monitoring
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Privacy-preserving metadata monitoring of real-time swap communications.
          </p>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-start space-x-3 text-xs text-slate-300">
        <Lock className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white block mb-0.5">Privacy Protection Enforced:</span>
          <span>
            Private chat contents are masked by default in all admin list views. Administrator inspection of
            message logs is strictly restricted to an on-demand audit modal for dispute resolution purposes.
          </span>
        </div>
      </div>

      {/* ── Conversations Table ────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
            <p className="text-xs">Loading conversation metadata...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 space-y-3">
            <AlertCircle className="h-8 w-8 mx-auto" />
            <p className="text-xs">{error}</p>
            <Button onClick={() => fetchConversations(1)} variant="outline" size="sm" className="text-xs">
              Retry
            </Button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <MessageSquare className="h-8 w-8 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No active conversations found</p>
            <p className="text-xs text-slate-500">Conversations are initialized once a swap request is accepted.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Channel ID</th>
                  <th className="py-3.5 px-4">Participants</th>
                  <th className="py-3.5 px-4">Swap Context</th>
                  <th className="py-3.5 px-4">Message Count</th>
                  <th className="py-3.5 px-4">Last Activity</th>
                  <th className="py-3.5 px-4 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {conversations.map((c) => {
                  const lastActive = new Date(c.updatedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                        #{c.id.slice(0, 8)}
                      </td>

                      {/* Participants */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-200">
                            {c.swapRequest?.requester?.name || 'Requester'}
                          </p>
                          <p className="font-semibold text-slate-400 text-[11px]">
                            ↔ {c.swapRequest?.recipient?.name || 'Recipient'}
                          </p>
                        </div>
                      </td>

                      {/* Swap Context */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <p className="font-semibold text-slate-200 truncate">
                          {`"${c.swapRequest?.offeredListing?.title || ''}" ⇄ "${c.swapRequest?.requestedListing?.title || ''}"`}
                        </p>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">
                          {c.swapRequest?.status || 'ACCEPTED'}
                        </span>
                      </td>

                      {/* Message Count */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800/50">
                          {c._count.messages} messages
                        </span>
                      </td>

                      {/* Last Activity */}
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{lastActive}</td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          onClick={() => handleOpenAudit(c.id)}
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Audit Log
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
        {!isLoading && conversations.length > 0 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {conversations.length} of {pagination.total} channels (Page {pagination.page} of{' '}
              {pagination.totalPages})
            </span>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => fetchConversations(pagination.page - 1)}
                disabled={pagination.page <= 1}
                variant="outline"
                size="sm"
                className="h-7 text-xs border-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                onClick={() => fetchConversations(pagination.page + 1)}
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

      {/* ── Restricted Conversation Audit Modal ────────────────────────────── */}
      {auditConversationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">Dispute Moderation Audit</h3>
              </div>
              <button
                onClick={() => setAuditConversationId(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isAuditing ? (
              <div className="py-16 text-center text-slate-400 space-y-2 flex-1 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                <p className="text-xs">Decrypting and loading audit thread...</p>
              </div>
            ) : auditData ? (
              <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                {/* Channel Header Context */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                  <p>
                    <span className="text-slate-500">Between:</span>{' '}
                    <span className="font-semibold text-white">
                      {auditData.conversation?.swapRequest?.requester?.name}
                    </span>{' '}
                    and{' '}
                    <span className="font-semibold text-white">
                      {auditData.conversation?.swapRequest?.recipient?.name}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Trade: {`"${auditData.conversation?.swapRequest?.offeredListing?.title || ''}" ⇄ "${auditData.conversation?.swapRequest?.requestedListing?.title || ''}"`}
                  </p>
                </div>

                {/* Messages stream */}
                <div className="space-y-2.5">
                  {auditData.messages?.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-8">
                      No messages exchanged in this conversation channel yet.
                    </p>
                  ) : (
                    auditData.messages?.map((msg: any) => {
                      const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      return (
                        <div
                          key={msg.id}
                          className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs space-y-1"
                        >
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span className="font-bold text-slate-300">{msg.sender?.name || 'User'}</span>
                            <span className="font-mono">{timeStr}</span>
                          </div>
                          <p className="text-slate-200 text-xs leading-relaxed">{msg.content}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">Failed to load audit data.</p>
            )}

            <div className="pt-2 border-t border-slate-800 flex justify-end flex-shrink-0">
              <Button
                onClick={() => setAuditConversationId(null)}
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
