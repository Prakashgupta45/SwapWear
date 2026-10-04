"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchController = void 0;
const match_service_1 = require("../services/match.service");
const match_validation_1 = require("../validations/match.validation");
class MatchController {
    /**
     * GET /api/matches/listing/:id or /api/listings/:id/matches
     */
    static async getListingMatches(req, res, next) {
        try {
            const { id } = req.params;
            const query = match_validation_1.getListingMatchesQuerySchema.parse(req.query);
            const result = await match_service_1.MatchService.getMatchesForListing(id, req.user?.id, query);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/matches/compare
     */
    static async compareListings(req, res, next) {
        try {
            const { sourceListingId, targetListingId } = req.body;
            const result = await match_service_1.MatchService.compareListings(sourceListingId, targetListingId);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/matches/recommendations
     */
    static async getUserRecommendations(req, res, next) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 12;
            const minScore = req.query.minScore ? parseInt(req.query.minScore, 10) : 50;
            const result = await match_service_1.MatchService.getUserRecommendations(req.user.id, {
                limit,
                minScore,
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
exports.MatchController = MatchController;
