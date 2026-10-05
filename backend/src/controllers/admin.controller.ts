import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AdminService } from '../services/admin.service';
import { Category, Condition, ListingStatus, Role, SwapRequestStatus } from '@prisma/client';

export class AdminController {
  /**
   * GET /api/admin/analytics
   */
  static async getAnalytics(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const analytics = await AdminService.getPlatformAnalytics();
      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/users
   */
  static async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, role } = req.query;
      const result = await AdminService.getUsers({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search as string | undefined,
        role: role as Role | 'ALL' | undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/users/:id
   */
  static async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await AdminService.getUserById(req.params.id);
      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/users/:id/role
   */
  static async updateUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const adminUserId = req.user!.id;
      const targetUserId = req.params.id;
      const { role } = req.body;

      const user = await AdminService.updateUserRole(adminUserId, targetUserId, role);
      res.status(200).json({
        success: true,
        message: `User role updated successfully to ${role}.`,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/listings
   */
  static async getListings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, category, condition, status } = req.query;
      const result = await AdminService.getListings({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        search: search as string | undefined,
        category: category as Category | undefined,
        condition: condition as Condition | undefined,
        status: status as ListingStatus | 'ALL' | undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/listings/:id
   */
  static async getListingById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const listing = await AdminService.getListingById(req.params.id);
      res.status(200).json({
        success: true,
        data: { listing },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/listings/:id/moderate
   */
  static async moderateListing(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { action } = req.body;
      const result = await AdminService.moderateListing(req.params.id, action);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.listing,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/swaps
   */
  static async getSwapRequests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, status, search } = req.query;
      const result = await AdminService.getSwapRequests({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        status: status as SwapRequestStatus | 'ALL' | undefined,
        search: search as string | undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/swaps/:id
   */
  static async getSwapRequestById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const swap = await AdminService.getSwapRequestById(req.params.id);
      res.status(200).json({
        success: true,
        data: { swap },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/conversations
   */
  static async getConversations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const result = await AdminService.getConversations({
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/conversations/:id
   */
  static async getConversationAudit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const result = await AdminService.getConversationAudit(
        req.params.id,
        page ? parseInt(page as string, 10) : 1,
        limit ? parseInt(limit as string, 10) : 50
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
