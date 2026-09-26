import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .optional(),
  bio: z
    .string()
    .trim()
    .max(500, 'Bio cannot exceed 500 characters')
    .optional()
    .nullable(),
  city: z
    .string()
    .trim()
    .max(100, 'City cannot exceed 100 characters')
    .optional()
    .nullable(),
  state: z
    .string()
    .trim()
    .max(100, 'State cannot exceed 100 characters')
    .optional()
    .nullable(),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{5,10}$/, 'Pincode must be 5-10 digits')
    .optional()
    .nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
