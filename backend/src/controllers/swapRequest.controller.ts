import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { SwapRequestService } from '../services/swapRequest.service';

export class SwapRequestController {
  /**
   * POST /api/swap-requests
   * Create a swap request
   */
  static async createSwapRequest(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const swapRequest = await SwapRequestService.createSwapRequest(
        req.user!.id,
        req.body
      );
      res.status(201).json({
        success: true,
        message: 'Swap request submitted successfully.',
        data: { swapRequest },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/swap-requests/sent
   * Retrieve swap requests sent by the authenticated user
   */
  static async getSentRequests(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const swapRequests = await SwapRequestService.getSentRequests(req.user!.id);
      res.status(200).json({
        success: true,
        data: { swapRequests },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/swap-requests/received
   * Retrieve swap requests received by the authenticated user
   */
  static async getReceivedRequests(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const swapRequests = await SwapRequestService.getReceivedRequests(req.user!.id);
      res.status(200).json({
        success: true,
        data: { swapRequests },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/swap-requests/:id
   * Retrieve detailed information for a specific swap request
   */
  static async getSwapRequestById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const swapRequest = await SwapRequestService.getSwapRequestById(
        req.params.id,
        req.user!.id
      );
      res.status(200).json({
        success: true,
        data: { swapRequest },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/swap-requests/:id/accept
   * Accept a swap request (recipient only)
   */
  static async acceptSwapRequest(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const swapRequest = await SwapRequestService.acceptSwapRequest(
        req.params.id,
        req.user!.id
      );
      res.status(200).json({
        success: true,
        message: 'Swap request accepted successfully. Both listings are now reserved.',
        data: { swapRequest },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/swap-requests/:id/reject
   * Reject a swap request (recipient only)
   */
  static async rejectSwapRequest(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const swapRequest = await SwapRequestService.rejectSwapRequest(
        req.params.id,
        req.user!.id
      );
      res.status(200).json({
        success: true,
        message: 'Swap request rejected.',
        data: { swapRequest },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/swap-requests/:id/cancel
   * Cancel a swap request (requester only)
   */
  static async cancelSwapRequest(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const swapRequest = await SwapRequestService.cancelSwapRequest(
        req.params.id,
        req.user!.id
      );
      res.status(200).json({
        success: true,
        message: 'Swap request cancelled.',
        data: { swapRequest },
      });
    } catch (error) {
      next(error);
    }
  }
}
