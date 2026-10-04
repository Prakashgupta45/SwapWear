import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z
    .string({
      required_error: 'Message content is required.',
    })
    .trim()
    .min(1, 'Message cannot be empty.')
    .max(2000, 'Message cannot exceed 2000 characters.'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const getMessagesQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => !isNaN(val) && val >= 1, 'Page must be a positive integer.'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 100, 'Limit must be between 1 and 100.'),
});

export type GetMessagesQueryInput = z.infer<typeof getMessagesQuerySchema>;
