import { z } from 'zod';

export const createListingSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z
    .string()
    .trim()
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional()
    .nullable(),
  category: z.enum(
    ['TOPWEAR', 'BOTTOMWEAR', 'DRESS', 'OUTERWEAR', 'FOOTWEAR', 'ACCESSORIES'],
    { required_error: 'Category is required' }
  ),
  brand: z
    .string()
    .trim()
    .max(100, 'Brand cannot exceed 100 characters')
    .optional()
    .nullable(),
  color: z.string().trim().max(80, 'Color cannot exceed 80 characters').optional().nullable(),
  size: z
    .string({ required_error: 'Size is required' })
    .trim()
    .min(1, 'Size is required')
    .max(20, 'Size cannot exceed 20 characters'),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'], {
    required_error: 'Condition is required',
  }),
  estimatedSwapValue: z
    .number()
    .min(0, 'Estimated swap value must be non-negative')
    .optional()
    .nullable(),
  imageUrls: z
    .array(z.string().url('Each image must be a valid URL'))
    .max(8, 'Maximum 8 images allowed per listing')
    .optional()
    .default([]),
});

export const updateListingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional()
    .nullable(),
  category: z
    .enum(['TOPWEAR', 'BOTTOMWEAR', 'DRESS', 'OUTERWEAR', 'FOOTWEAR', 'ACCESSORIES'])
    .optional(),
  brand: z
    .string()
    .trim()
    .max(100, 'Brand cannot exceed 100 characters')
    .optional()
    .nullable(),
  color: z.string().trim().max(80, 'Color cannot exceed 80 characters').optional().nullable(),
  size: z
    .string()
    .trim()
    .min(1, 'Size is required')
    .max(20, 'Size cannot exceed 20 characters')
    .optional(),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']).optional(),
  estimatedSwapValue: z
    .number()
    .min(0, 'Estimated swap value must be non-negative')
    .optional()
    .nullable(),
  status: z.enum(['AVAILABLE', 'RESERVED', 'SWAPPED']).optional(),
  imageUrls: z
    .array(z.string().url('Each image must be a valid URL'))
    .max(8, 'Maximum 8 images allowed per listing')
    .optional(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
