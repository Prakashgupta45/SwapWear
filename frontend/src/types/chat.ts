import { SwapRequest } from './swapRequest';

export interface ChatSender {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
  sender: ChatSender;
}

export interface Conversation {
  id: string;
  swapRequestId: string;
  createdAt: string;
  updatedAt: string;
  swapRequest?: SwapRequest;
  unreadCount?: number;
}

export interface MessagesResponse {
  success: boolean;
  data: {
    messages: ChatMessage[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    swapRequest: SwapRequest;
  };
}

export interface ConversationResponse {
  success: boolean;
  data: {
    conversation: Conversation;
  };
}

export interface SendMessageResponse {
  success: boolean;
  data: {
    message: ChatMessage;
  };
}

export interface UnreadSummaryResponse {
  success: boolean;
  data: {
    totalUnread: number;
    bySwapRequest: Record<string, number>;
  };
}
