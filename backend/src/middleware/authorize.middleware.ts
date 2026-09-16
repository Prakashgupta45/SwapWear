import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { Role } from '@prisma/client';

export function authorizeRoles(...roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions to access this resource.',
      });
      return;
    }

    next();
  };
}
