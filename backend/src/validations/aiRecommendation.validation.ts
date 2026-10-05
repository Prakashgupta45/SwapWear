import { z } from 'zod';

export const getAiRecommendationsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 6))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 20, {
      message: 'Limit must be an integer between 1 and 20.',
    }),
  minScore: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .refine((val) => !isNaN(val) && val >= 0 && val <= 100, {
      message: 'minScore must be an integer between 0 and 100.',
    }),
});

export const aiRecommendationItemSchema = z.object({
  listingId: z.string().min(1),
  score: z.number().min(0).max(100),
  reason: z.string().min(1).max(150),
});

export const aiRecommendationResponseSchema = z.object({
  recommendations: z.array(aiRecommendationItemSchema),
});

export type GetAiRecommendationsQuery = z.infer<typeof getAiRecommendationsQuerySchema>;
export type AiRecommendationItem = z.infer<typeof aiRecommendationItemSchema>;
export type AiRecommendationResponse = z.infer<typeof aiRecommendationResponseSchema>;
