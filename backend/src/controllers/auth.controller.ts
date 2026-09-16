import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { setAuthCookie, clearAuthCookie } from '../utils/cookie';
import { AuthenticatedRequest } from '../types';

export class AuthController {
  /**
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, token } = await AuthService.register(req.body);

      // Set secure HTTP-only cookie
      setAuthCookie(res, token);

      res.status(201).json({
        success: true,
        message: 'Registration successful.',
        data: { user, token },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, token } = await AuthService.login(req.body);

      // Set secure HTTP-only cookie
      setAuthCookie(res, token);

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: { user, token },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   */
  static async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Clear secure HTTP-only cookie
      clearAuthCookie(res);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   */
  static async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // req.user is populated by authenticate middleware
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated.',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { user: req.user },
      });
    } catch (error) {
      next(error);
    }
  }
}
