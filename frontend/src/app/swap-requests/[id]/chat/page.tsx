'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../context/AuthContext';
import { api } from '../../../../lib/api';
import { getSocket } from '../../../../lib/socket';
import { ChatMessage } from '../../../../types/chat';
import { SwapRequest } from '../../../../types/swapRequest';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Alert } from '../../../../components/ui/alert';
import {
  ArrowLeft,
  Send,
  Loader2,
  Check,
  CheckCheck,
  Shirt,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  MapPin,
  Clock,
  ShieldCheck,
  Info,
} from 'lucide-react';

const NEGOTIATION_STARTERS = [
  'Hi! Can we arrange a local handoff?',
  'Is the garment washed, cleaned, and ready?',
  'What days and times work best for you?',
  'Could you confirm the fit and dimensions?',
];

export default function SwapChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const swapRequestId = params?.id as string;

  const [swapRequest, setSwapRequest] = useState<SwapRequest | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOtherTyping, setIsOtherTyping] = useState<boolean>(false);
  const [otherTypingName, setOtherTypingName] = useState<string>('');
  const [isOtherOnline, setIsOtherOnline] = useState<boolean>(false);
  const [showItemDetails, setShowItemDetails] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMoreOlder, setHasMoreOlder] = useState<boolean>(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isRequester = user && swapRequest ? user.id === swapRequest.requesterId : false;
  const otherUser = swapRequest
    ? isRequester
      ? swapRequest.recipient
      : swapRequest.requester
    : null;

  // Auto-scroll to bottom of messages
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // Fetch initial messages and conversation metadata
  const loadInitialData = useCallback(async () => {
    if (!swapRequestId) return;
    try {
      setIsLoading(true);
      setError(null);

      // Verify conversation exists / load conversation info
      const [convRes, msgsRes] = await Promise.all([
        api.getConversation(swapRequestId),
        api.getMessages(swapRequestId, 1, 50),
      ]);

      if (convRes.success && convRes.data.conversation.swapRequest) {
        setSwapRequest(convRes.data.conversation.swapRequest);
      } else if (msgsRes.success && msgsRes.data.swapRequest) {
        setSwapRequest(msgsRes.data.swapRequest);
      }

      if (msgsRes.success && msgsRes.data.messages) {
        setMessages(msgsRes.data.messages);
        setPage(1);
        setHasMoreOlder(msgsRes.data.pagination.totalPages > 1);
      }

      // Mark unread incoming messages as read upon opening
      await api.markConversationAsRead(swapRequestId).catch(() => {});
    } catch (err: any) {
      setError(err.message || 'Failed to load conversation. Make sure the swap is accepted.');
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollToBottom(false), 150);
    }
  }, [swapRequestId, scrollToBottom]);

  // Load older messages if available
  const handleLoadOlder = async () => {
    if (isLoadingOlder || !hasMoreOlder) return;
    try {
      setIsLoadingOlder(true);
      const nextPage = page + 1;
      const res = await api.getMessages(swapRequestId, nextPage, 50);

      if (res.success && res.data.messages.length > 0) {
        setMessages((prev) => [...res.data.messages, ...prev]);
        setPage(nextPage);
        setHasMoreOlder(res.data.pagination.totalPages > nextPage);
      } else {
        setHasMoreOlder(false);
      }
    } catch (err: any) {
      // Ignore pagination errors
    } finally {
      setIsLoadingOlder(false);
    }
  };

  // Auth gate
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=/swap-requests/${swapRequestId}/chat`);
      return;
    }
    if (isAuthenticated && swapRequestId) {
      loadInitialData();
    }
  }, [authLoading, isAuthenticated, router, swapRequestId, loadInitialData]);

  // Socket.IO real-time event listeners
  useEffect(() => {
    if (!isAuthenticated || !swapRequestId) return;

    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    // Join room
    socket.emit('join:swap', { swapRequestId }, (res: any) => {
      if (res?.success && res.onlineUserIds && otherUser) {
        setIsOtherOnline(res.onlineUserIds.includes(otherUser.id));
      }
    });

    // Listen for incoming messages
    const handleMessageReceived = (newMessage: ChatMessage) => {
      setMessages((prev) => {
        // Prevent duplicate messages if already present
        if (prev.some((m) => m.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });

      // If sent by the other user, mark as read immediately
      if (user && newMessage.senderId !== user.id) {
        api.markMessageAsRead(newMessage.id).catch(() => {});
      }

      setTimeout(() => scrollToBottom(true), 50);
    };

    // Presence updates
    const handlePresenceUpdate = (data: { swapRequestId: string; onlineUserIds: string[] }) => {
      if (data.swapRequestId === swapRequestId && otherUser) {
        setIsOtherOnline(data.onlineUserIds.includes(otherUser.id));
      }
    };

    // Typing start
    const handleTypingStart = (data: { swapRequestId: string; userId: string; userName: string }) => {
      if (data.swapRequestId === swapRequestId && user && data.userId !== user.id) {
        setIsOtherTyping(true);
        setOtherTypingName(data.userName || 'User');
        setTimeout(() => scrollToBottom(true), 50);
      }
    };

    // Typing stop
    const handleTypingStop = (data: { swapRequestId: string; userId: string }) => {
      if (data.swapRequestId === swapRequestId && user && data.userId !== user.id) {
        setIsOtherTyping(false);
      }
    };

    // Message read receipts
    const handleMessageRead = (data: { messageId: string; readAt: string }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === data.messageId ? { ...msg, readAt: data.readAt } : msg))
      );
    };

    const handleConversationRead = (data: { swapRequestId: string; readAt: string }) => {
      if (data.swapRequestId === swapRequestId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.senderId === user?.id && !msg.readAt ? { ...msg, readAt: data.readAt } : msg
          )
        );
      }
    };

    socket.on('message:received', handleMessageReceived);
    socket.on('presence:update', handlePresenceUpdate);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('message:read', handleMessageRead);
    socket.on('conversation:read', handleConversationRead);

    return () => {
      socket.emit('leave:swap', { swapRequestId });
      socket.off('message:received', handleMessageReceived);
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('message:read', handleMessageRead);
      socket.off('conversation:read', handleConversationRead);
    };
  }, [isAuthenticated, swapRequestId, user, otherUser, scrollToBottom]);

  // Handle typing indicator debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);

    const socket = getSocket();
    if (!socket.connected) return;

    socket.emit('typing:start', { swapRequestId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { swapRequestId });
    }, 2500);
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    try {
      setIsSending(true);

      // Stop typing immediately
      const socket = getSocket();
      if (socket.connected) {
        socket.emit('typing:stop', { swapRequestId });
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      setInputText('');

      const res = await api.sendMessage(swapRequestId, trimmed);
      if (res.success && res.data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === res.data.message.id)) {
            return prev;
          }
          return [...prev, res.data.message];
        });
        setTimeout(() => scrollToBottom(true), 50);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle keyboard submission (Enter sends, Shift+Enter newlines)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Quick chip click
  const handleChipClick = (text: string) => {
    setInputText(text);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-9 w-9 animate-spin text-[#841d37]" />
        <p className="text-xs font-semibold text-slate-500">Connecting to secure swap chat...</p>
      </div>
    );
  }

  if (error && !swapRequest) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 space-y-4">
        <Alert variant="destructive">{error}</Alert>
        <div className="flex items-center space-x-3">
          <Link href="/swap-requests">
            <Button variant="outline" size="sm" className="rounded-full">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Swap Requests
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={loadInitialData}
            className="rounded-full bg-[#841d37] hover:bg-[#731c33] text-white"
          >
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full p-0 sm:px-4 sm:py-4 md:py-6 flex flex-col h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-5rem)]">
      {/* 1. Header with back link, Participant Information, and Swap Summary */}
      <div className="bg-white border-b sm:border sm:rounded-t-2xl border-slate-200 px-3 sm:px-4 py-2.5 sm:py-3 shadow-2xs shrink-0 z-10">
        <div className="flex items-center justify-between gap-2">
          {/* Back & User Info */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <Link
              href={`/swap-requests/${swapRequestId}`}
              className="p-1.5 sm:p-2 -ml-1 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
              title="Back to proposal details"
              aria-label="Back to proposal details"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
              <div className="relative shrink-0">
                {otherUser && (otherUser as any).avatarUrl ? (
                  <img
                    src={(otherUser as any).avatarUrl}
                    alt={otherUser.name}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#841d37] text-white font-bold text-xs sm:text-sm flex items-center justify-center">
                    {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                {/* Live Online Dot */}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-white ${
                    isOtherOnline ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                  title={isOtherOnline ? 'Online' : 'Offline'}
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate max-w-[130px] xs:max-w-[170px] sm:max-w-[240px]">
                    {otherUser?.name || 'Swap Partner'}
                  </h2>
                  <Badge
                    variant="outline"
                    className={`text-[9px] sm:text-[10px] font-semibold uppercase px-1.5 sm:px-2 py-0.2 shrink-0 ${
                      swapRequest?.status === 'ACCEPTED'
                        ? 'border-emerald-200 text-emerald-800 bg-emerald-50'
                        : 'border-slate-200 text-slate-700 bg-slate-50'
                    }`}
                  >
                    {swapRequest?.status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-1.5 text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                      isOtherOnline ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                  <span>{isOtherOnline ? 'Online now' : 'Offline'}</span>
                  {otherUser?.city && (
                    <>
                      <span>•</span>
                      <span className="flex items-center truncate">
                        <MapPin className="h-3 w-3 mr-0.5 text-slate-400 shrink-0" />
                        <span className="truncate">{otherUser.city}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Toggle Swapped Items Summary */}
          <button
            onClick={() => setShowItemDetails(!showItemDetails)}
            className="flex items-center space-x-1 text-xs font-semibold text-[#841d37] hover:text-[#6a152b] px-2.5 py-1.5 rounded-lg bg-rose-50/60 hover:bg-rose-100/60 transition-colors shrink-0"
            aria-expanded={showItemDetails}
            aria-label="Toggle swap items preview"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Items</span>
            {showItemDetails ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Expandable Swap Items Preview Banner (Responsive Grid) */}
        {showItemDetails && swapRequest && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 text-xs bg-slate-50/80 p-2.5 sm:p-3 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Offered Item */}
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                {swapRequest.offeredListing.images?.[0]?.imageUrl ? (
                  <img
                    src={swapRequest.offeredListing.images[0].imageUrl}
                    alt={swapRequest.offeredListing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Shirt className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 block uppercase truncate">
                  {isRequester ? 'Your Item' : `${swapRequest.requester.name}'s Item`}
                </span>
                <p className="font-semibold text-slate-900 truncate text-xs">
                  {swapRequest.offeredListing.title}
                </p>
                <span className="text-[10px] sm:text-[11px] text-slate-500 block truncate">
                  Size {swapRequest.offeredListing.size} • {swapRequest.offeredListing.condition.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Requested Item */}
            <div className="flex items-center space-x-2.5 min-w-0 xs:border-l xs:border-slate-200 xs:pl-3 pt-2 xs:pt-0 border-t xs:border-t-0 border-slate-200/60">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                {swapRequest.requestedListing.images?.[0]?.imageUrl ? (
                  <img
                    src={swapRequest.requestedListing.images[0].imageUrl}
                    alt={swapRequest.requestedListing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Shirt className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 block uppercase truncate">
                  {isRequester ? `${swapRequest.recipient.name}'s Item` : 'Your Item'}
                </span>
                <p className="font-semibold text-slate-900 truncate text-xs">
                  {swapRequest.requestedListing.title}
                </p>
                <span className="text-[10px] sm:text-[11px] text-slate-500 block truncate">
                  Size {swapRequest.requestedListing.size} • {swapRequest.requestedListing.condition.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Messages Chat Box (Full Height & Scrollable) */}
      <div className="flex-1 bg-slate-50/60 sm:border-x border-slate-200 px-3 sm:px-4 py-3 sm:py-4 overflow-y-auto space-y-3 sm:space-y-4">
        {/* Load older messages button */}
        {hasMoreOlder && (
          <div className="flex justify-center pb-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadOlder}
              disabled={isLoadingOlder}
              className="text-xs rounded-full bg-white hover:bg-slate-100 text-slate-600 shadow-2xs h-7 px-3"
            >
              {isLoadingOlder ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                  Loading older...
                </>
              ) : (
                'Load older messages'
              )}
            </Button>
          </div>
        )}

        {/* Safety & Negotiation Hint */}
        <div className="mx-auto max-w-md bg-amber-50/80 border border-amber-200/70 rounded-xl p-2 sm:p-2.5 text-center text-[10px] sm:text-[11px] text-amber-900 flex items-center justify-center space-x-2">
          <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-700 shrink-0" />
          <span>
            Agree on meeting location, size verification, or shipping directly in this private chat.
          </span>
        </div>

        {/* Empty state */}
        {messages.length === 0 ? (
          <div className="py-8 sm:py-12 flex flex-col items-center justify-center text-center space-y-3 max-w-sm mx-auto px-2">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-rose-50 flex items-center justify-center text-[#841d37]">
              <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Start the Conversation</h3>
              <p className="text-xs text-slate-500">
                You and {otherUser?.name || 'your swap partner'} can now agree on meeting times,
                exchange details, and inspect condition questions.
              </p>
            </div>

            <div className="w-full pt-2 sm:pt-3 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-left">
                Suggested Opening Messages:
              </span>
              {NEGOTIATION_STARTERS.map((text, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChipClick(text)}
                  className="w-full text-left p-2 sm:p-2.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-[#841d37] hover:bg-rose-50/30 transition-all font-medium"
                >
                  &ldquo;{text}&rdquo;
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isMe = user?.id === message.senderId;
            const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={message.id || index}
                className={`flex items-end space-x-1.5 sm:space-x-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {/* Left avatar for other user */}
                {!isMe && (
                  <div className="shrink-0 mb-1">
                    {message.sender?.avatarUrl ? (
                      <img
                        src={message.sender.avatarUrl}
                        alt={message.sender.name}
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-300 text-slate-700 font-bold text-[9px] sm:text-[10px] flex items-center justify-center">
                        {message.sender?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                )}

                {/* Message Bubble (Responsive Max Width & Break Anywhere) */}
                <div
                  className={`max-w-[86%] xs:max-w-[80%] sm:max-w-[70%] md:max-w-[65%] rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-2xs ${
                    isMe
                      ? 'bg-[#841d37] text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                  }`}
                >
                  {!isMe && (
                    <span className="text-[10px] font-bold text-[#841d37] block mb-0.5">
                      {message.sender?.name}
                    </span>
                  )}

                  <p className="text-[13px] sm:text-sm whitespace-pre-wrap [overflow-wrap:anywhere] leading-relaxed">
                    {message.content}
                  </p>

                  <div
                    className={`flex items-center justify-end space-x-1 mt-1 text-[9px] sm:text-[10px] ${
                      isMe ? 'text-rose-200' : 'text-slate-400'
                    }`}
                  >
                    <span>{formattedTime}</span>
                    {isMe && (
                      <span title={message.readAt ? 'Read' : 'Sent'}>
                        {message.readAt ? (
                          <CheckCheck className="h-3.5 w-3.5 text-emerald-300 inline" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-rose-300 inline" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Real-time typing bubble */}
        {isOtherTyping && (
          <div className="flex items-center space-x-2 animate-in fade-in duration-200">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-[10px]">
              {otherTypingName.charAt(0).toUpperCase()}
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs px-3 sm:px-3.5 py-1.5 sm:py-2 shadow-2xs flex items-center space-x-1.5">
              <span className="text-[11px] sm:text-xs text-slate-500 italic mr-1">
                {otherTypingName} is typing
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#841d37] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#841d37] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#841d37] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Quick Negotiation Starters (horizontal touch scroll) */}
      <div className="bg-white border-t sm:border-t-0 sm:border-x border-slate-200 px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center">
          <Info className="h-3 w-3 mr-0.5 text-slate-400" />
          Quick:
        </span>
        {NEGOTIATION_STARTERS.map((starter, i) => (
          <button
            key={i}
            onClick={() => handleChipClick(starter)}
            className="text-[10px] sm:text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-rose-50 hover:text-[#841d37] border border-slate-200 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full whitespace-nowrap transition-colors shrink-0"
          >
            {starter}
          </button>
        ))}
      </div>

      {/* 4. Bottom Message Composer (Responsive & Fixed to bottom) */}
      <div className="bg-white sm:rounded-b-2xl border-t sm:border sm:border-t-0 border-slate-200 p-2.5 sm:p-3 shadow-2xs shrink-0">
        <form onSubmit={handleSendMessage} className="space-y-1.5 sm:space-y-2">
          <div className="flex items-end space-x-2">
            <div className="relative flex-1">
              <textarea
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message... (Enter to send)"
                rows={1}
                maxLength={2000}
                aria-label="Message content"
                className="w-full resize-none rounded-xl border border-slate-300 px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#841d37] focus:border-transparent transition-all max-h-28 sm:max-h-32 min-h-[40px] sm:min-h-[42px]"
              />
            </div>

            <Button
              type="submit"
              disabled={isSending || !inputText.trim()}
              aria-label="Send message"
              className="h-[40px] sm:h-[42px] px-3 sm:px-4 rounded-xl bg-[#841d37] hover:bg-[#731c33] text-white disabled:opacity-50 shrink-0 shadow-xs flex items-center justify-center"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span className="hidden sm:inline mr-1.5 font-semibold text-xs">Send</span>
                  <Send className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400 px-1">
            <span className="hidden sm:inline">Shift + Enter for new line</span>
            <span className="sm:hidden">Press Enter or Send</span>
            <span className={inputText.length > 1800 ? 'text-amber-600 font-bold' : ''}>
              {inputText.length} / 2000
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
