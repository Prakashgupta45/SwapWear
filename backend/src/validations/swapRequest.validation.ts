import { z } from 'zod';

export const createSwapRequestSchema = z.object({
  requestedListingId: z
    .string({ required_error: 'Requested listing ID is required' })
    .trim()
    .min(1, 'Requested listing ID is required'),
  offeredListingId: z
    .string({ required_error: 'Offered listing ID is required' })
    .trim()
    .min(1, 'Offered listing ID is required'),
  message: z
    .string()
    .trim()
    .max(1000, 'Message cannot exceed 1000 characters')
    .optional()
    .nullable(),
});

export type CreateSwapRequestInput = z.infer<typeof createSwapRequestSchema>;
