"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminConversationQuerySchema = exports.adminSwapQuerySchema = exports.adminListingQuerySchema = exports.adminUserQuerySchema = exports.moderateListingSchema = exports.updateUserRoleSchema = void 0;
const zod_1 = require("zod");
exports.updateUserRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(['USER', 'ADMIN'], {
        required_error: 'Role is required and must be either USER or ADMIN.',
    }),
});
exports.moderateListingSchema = zod_1.z.object({
    action: zod_1.z.enum(['REMOVE', 'RESTORE'], {
        required_error: 'Action is required and must be either REMOVE or RESTORE.',
    }),
});
exports.adminUserQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    search: zod_1.z.string().optional(),
    role: zod_1.z.enum(['USER', 'ADMIN', 'ALL']).optional(),
});
exports.adminListingQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    search: zod_1.z.string().optional(),
    category: zod_1.z.enum(['TOPWEAR', 'BOTTOMWEAR', 'DRESS', 'OUTERWEAR', 'FOOTWEAR', 'ACCESSORIES']).optional(),
    condition: zod_1.z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']).optional(),
    status: zod_1.z.enum(['AVAILABLE', 'RESERVED', 'SWAPPED', 'ALL']).optional(),
});
exports.adminSwapQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    status: zod_1.z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'ALL']).optional(),
    search: zod_1.z.string().optional(),
});
exports.adminConversationQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
