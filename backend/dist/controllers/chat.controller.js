"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const chat_service_1 = require("../services/chat.service");
class ChatController {
    /**
     * GET /api/conversations/:swapRequestId
     */
    static async getConversation(req, res, next) {
        try {
            const { swapRequestId } = req.params;
            const conversation = await chat_service_1.ChatService.getOrCreateConversation(swapRequestId, req.user.id);
            res.status(200).json({
                success: true,
                data: { conversation },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/conversations/:swapRequestId/messages
     */
    static async getMessages(req, res, next) {
        try {
            const { swapRequestId } = req.params;
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
            const result = await chat_service_1.ChatService.getMessages(swapRequestId, req.user.id, page, limit);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/conversations/:swapRequestId/messages
     */
    static async sendMessage(req, res, next) {
        try {
            const { swapRequestId } = req.params;
            const { content } = req.body;
            const message = await chat_service_1.ChatService.createMessage(swapRequestId, req.user.id, content);
            res.status(201).json({
                success: true,
                data: { message },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /api/messages/:messageId/read
     */
    static async markMessageAsRead(req, res, next) {
        try {
            const { messageId } = req.params;
            const message = await chat_service_1.ChatService.markMessageAsRead(messageId, req.user.id);
            res.status(200).json({
                success: true,
                data: { message },
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /api/conversations/:swapRequestId/read
     */
    static async markConversationAsRead(req, res, next) {
        try {
            const { swapRequestId } = req.params;
            const result = await chat_service_1.ChatService.markConversationAsRead(swapRequestId, req.user.id);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/conversations/unread-summary
     */
    static async getUnreadSummary(req, res, next) {
        try {
            const summary = await chat_service_1.ChatService.getUnreadSummary(req.user.id);
            res.status(200).json({
                success: true,
                data: summary,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ChatController = ChatController;
