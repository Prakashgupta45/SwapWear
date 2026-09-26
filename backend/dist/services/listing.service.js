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
class ListingService {
    /**
     * Create a new clothing listing for the authenticated user
     */
    static async createListing(ownerId, input) {
        // Validate and process image URLs
        const processedUrls = await ListingService.processImageUrls(input.imageUrls ?? []);
        const listing = await prisma_1.prisma.clothingListing.create({
            data: {
                ownerId,
                title: input.title,
                description: input.description ?? null,
                category: input.category,
                brand: input.brand ?? null,
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
     * Get paginated listing results
     */
    static async getListings(page = 1, pageSize = 20) {
        const skip = (page - 1) * pageSize;
        const [data, total] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.clothingListing.findMany({
                where: { status: 'AVAILABLE' },
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                select: LISTING_SELECT,
            }),
            prisma_1.prisma.clothingListing.count({ where: { status: 'AVAILABLE' } }),
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
        // Handle image updates if provided
        const data = {};
        if (input.title !== undefined)
            data['title'] = input.title;
        if (input.description !== undefined)
            data['description'] = input.description;
        if (input.category !== undefined)
            data['category'] = input.category;
        if (input.brand !== undefined)
            data['brand'] = input.brand;
        if (input.size !== undefined)
            data['size'] = input.size;
        if (input.condition !== undefined)
            data['condition'] = input.condition;
        if (input.estimatedSwapValue !== undefined)
            data['estimatedSwapValue'] = input.estimatedSwapValue;
        if (input.status !== undefined)
            data['status'] = input.status;
        // If images are provided, replace all existing images
        if (input.imageUrls !== undefined) {
            const processedUrls = await ListingService.processImageUrls(input.imageUrls);
            // Delete existing images and recreate
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
