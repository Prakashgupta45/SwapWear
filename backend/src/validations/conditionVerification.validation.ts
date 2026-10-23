import { z } from 'zod';
import { Condition } from '@prisma/client';

export type VerificationStatus =
  | 'NOT_ANALYZED'
  | 'CONSISTENT'
  | 'REVIEW_RECOMMENDED'
  | 'MISMATCH_WARNING'
  | 'FAILED';

export type ImageQuality = 'GOOD' | 'FAIR' | 'POOR';

export const rawAiConditionResponseSchema = z.object({
  estimatedCondition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']),
  confidence: z.number().min(0).max(100),
  visibleIssues: z.array(z.string().max(200)),
  imageQuality: z.enum(['GOOD', 'FAIR', 'POOR']).default('GOOD'),
  recommendation: z.string().max(300),
});

export type RawAiConditionResponse = z.infer<typeof rawAiConditionResponseSchema>;

export const preCheckConditionSchema = z.object({
  imageUrl: z.string().url().max(2048),
  declaredCondition: z.nativeEnum(Condition),
  category: z.string().optional(),
  title: z.string().max(150).optional(),
  brand: z.string().max(100).optional(),
});

export type PreCheckConditionInput = z.infer<typeof preCheckConditionSchema>;

export const verifyListingParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid listing UUID' }),
});

export const conditionVerificationQuerySchema = z.object({
  force: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

export interface ConditionVerificationResult {
  verificationAvailable: boolean;
  listingId?: string;
  declaredCondition: Condition;
  estimatedCondition: Condition | null;
  confidence: number | null;
  visibleIssues: string[];
  imageQuality: ImageQuality | null;
  recommendation: string;
  mismatch: boolean;
  differenceLevels: number;
  verificationStatus: VerificationStatus;
  analyzedAt: string | null;
  notice: string;
}
