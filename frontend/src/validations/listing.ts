import { z } from 'zod';

export const listingFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z
    .string()
    .trim()
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional()
    .or(z.literal('')),
  category: z.enum(
    ['TOPWEAR', 'BOTTOMWEAR', 'DRESS', 'OUTERWEAR', 'FOOTWEAR', 'ACCESSORIES'],
    { required_error: 'Please select a category' }
  ),
  brand: z
    .string()
    .trim()
    .max(100, 'Brand cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
  size: z.string().trim().min(1, 'Size is required').max(20),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'], {
    required_error: 'Please select item condition',
  }),
  estimatedSwapValue: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: 'Swap value must be a valid positive number',
    }),
  imageUrl: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: 'Image must be a valid http/https URL',
    }),
});

export type ListingFormData = z.infer<typeof listingFormSchema>;
