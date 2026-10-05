"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRecommendationResponseSchema = exports.aiRecommendationItemSchema = exports.getAiRecommendationsQuerySchema = void 0;
const zod_1 = require("zod");
exports.getAiRecommendationsQuerySchema = zod_1.z.object({
    limit: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 6))
        .refine((val) => !isNaN(val) && val >= 1 && val <= 20, {
        message: 'Limit must be an integer between 1 and 20.',
    }),
    minScore: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 50))
        .refine((val) => !isNaN(val) && val >= 0 && val <= 100, {
        message: 'minScore must be an integer between 0 and 100.',
    }),
});
exports.aiRecommendationItemSchema = zod_1.z.object({
    listingId: zod_1.z.string().min(1),
    score: zod_1.z.number().min(0).max(100),
    reason: zod_1.z.string().min(1).max(150),
});
exports.aiRecommendationResponseSchema = zod_1.z.object({
    recommendations: zod_1.z.array(exports.aiRecommendationItemSchema),
});
