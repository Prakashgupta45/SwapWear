import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ConditionVerificationService } from '../services/conditionVerification.service';
import {
  preCheckConditionSchema,
  verifyListingParamsSchema,
  conditionVerificationQuerySchema,
} from '../validations/conditionVerification.validation';

export class ConditionVerificationController {
  /**
   * POST /api/listings/:id/condition-verification
   * Trigger condition verification on a clothing listing
   */
  static async verifyListing(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = verifyListingParamsSchema.parse(req.params);
      const query = conditionVerificationQuerySchema.parse(req.query);

      const result = await ConditionVerificationService.verifyListing(
        id,
        { id: req.user!.id, role: req.user!.role },
        query.force
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
   * GET /api/listings/:id/condition-verification
   * Retrieve cached condition verification for a listing
   */
  static async getListingVerification(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = verifyListingParamsSchema.parse(req.params);
      const result = await ConditionVerificationService.getListingVerification(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/condition-verification/pre-check
   * Pre-check condition from uploaded image during listing creation
   */
  static async preCheckCondition(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedInput = preCheckConditionSchema.parse(req.body);
      const result = await ConditionVerificationService.preCheckCondition(validatedInput);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
