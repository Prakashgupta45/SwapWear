"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateListingSchema = exports.createListingSchema = void 0;
const zod_1 = require("zod");
exports.createListingSchema = zod_1.z.object({
    title: zod_1.z
        .string({ required_error: 'Title is required' })
        .trim()
        .min(3, 'Title must be at least 3 characters')
        .max(200, 'Title cannot exceed 200 characters'),
    description: zod_1.z
        .string()
        .trim()
        .max(2000, 'Description cannot exceed 2000 characters')
        .optional()
        .nullable(),
    category: zod_1.z.enum(['TOPWEAR', 'BOTTOMWEAR', 'DRESS', 'OUTERWEAR', 'FOOTWEAR', 'ACCESSORIES'], { required_error: 'Category is required' }),
    brand: zod_1.z
        .string()
        .trim()
        .max(100, 'Brand cannot exceed 100 characters')
        .optional()
        .nullable(),
    size: zod_1.z
        .string({ required_error: 'Size is required' })
        .trim()
        .min(1, 'Size is required')
        .max(20, 'Size cannot exceed 20 characters'),
    condition: zod_1.z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'], {
        required_error: 'Condition is required',
    }),
    estimatedSwapValue: zod_1.z
        .number()
        .min(0, 'Estimated swap value must be non-negative')
        .optional()
        .nullable(),
    imageUrls: zod_1.z
        .array(zod_1.z.string().url('Each image must be a valid URL'))
        .max(8, 'Maximum 8 images allowed per listing')
        .optional()
        .default([]),
});
exports.updateListingSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .trim()
        .min(3, 'Title must be at least 3 characters')
        .max(200, 'Title cannot exceed 200 characters')
        .optional(),
    description: zod_1.z
        .string()
        .trim()
        .max(2000, 'Description cannot exceed 2000 characters')
        .optional()
        .nullable(),
    category: zod_1.z
        .enum(['TOPWEAR', 'BOTTOMWEAR', 'DRESS', 'OUTERWEAR', 'FOOTWEAR', 'ACCESSORIES'])
        .optional(),
    brand: zod_1.z
        .string()
        .trim()
        .max(100, 'Brand cannot exceed 100 characters')
        .optional()
        .nullable(),
    size: zod_1.z
        .string()
        .trim()
        .min(1, 'Size is required')
        .max(20, 'Size cannot exceed 20 characters')
        .optional(),
    condition: zod_1.z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']).optional(),
    estimatedSwapValue: zod_1.z
        .number()
        .min(0, 'Estimated swap value must be non-negative')
        .optional()
        .nullable(),
    status: zod_1.z.enum(['AVAILABLE', 'RESERVED', 'SWAPPED']).optional(),
    imageUrls: zod_1.z
        .array(zod_1.z.string().url('Each image must be a valid URL'))
        .max(8, 'Maximum 8 images allowed per listing')
        .optional(),
});
