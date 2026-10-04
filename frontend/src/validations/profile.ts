import { z } from 'zod';

export const profileFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  bio: z.string().trim().max(500, 'Bio cannot exceed 500 characters').optional().or(z.literal('')),
  city: z.string().trim().max(100, 'City cannot exceed 100 characters').optional().or(z.literal('')),
  state: z.string().trim().max(100, 'State cannot exceed 100 characters').optional().or(z.literal('')),
  pincode: z
    .string()
    .trim()
    .refine((val) => !val || /^\d{5,10}$/.test(val), {
      message: 'Pincode must be 5-10 digits',
    })
    .optional()
    .or(z.literal('')),
  avatarUrl: z.string().trim().optional().or(z.literal('')),
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;
