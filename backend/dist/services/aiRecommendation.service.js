"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiRecommendationService = void 0;
const prisma_1 = require("../config/prisma");
const env_1 = require("../config/env");
const auth_service_1 = require("./auth.service");
const client_1 = require("@prisma/client");
const match_service_1 = require("./match.service");
const ai_service_1 = require("./ai.service");
// In-memory cache for user recommendations (5-minute TTL)
const recommendationsCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;
class AiRecommendationService {
    /**
     * Clear cache for testing or when user updates wardrobe
     */
    static clearCache(userId) {
        if (userId) {
            recommendationsCache.delete(userId);
        }
        else {
            recommendationsCache.clear();
        }
    }
    /**
     * Main entrypoint for AI-powered personalized swap recommendations
     */
    static async getRecommendations(userId, options) {
        const limit = options?.limit ?? 6;
        const minScore = options?.minScore ?? 50;
        // Check cache unless explicitly bypassed
        const cacheKey = `${userId}:${limit}:${minScore}`;
        if (!options?.bypassCache) {
            const cached = recommendationsCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
                return cached.data;
            }
        }
        // 1. Fetch user data (profile & wardrobe)
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                city: true,
                state: true,
            },
        });
        if (!user) {
            throw new auth_service_1.AppError('User not found.', 404);
        }
        // 2. Fetch user's own active listings
        const userActiveListings = await prisma_1.prisma.clothingListing.findMany({
            where: {
                ownerId: userId,
                status: client_1.ListingStatus.AVAILABLE,
            },
            select: {
                id: true,
                title: true,
                category: true,
                brand: true,
                size: true,
                condition: true,
                estimatedSwapValue: true,
            },
            take: 10,
        });
        // 3. Obtain candidate listings pre-filtered and pre-scored by Phase 6 Rule-Based Matcher
        // We request top 12 from Phase 6 so AI can evaluate the best rule-based candidates
        const phase6Result = await match_service_1.MatchService.getUserRecommendations(userId, {
            limit: 12,
            minScore: Math.max(40, minScore - 10), // slight buffer for AI reranking
        });
        const phase6Candidates = phase6Result.recommendations || [];
        // Empty state: No candidates available in the entire marketplace
        if (phase6Candidates.length === 0) {
            const emptyResult = {
                recommendations: [],
                total: 0,
                isAiActive: false,
            };
            recommendationsCache.set(cacheKey, { timestamp: Date.now(), data: emptyResult });
            return emptyResult;
        }
        // 4. Fetch recent swap activity to provide contextual swap patterns
        const recentSwaps = await prisma_1.prisma.swapRequest.findMany({
            where: {
                OR: [{ requesterId: userId }, { recipientId: userId }],
            },
            select: {
                requesterId: true,
                status: true,
                requestedListing: {
                    select: { category: true },
                },
                offeredListing: {
                    select: { category: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });
        const swapHistorySummary = recentSwaps.map((sr) => ({
            role: sr.requesterId === userId ? 'REQUESTER' : 'RECEIVER',
            status: sr.status,
            requestedCategory: sr.requestedListing?.category,
            offeredCategory: sr.offeredListing?.category,
        }));
        // 5. Construct compact structured AI payload (Strict Privacy: no passwords, tokens, full addresses)
        const userItems = userActiveListings.map((item) => ({
            category: item.category,
            brand: item.brand,
            size: item.size,
            condition: item.condition,
            estimatedSwapValue: item.estimatedSwapValue,
        }));
        // Filter candidate listings: top 10 candidates max for cost & token control
        const aiCandidates = phase6Candidates.slice(0, 10).map((cand) => ({
            id: cand.listing.id,
            title: cand.listing.title,
            category: cand.listing.category,
            brand: cand.listing.brand,
            size: cand.listing.size,
            condition: cand.listing.condition,
            estimatedSwapValue: cand.listing.estimatedSwapValue,
            city: cand.listing.owner?.city || null,
            state: cand.listing.owner?.state || null,
            phase6MatchScore: cand.matchScore,
        }));
        const aiPayload = {
            userProfile: {
                city: user.city,
                state: user.state,
            },
            userItems,
            swapHistorySummary,
            candidateListings: aiCandidates,
        };
        // 6. Call AI Recommendation Service
        let aiResponse = null;
        try {
            aiResponse = await ai_service_1.AiService.getPersonalizedRanking(aiPayload);
        }
        catch (err) {
            console.warn('[AiRecommendationService] AI ranking fell back to Phase 6:', err);
        }
        // 7. Hybrid Scoring & Integration
        const ruleWeight = env_1.env.RULE_WEIGHT ?? 0.70;
        const aiWeight = env_1.env.AI_WEIGHT ?? 0.30;
        const isAiActive = Boolean(aiResponse && aiResponse.recommendations.length > 0);
        const aiScoreMap = new Map();
        if (isAiActive && aiResponse) {
            for (const item of aiResponse.recommendations) {
                aiScoreMap.set(item.listingId, {
                    score: item.score,
                    reason: item.reason,
                });
            }
        }
        const finalRecommendations = phase6Candidates.map((cand) => {
            const aiMatch = aiScoreMap.get(cand.listing.id);
            let finalScore = cand.matchScore;
            let aiReason = null;
            let reasons = [...cand.reasons];
            if (aiMatch) {
                // Hybrid formula: (Phase 6 score × 0.70) + (AI score × 0.30)
                finalScore = Math.round((cand.matchScore * ruleWeight) + (aiMatch.score * aiWeight));
                aiReason = aiMatch.reason;
                // Prepend AI reason to reasons list
                reasons = [aiMatch.reason, ...cand.reasons];
            }
            // Constrain final score to [0, 100]
            finalScore = Math.max(0, Math.min(100, finalScore));
            const matchLevel = finalScore >= 80 ? 'EXCELLENT' : finalScore >= 70 ? 'GREAT' : finalScore >= 55 ? 'GOOD' : 'FAIR';
            return {
                ...cand,
                phase6Score: cand.matchScore,
                matchScore: finalScore,
                matchLevel,
                reasons,
                isAiRecommended: Boolean(aiMatch),
                aiReason,
            };
        });
        // Sort by hybrid score descending
        finalRecommendations.sort((a, b) => b.matchScore - a.matchScore);
        // Filter by minScore and slice by limit
        const filtered = finalRecommendations.filter((rec) => rec.matchScore >= minScore).slice(0, limit);
        const result = {
            recommendations: filtered,
            total: filtered.length,
            isAiActive,
        };
        recommendationsCache.set(cacheKey, { timestamp: Date.now(), data: result });
        return result;
    }
}
exports.AiRecommendationService = AiRecommendationService;
