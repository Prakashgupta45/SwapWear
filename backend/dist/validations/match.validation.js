"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareListingsSchema = exports.getListingMatchesQuerySchema = void 0;
const zod_1 = require("zod");
exports.getListingMatchesQuerySchema = zod_1.z.object({
    page: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 1))
        .refine((val) => !isNaN(val) && val >= 1, 'Page must be a positive integer.'),
    limit: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 20))
        .refine((val) => !isNaN(val) && val >= 1 && val <= 100, 'Limit must be between 1 and 100.'),
    minScore: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 0))
        .refine((val) => !isNaN(val) && val >= 0 && val <= 100, 'minScore must be between 0 and 100.'),
    cityOnly: zod_1.z
        .string()
        .optional()
        .transform((val) => val === 'true'),
    stateOnly: zod_1.z
        .string()
        .optional()
        .transform((val) => val === 'true'),
});
exports.compareListingsSchema = zod_1.z.object({
    sourceListingId: zod_1.z.string({ required_error: 'sourceListingId is required.' }),
    targetListingId: zod_1.z.string({ required_error: 'targetListingId is required.' }),
});
