import { prisma } from '../config/prisma';
import { AppError } from './auth.service';
import { sanitizeText } from '../utils/sanitize';
import { SWAP_REQUEST_INCLUDE } from './swapRequest.service';
import { SwapRequestStatus } from '@prisma/client';
import { getIO } from '../socket';

export const SAFE_SENDER_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
};

export class ChatService {
  /**
   * Verify that the user is an authorized participant (requester or recipient) in the swap request.
   */
  static async verifySwapMembership(swapRequestId: string, userId: string) {
    const swapRequest = await prisma.swapRequest.findUnique({
      where: { id: swapRequestId },
      include: SWAP_REQUEST_INCLUDE,
    });

    if (!swapRequest) {
      throw new AppError('Swap request not found.', 404);
    }

    if (swapRequest.requesterId !== userId && swapRequest.recipientId !== userId) {
      throw new AppError('Forbidden: You are not authorized to access this conversation.', 403);
    }

    return swapRequest;
  }

  /**
   * Get or create a conversation for an accepted swap request.
   */
  static async getOrCreateConversation(swapRequestId: string, userId: string) {
    const swapRequest = await this.verifySwapMembership(swapRequestId, userId);

    if (swapRequest.status === SwapRequestStatus.PENDING) {
      throw new AppError('Chat is only available for accepted swap requests.', 400);
    }

    const conversation = await prisma.conversation.upsert({
      where: { swapRequestId },
      create: { swapRequestId },
      update: {},
      include: {
        swapRequest: {
          include: SWAP_REQUEST_INCLUDE,
        },
      },
    });

    const unreadCount = await prisma.message.count({
      where: {
        conversationId: conversation.id,
        senderId: { not: userId },
        readAt: null,
      },
    });

    return {
      ...conversation,
      unreadCount,
    };
  }

  /**
   * Get paginated messages for a conversation.
   * Default limit 50, chronologically ordered for smooth chat display.
   */
  static async getMessages(
    swapRequestId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ) {
    const swapRequest = await this.verifySwapMembership(swapRequestId, userId);

    const conversation = await prisma.conversation.findUnique({
      where: { swapRequestId },
    });

    if (!conversation) {
      return {
        messages: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
        swapRequest,
      };
    }

    const total = await prisma.message.count({
      where: { conversationId: conversation.id },
    });

    const skip = (page - 1) * limit;

    // Fetch in reverse chronological order for pagination, then sort ascending for display
    const rawMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        sender: {
          select: SAFE_SENDER_SELECT,
        },
      },
    });

    const messages = rawMessages.reverse();

    return {
      messages,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      swapRequest,
    };
  }

  /**
   * Create and persist a message to PostgreSQL, then broadcast to the Socket.IO room.
   */
  static async createMessage(swapRequestId: string, senderId: string, rawContent: string) {
    const swapRequest = await this.verifySwapMembership(swapRequestId, senderId);

    if (swapRequest.status === SwapRequestStatus.PENDING) {
      throw new AppError('Cannot send messages on a pending swap request.', 400);
    }

    if (
      swapRequest.status === SwapRequestStatus.REJECTED ||
      swapRequest.status === SwapRequestStatus.CANCELLED
    ) {
      throw new AppError('Cannot send messages on a closed or rejected swap request.', 400);
    }

    const trimmed = rawContent.trim();
    if (!trimmed) {
      throw new AppError('Message content cannot be empty.', 400);
    }

    const sanitizedContent = sanitizeText(trimmed);

    // Ensure conversation exists
    const conversation = await prisma.conversation.upsert({
      where: { swapRequestId },
      create: { swapRequestId },
      update: {},
    });

    // Persist message to PostgreSQL before broadcasting
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        content: sanitizedContent,
      },
      include: {
        sender: {
          select: SAFE_SENDER_SELECT,
        },
      },
    });

    // Real-time broadcast to socket room
    try {
      const io = getIO();
      if (io) {
        io.to(`swap:${swapRequestId}`).emit('message:received', message);
      }
    } catch {
      // Socket emission failure should not fail database persistence
    }

    return message;
  }

  /**
   * Mark a single message as read.
   */
  static async markMessageAsRead(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            swapRequest: true,
          },
        },
      },
    });

    if (!message) {
      throw new AppError('Message not found.', 404);
    }

    const swapRequest = message.conversation.swapRequest;
    if (swapRequest.requesterId !== userId && swapRequest.recipientId !== userId) {
      throw new AppError('Forbidden: You are not authorized to access this message.', 403);
    }

    // A user cannot mark their own message as read by themselves
    if (message.senderId === userId) {
      return message;
    }

    if (message.readAt) {
      return message;
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { readAt: new Date() },
      include: {
        sender: {
          select: SAFE_SENDER_SELECT,
        },
      },
    });

    // Notify socket room
    try {
      const io = getIO();
      if (io) {
        io.to(`swap:${swapRequest.id}`).emit('message:read', {
          swapRequestId: swapRequest.id,
          messageId: updatedMessage.id,
          readAt: updatedMessage.readAt,
        });
      }
    } catch {
      // Ignore socket errors
    }

    return updatedMessage;
  }

  /**
   * Mark all unread messages in a conversation as read for the current user.
   */
  static async markConversationAsRead(swapRequestId: string, userId: string) {
    await this.verifySwapMembership(swapRequestId, userId);

    const conversation = await prisma.conversation.findUnique({
      where: { swapRequestId },
    });

    if (!conversation) {
      return { count: 0 };
    }

    const now = new Date();
    const result = await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        senderId: { not: userId },
        readAt: null,
      },
      data: {
        readAt: now,
      },
    });

    if (result.count > 0) {
      try {
        const io = getIO();
        if (io) {
          io.to(`swap:${swapRequestId}`).emit('conversation:read', {
            swapRequestId,
            readByUserId: userId,
            readAt: now,
          });
        }
      } catch {
        // Ignore socket errors
      }
    }

    return { count: result.count };
  }

  /**
   * Get unread messages summary (total and by swapRequestId) for authenticated user.
   */
  static async getUnreadSummary(userId: string) {
    const unreadMessages = await prisma.message.findMany({
      where: {
        senderId: { not: userId },
        readAt: null,
        conversation: {
          swapRequest: {
            OR: [{ requesterId: userId }, { recipientId: userId }],
          },
        },
      },
      select: {
        id: true,
        conversation: {
          select: {
            swapRequestId: true,
          },
        },
      },
    });

    const totalUnread = unreadMessages.length;
    const bySwapRequest: Record<string, number> = {};

    for (const msg of unreadMessages) {
      const sId = msg.conversation.swapRequestId;
      bySwapRequest[sId] = (bySwapRequest[sId] || 0) + 1;
    }

    return {
      totalUnread,
      bySwapRequest,
    };
  }
}
