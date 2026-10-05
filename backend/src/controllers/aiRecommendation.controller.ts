import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AiRecommendationService } from '../services/aiRecommendation.service';
import { getAiRecommendationsQuerySchema } from '../validations/aiRecommendation.validation';

export class AiRecommendationController {
  /**
   * GET /api/ai/recommendations - Personalized AI-boosted swap recommendations
   */
  static async getRecommendations(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = getAiRecommendationsQuerySchema.parse(req.query);
      const bypassCache = req.query.bypassCache === 'true';

      const result = await AiRecommendationService.getRecommendations(req.user!.id, {
        limit: query.limit,
        minScore: query.minScore,
        bypassCache,
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
