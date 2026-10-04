import { z } from 'zod';

export const getListingMatchesQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => !isNaN(val) && val >= 1, 'Page must be a positive integer.'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 100, 'Limit must be between 1 and 100.'),
  minScore: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .refine((val) => !isNaN(val) && val >= 0 && val <= 100, 'minScore must be between 0 and 100.'),
  cityOnly: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  stateOnly: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

export type GetListingMatchesQuery = z.infer<typeof getListingMatchesQuerySchema>;

export const compareListingsSchema = z.object({
  sourceListingId: z.string({ required_error: 'sourceListingId is required.' }),
  targetListingId: z.string({ required_error: 'targetListingId is required.' }),
});

export type CompareListingsInput = z.infer<typeof compareListingsSchema>;
