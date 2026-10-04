import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ChatService } from '../services/chat.service';

export class ChatController {
  /**
   * GET /api/conversations/:swapRequestId
   */
  static async getConversation(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { swapRequestId } = req.params;
      const conversation = await ChatService.getOrCreateConversation(
        swapRequestId,
        req.user!.id
      );

      res.status(200).json({
        success: true,
        data: { conversation },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/conversations/:swapRequestId/messages
   */
  static async getMessages(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { swapRequestId } = req.params;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await ChatService.getMessages(
        swapRequestId,
        req.user!.id,
        page,
        limit
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/conversations/:swapRequestId/messages
   */
  static async sendMessage(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { swapRequestId } = req.params;
      const { content } = req.body;

      const message = await ChatService.createMessage(
        swapRequestId,
        req.user!.id,
        content
      );

      res.status(201).json({
        success: true,
        data: { message },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/messages/:messageId/read
   */
  static async markMessageAsRead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { messageId } = req.params;
      const message = await ChatService.markMessageAsRead(
        messageId,
        req.user!.id
      );

      res.status(200).json({
        success: true,
        data: { message },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/conversations/:swapRequestId/read
   */
  static async markConversationAsRead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { swapRequestId } = req.params;
      const result = await ChatService.markConversationAsRead(
        swapRequestId,
        req.user!.id
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/conversations/unread-summary
   */
  static async getUnreadSummary(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const summary = await ChatService.getUnreadSummary(req.user!.id);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }
}
