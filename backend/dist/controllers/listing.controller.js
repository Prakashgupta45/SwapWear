"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingController = void 0;
const listing_service_1 = require("../services/listing.service");
class ListingController {
    /**
     * POST /api/listings
     * Create a new listing (authenticated only, ownerId from session)
     */
    static async createListing(req, res, next) {
        try {
            const listing = await listing_service_1.ListingService.createListing(req.user.id, req.body);
            res.status(201).json({ success: true, message: 'Listing created successfully.', data: { listing } });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/listings
     * Get paginated and filtered listings
     */
    static async getListings(req, res, next) {
        try {
            const filterParams = {
                search: (req.query.search || req.query.q),
                category: req.query.category,
                brand: req.query.brand,
                size: req.query.size,
                condition: req.query.condition,
                minValue: req.query.minValue ? parseFloat(req.query.minValue) : undefined,
                maxValue: req.query.maxValue ? parseFloat(req.query.maxValue) : undefined,
                location: req.query.location,
                status: req.query.status,
                sort: req.query.sort,
                page: req.query.page ? parseInt(req.query.page, 10) : 1,
                pageSize: req.query.pageSize
                    ? parseInt(req.query.pageSize, 10)
                    : req.query.limit
                        ? parseInt(req.query.limit, 10)
                        : 12,
            };
            const result = await listing_service_1.ListingService.getListings(filterParams);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/listings/my
     * Get current user's own listings
     */
    static async getMyListings(req, res, next) {
        try {
            const listings = await listing_service_1.ListingService.getUserListings(req.user.id);
            res.status(200).json({ success: true, data: { listings } });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/listings/:id
     * Get a single listing with images and safe owner info
     */
    static async getListingById(req, res, next) {
        try {
            const listing = await listing_service_1.ListingService.getListingById(req.params.id);
            res.status(200).json({ success: true, data: { listing } });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /api/listings/:id
     * Update a listing (owner only)
     */
    static async updateListing(req, res, next) {
        try {
            const listing = await listing_service_1.ListingService.updateListing(req.params.id, req.user.id, req.body);
            res.status(200).json({ success: true, message: 'Listing updated successfully.', data: { listing } });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * DELETE /api/listings/:id
     * Delete a listing (owner only)
     */
    static async deleteListing(req, res, next) {
        try {
            await listing_service_1.ListingService.deleteListing(req.params.id, req.user.id);
            res.status(200).json({ success: true, message: 'Listing deleted successfully.' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ListingController = ListingController;
