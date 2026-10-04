import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { sendMessageSchema } from '../validations/chat.validation';
import { messageRateLimiter } from '../middleware/rateLimit.middleware';

export const conversationRoutes = Router();
export const messageRoutes = Router();

// All chat routes require authentication
conversationRoutes.use(authenticate);
messageRoutes.use(authenticate);

// Conversation routes: mounted at /api/conversations
conversationRoutes.get('/unread-summary', ChatController.getUnreadSummary);
conversationRoutes.get('/:swapRequestId', ChatController.getConversation);
conversationRoutes.get('/:swapRequestId/messages', ChatController.getMessages);
conversationRoutes.post(
  '/:swapRequestId/messages',
  messageRateLimiter,
  validate(sendMessageSchema),
  ChatController.sendMessage
);
conversationRoutes.patch('/:swapRequestId/read', ChatController.markConversationAsRead);

// Message routes: mounted at /api/messages
messageRoutes.patch('/:messageId/read', ChatController.markMessageAsRead);
