"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageRoutes = exports.conversationRoutes = void 0;
const express_1 = require("express");
const chat_controller_1 = require("../controllers/chat.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const chat_validation_1 = require("../validations/chat.validation");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
exports.conversationRoutes = (0, express_1.Router)();
exports.messageRoutes = (0, express_1.Router)();
// All chat routes require authentication
exports.conversationRoutes.use(auth_middleware_1.authenticate);
exports.messageRoutes.use(auth_middleware_1.authenticate);
// Conversation routes: mounted at /api/conversations
exports.conversationRoutes.get('/unread-summary', chat_controller_1.ChatController.getUnreadSummary);
exports.conversationRoutes.get('/:swapRequestId', chat_controller_1.ChatController.getConversation);
exports.conversationRoutes.get('/:swapRequestId/messages', chat_controller_1.ChatController.getMessages);
exports.conversationRoutes.post('/:swapRequestId/messages', rateLimit_middleware_1.messageRateLimiter, (0, validate_middleware_1.validate)(chat_validation_1.sendMessageSchema), chat_controller_1.ChatController.sendMessage);
exports.conversationRoutes.patch('/:swapRequestId/read', chat_controller_1.ChatController.markConversationAsRead);
// Message routes: mounted at /api/messages
exports.messageRoutes.patch('/:messageId/read', chat_controller_1.ChatController.markMessageAsRead);
