import { z } from 'zod';

export const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN'], {
    required_error: 'Role is required and must be either USER or ADMIN.',
  }),
});

export const moderateListingSchema = z.object({
  action: z.enum(['REMOVE', 'RESTORE'], {
    required_error: 'Action is required and must be either REMOVE or RESTORE.',
  }),
});

export const adminUserQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['USER', 'ADMIN', 'ALL']).optional(),
});

export const adminListingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.enum(['TOPWEAR', 'BOTTOMWEAR', 'DRESS', 'OUTERWEAR', 'FOOTWEAR', 'ACCESSORIES']).optional(),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']).optional(),
  status: z.enum(['AVAILABLE', 'RESERVED', 'SWAPPED', 'ALL']).optional(),
});

export const adminSwapQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'ALL']).optional(),
  search: z.string().optional(),
});

export const adminConversationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
