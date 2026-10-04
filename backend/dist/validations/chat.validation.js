"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessagesQuerySchema = exports.sendMessageSchema = void 0;
const zod_1 = require("zod");
exports.sendMessageSchema = zod_1.z.object({
    content: zod_1.z
        .string({
        required_error: 'Message content is required.',
    })
        .trim()
        .min(1, 'Message cannot be empty.')
        .max(2000, 'Message cannot exceed 2000 characters.'),
});
exports.getMessagesQuerySchema = zod_1.z.object({
    page: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 1))
        .refine((val) => !isNaN(val) && val >= 1, 'Page must be a positive integer.'),
    limit: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 50))
        .refine((val) => !isNaN(val) && val >= 1 && val <= 100, 'Limit must be between 1 and 100.'),
});
