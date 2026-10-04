"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = exports.SAFE_SENDER_SELECT = void 0;
const prisma_1 = require("../config/prisma");
const auth_service_1 = require("./auth.service");
const sanitize_1 = require("../utils/sanitize");
const swapRequest_service_1 = require("./swapRequest.service");
const client_1 = require("@prisma/client");
const socket_1 = require("../socket");
exports.SAFE_SENDER_SELECT = {
    id: true,
    name: true,
    avatarUrl: true,
};
class ChatService {
    /**
     * Verify that the user is an authorized participant (requester or recipient) in the swap request.
     */
    static async verifySwapMembership(swapRequestId, userId) {
        const swapRequest = await prisma_1.prisma.swapRequest.findUnique({
            where: { id: swapRequestId },
            include: swapRequest_service_1.SWAP_REQUEST_INCLUDE,
        });
        if (!swapRequest) {
            throw new auth_service_1.AppError('Swap request not found.', 404);
        }
        if (swapRequest.requesterId !== userId && swapRequest.recipientId !== userId) {
            throw new auth_service_1.AppError('Forbidden: You are not authorized to access this conversation.', 403);
        }
        return swapRequest;
    }
    /**
     * Get or create a conversation for an accepted swap request.
     */
    static async getOrCreateConversation(swapRequestId, userId) {
        const swapRequest = await this.verifySwapMembership(swapRequestId, userId);
        if (swapRequest.status === client_1.SwapRequestStatus.PENDING) {
            throw new auth_service_1.AppError('Chat is only available for accepted swap requests.', 400);
        }
        const conversation = await prisma_1.prisma.conversation.upsert({
            where: { swapRequestId },
            create: { swapRequestId },
            update: {},
            include: {
                swapRequest: {
                    include: swapRequest_service_1.SWAP_REQUEST_INCLUDE,
                },
            },
        });
        const unreadCount = await prisma_1.prisma.message.count({
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
    static async getMessages(swapRequestId, userId, page = 1, limit = 50) {
        const swapRequest = await this.verifySwapMembership(swapRequestId, userId);
        const conversation = await prisma_1.prisma.conversation.findUnique({
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
        const total = await prisma_1.prisma.message.count({
            where: { conversationId: conversation.id },
        });
        const skip = (page - 1) * limit;
        // Fetch in reverse chronological order for pagination, then sort ascending for display
        const rawMessages = await prisma_1.prisma.message.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
                sender: {
                    select: exports.SAFE_SENDER_SELECT,
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
    static async createMessage(swapRequestId, senderId, rawContent) {
        const swapRequest = await this.verifySwapMembership(swapRequestId, senderId);
        if (swapRequest.status === client_1.SwapRequestStatus.PENDING) {
            throw new auth_service_1.AppError('Cannot send messages on a pending swap request.', 400);
        }
        if (swapRequest.status === client_1.SwapRequestStatus.REJECTED ||
            swapRequest.status === client_1.SwapRequestStatus.CANCELLED) {
            throw new auth_service_1.AppError('Cannot send messages on a closed or rejected swap request.', 400);
        }
        const trimmed = rawContent.trim();
        if (!trimmed) {
            throw new auth_service_1.AppError('Message content cannot be empty.', 400);
        }
        const sanitizedContent = (0, sanitize_1.sanitizeText)(trimmed);
        // Ensure conversation exists
        const conversation = await prisma_1.prisma.conversation.upsert({
            where: { swapRequestId },
            create: { swapRequestId },
            update: {},
        });
        // Persist message to PostgreSQL before broadcasting
        const message = await prisma_1.prisma.message.create({
            data: {
                conversationId: conversation.id,
                senderId,
                content: sanitizedContent,
            },
            include: {
                sender: {
                    select: exports.SAFE_SENDER_SELECT,
                },
            },
        });
        // Real-time broadcast to socket room
        try {
            const io = (0, socket_1.getIO)();
            if (io) {
                io.to(`swap:${swapRequestId}`).emit('message:received', message);
            }
        }
        catch {
            // Socket emission failure should not fail database persistence
        }
        return message;
    }
    /**
     * Mark a single message as read.
     */
    static async markMessageAsRead(messageId, userId) {
        const message = await prisma_1.prisma.message.findUnique({
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
            throw new auth_service_1.AppError('Message not found.', 404);
        }
        const swapRequest = message.conversation.swapRequest;
        if (swapRequest.requesterId !== userId && swapRequest.recipientId !== userId) {
            throw new auth_service_1.AppError('Forbidden: You are not authorized to access this message.', 403);
        }
        // A user cannot mark their own message as read by themselves
        if (message.senderId === userId) {
            return message;
        }
        if (message.readAt) {
            return message;
        }
        const updatedMessage = await prisma_1.prisma.message.update({
            where: { id: messageId },
            data: { readAt: new Date() },
            include: {
                sender: {
                    select: exports.SAFE_SENDER_SELECT,
                },
            },
        });
        // Notify socket room
        try {
            const io = (0, socket_1.getIO)();
            if (io) {
                io.to(`swap:${swapRequest.id}`).emit('message:read', {
                    swapRequestId: swapRequest.id,
                    messageId: updatedMessage.id,
                    readAt: updatedMessage.readAt,
                });
            }
        }
        catch {
            // Ignore socket errors
        }
        return updatedMessage;
    }
    /**
     * Mark all unread messages in a conversation as read for the current user.
     */
    static async markConversationAsRead(swapRequestId, userId) {
        await this.verifySwapMembership(swapRequestId, userId);
        const conversation = await prisma_1.prisma.conversation.findUnique({
            where: { swapRequestId },
        });
        if (!conversation) {
            return { count: 0 };
        }
        const now = new Date();
        const result = await prisma_1.prisma.message.updateMany({
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
                const io = (0, socket_1.getIO)();
                if (io) {
                    io.to(`swap:${swapRequestId}`).emit('conversation:read', {
                        swapRequestId,
                        readByUserId: userId,
                        readAt: now,
                    });
                }
            }
            catch {
                // Ignore socket errors
            }
        }
        return { count: result.count };
    }
    /**
     * Get unread messages summary (total and by swapRequestId) for authenticated user.
     */
    static async getUnreadSummary(userId) {
        const unreadMessages = await prisma_1.prisma.message.findMany({
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
        const bySwapRequest = {};
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
exports.ChatService = ChatService;
