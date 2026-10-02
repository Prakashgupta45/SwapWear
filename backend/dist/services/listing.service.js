"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingService = void 0;
const prisma_1 = require("../config/prisma");
const storage_1 = require("../utils/storage");
const auth_service_1 = require("./auth.service");
const LISTING_SELECT = {
    id: true,
    ownerId: true,
    title: true,
    description: true,
    category: true,
    brand: true,
    color: true,
    size: true,
    condition: true,
    estimatedSwapValue: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    images: {
        select: { id: true, imageUrl: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
    },
    owner: {
        select: { id: true, name: true, city: true, state: true },
    },
};
const CATEGORY_SEARCH_TERMS = {
    TOPWEAR: ['topwear', 'tops', 'shirt', 'shirts'],
    BOTTOMWEAR: ['bottomwear', 'bottoms', 'pants', 'jeans'],
    DRESS: ['dress', 'dresses'],
    OUTERWEAR: ['outerwear', 'jacket', 'jackets', 'coat', 'coats'],
    FOOTWEAR: ['footwear', 'shoe', 'shoes', 'sneakers', 'boots'],
    ACCESSORIES: ['accessory', 'accessories', 'bag', 'bags'],
};
class ListingService {
    /**
     * Create a new clothing listing for the authenticated user
     */
    static async createListing(ownerId, input) {
        const processedUrls = await ListingService.processImageUrls(input.imageUrls ?? []);
        const listing = await prisma_1.prisma.clothingListing.create({
            data: {
                ownerId,
                title: input.title,
                description: input.description ?? null,
                category: input.category,
                brand: input.brand ?? null,
                color: input.color ?? null,
                size: input.size,
                condition: input.condition,
                estimatedSwapValue: input.estimatedSwapValue ?? null,
                images: {
                    create: processedUrls.map((url) => ({ imageUrl: url })),
                },
            },
            select: LISTING_SELECT,
        });
        return listing;
    }
    /**
     * Get paginated and filtered listing results
     */
    static async getListings(params = {}) {
        const requestedPage = params.page ?? 1;
        const requestedPageSize = params.pageSize ?? params.limit ?? 12;
        const page = Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1;
        const pageSize = Number.isFinite(requestedPageSize)
            ? Math.min(100, Math.max(1, Math.floor(requestedPageSize)))
            : 12;
        const skip = (page - 1) * pageSize;
        const where = {};
        // Keep public browsing available-only by default; ALL opts into every status.
        if (params.status !== 'ALL')
            where.status = params.status || 'AVAILABLE';
        // Search query across title, description, and brand
        if (params.search && params.search.trim()) {
            const q = params.search.trim();
            where.OR = [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { brand: { contains: q, mode: 'insensitive' } },
            ];
            const matchingCategories = Object.entries(CATEGORY_SEARCH_TERMS)
                .filter(([, terms]) => terms.some((term) => q.toLowerCase().includes(term)))
                .map(([category]) => category);
            if (matchingCategories.length > 0) {
                where.OR.push({ category: { in: matchingCategories } });
            }
        }
        // Category filter
        if (params.category) {
            where.category = params.category;
        }
        // Brand filter
        if (params.brand && params.brand.trim()) {
            where.brand = { contains: params.brand.trim(), mode: 'insensitive' };
        }
        // Size filter
        if (params.size && params.size.trim()) {
            where.size = { equals: params.size.trim(), mode: 'insensitive' };
        }
        // Condition filter
        if (params.condition) {
            where.condition = params.condition;
        }
        // Value range filter (minValue / maxValue)
        if (params.minValue !== undefined || params.maxValue !== undefined) {
            where.estimatedSwapValue = {};
            if (params.minValue !== undefined && !isNaN(params.minValue)) {
                where.estimatedSwapValue.gte = params.minValue;
            }
            if (params.maxValue !== undefined && !isNaN(params.maxValue)) {
                where.estimatedSwapValue.lte = params.maxValue;
            }
        }
        // Location filter (city or state of owner)
        if (params.location && params.location.trim()) {
            const loc = params.location.trim();
            where.owner = {
                OR: [
                    { city: { contains: loc, mode: 'insensitive' } },
                    { state: { contains: loc, mode: 'insensitive' } },
                ],
            };
        }
        // Sort order
        let orderBy = { createdAt: 'desc' };
        if (params.sort === 'price_asc') {
            orderBy = { estimatedSwapValue: 'asc' };
        }
        else if (params.sort === 'price_desc') {
            orderBy = { estimatedSwapValue: 'desc' };
        }
        else if (params.sort === 'newest') {
            orderBy = { createdAt: 'desc' };
        }
        const [data, total] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.clothingListing.findMany({
                where,
                skip,
                take: pageSize,
                orderBy,
                select: LISTING_SELECT,
            }),
            prisma_1.prisma.clothingListing.count({ where }),
        ]);
        return {
            data: data,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }
    /**
     * Get all listings owned by a specific user
     */
    static async getUserListings(ownerId) {
        const listings = await prisma_1.prisma.clothingListing.findMany({
            where: { ownerId },
            orderBy: { createdAt: 'desc' },
            select: LISTING_SELECT,
        });
        return listings;
    }
    /**
     * Get a single listing by ID with full details
     */
    static async getListingById(id) {
        const listing = await prisma_1.prisma.clothingListing.findUnique({
            where: { id },
            select: LISTING_SELECT,
        });
        if (!listing) {
            throw new auth_service_1.AppError('Listing not found.', 404);
        }
        return listing;
    }
    /**
     * Update a listing — only the owner can update
     */
    static async updateListing(id, requestingUserId, input) {
        const existing = await prisma_1.prisma.clothingListing.findUnique({
            where: { id },
            select: { ownerId: true },
        });
        if (!existing) {
            throw new auth_service_1.AppError('Listing not found.', 404);
        }
        if (existing.ownerId !== requestingUserId) {
            throw new auth_service_1.AppError('Forbidden: You do not own this listing.', 403);
        }
        const data = {};
        if (input.title !== undefined)
            data['title'] = input.title;
        if (input.description !== undefined)
            data['description'] = input.description;
        if (input.category !== undefined)
            data['category'] = input.category;
        if (input.brand !== undefined)
            data['brand'] = input.brand;
        if (input.color !== undefined)
            data['color'] = input.color;
        if (input.size !== undefined)
            data['size'] = input.size;
        if (input.condition !== undefined)
            data['condition'] = input.condition;
        if (input.estimatedSwapValue !== undefined)
            data['estimatedSwapValue'] = input.estimatedSwapValue;
        if (input.status !== undefined)
            data['status'] = input.status;
        if (input.imageUrls !== undefined) {
            const processedUrls = await ListingService.processImageUrls(input.imageUrls);
            await prisma_1.prisma.clothingImage.deleteMany({ where: { listingId: id } });
            data['images'] = {
                create: processedUrls.map((url) => ({ imageUrl: url })),
            };
        }
        const listing = await prisma_1.prisma.clothingListing.update({
            where: { id },
            data,
            select: LISTING_SELECT,
        });
        return listing;
    }
    /**
     * Delete a listing — only the owner can delete
     */
    static async deleteListing(id, requestingUserId) {
        const existing = await prisma_1.prisma.clothingListing.findUnique({
            where: { id },
            select: { ownerId: true },
        });
        if (!existing) {
            throw new auth_service_1.AppError('Listing not found.', 404);
        }
        if (existing.ownerId !== requestingUserId) {
            throw new auth_service_1.AppError('Forbidden: You do not own this listing.', 403);
        }
        await prisma_1.prisma.clothingListing.delete({ where: { id } });
    }
    /**
     * Internal: validate and process image URLs through the storage provider
     */
    static async processImageUrls(urls) {
        if (urls.length > 8) {
            throw new auth_service_1.AppError('Maximum 8 images allowed per listing.', 400);
        }
        const processed = [];
        for (const url of urls) {
            if (!storage_1.storageProvider.validateImageUrl(url)) {
                throw new auth_service_1.AppError(`Invalid image URL: "${url}". Must be a valid http/https URL ending in .jpg, .jpeg, .png, .webp, or .gif.`, 400);
            }
            processed.push(await storage_1.storageProvider.processImageUrl(url));
        }
        return processed;
    }
}
exports.ListingService = ListingService;
