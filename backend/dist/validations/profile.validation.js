"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name cannot exceed 100 characters')
        .optional(),
    bio: zod_1.z
        .string()
        .trim()
        .max(500, 'Bio cannot exceed 500 characters')
        .optional()
        .nullable(),
    city: zod_1.z
        .string()
        .trim()
        .max(100, 'City cannot exceed 100 characters')
        .optional()
        .nullable(),
    state: zod_1.z
        .string()
        .trim()
        .max(100, 'State cannot exceed 100 characters')
        .optional()
        .nullable(),
    pincode: zod_1.z
        .string()
        .trim()
        .regex(/^\d{5,10}$/, 'Pincode must be 5-10 digits')
        .optional()
        .nullable(),
});
