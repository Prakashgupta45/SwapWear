import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { MatchService } from '../services/match.service';
import { getListingMatchesQuerySchema } from '../validations/match.validation';

export class MatchController {
  /**
   * GET /api/matches/listing/:id or /api/listings/:id/matches
   */
  static async getListingMatches(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const query = getListingMatchesQuerySchema.parse(req.query);

      const result = await MatchService.getMatchesForListing(
        id,
        req.user?.id,
        query
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
   * POST /api/matches/compare
   */
  static async compareListings(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { sourceListingId, targetListingId } = req.body;

      const result = await MatchService.compareListings(
        sourceListingId,
        targetListingId
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
   * GET /api/matches/recommendations
   */
  static async getUserRecommendations(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 12;
      const minScore = req.query.minScore ? parseInt(req.query.minScore as string, 10) : 50;

      const result = await MatchService.getUserRecommendations(req.user!.id, {
        limit,
        minScore,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
