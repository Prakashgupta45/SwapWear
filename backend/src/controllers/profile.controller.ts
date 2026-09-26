import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ProfileService } from '../services/profile.service';

export class ProfileController {
  /**
   * GET /api/profile
   */
  static async getProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const profile = await ProfileService.getProfile(req.user!.id);
      res.status(200).json({ success: true, data: { profile } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/profile
   */
  static async updateProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const profile = await ProfileService.updateProfile(req.user!.id, req.body);
      res.status(200).json({ success: true, message: 'Profile updated successfully.', data: { profile } });
    } catch (error) {
      next(error);
    }
  }
}
