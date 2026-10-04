"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSwapRequestSchema = void 0;
const zod_1 = require("zod");
exports.createSwapRequestSchema = zod_1.z.object({
    requestedListingId: zod_1.z
        .string({ required_error: 'Requested listing ID is required' })
        .trim()
        .min(1, 'Requested listing ID is required'),
    offeredListingId: zod_1.z
        .string({ required_error: 'Offered listing ID is required' })
        .trim()
        .min(1, 'Offered listing ID is required'),
    message: zod_1.z
        .string()
        .trim()
        .max(1000, 'Message cannot exceed 1000 characters')
        .optional()
        .nullable(),
});
