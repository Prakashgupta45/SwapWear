"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiRecommendationController = void 0;
const aiRecommendation_service_1 = require("../services/aiRecommendation.service");
const aiRecommendation_validation_1 = require("../validations/aiRecommendation.validation");
class AiRecommendationController {
    /**
     * GET /api/ai/recommendations - Personalized AI-boosted swap recommendations
     */
    static async getRecommendations(req, res, next) {
        try {
            const query = aiRecommendation_validation_1.getAiRecommendationsQuerySchema.parse(req.query);
            const bypassCache = req.query.bypassCache === 'true';
            const result = await aiRecommendation_service_1.AiRecommendationService.getRecommendations(req.user.id, {
                limit: query.limit,
                minScore: query.minScore,
                bypassCache,
            });
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AiRecommendationController = AiRecommendationController;
