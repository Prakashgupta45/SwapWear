import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ListingService, ListingFilterParams } from '../services/listing.service';
import { Category, Condition, ListingStatus } from '@prisma/client';

export class ListingController {
  /**
   * POST /api/listings
   * Create a new listing (authenticated only, ownerId from session)
   */
  static async createListing(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const listing = await ListingService.createListing(req.user!.id, req.body);
      res.status(201).json({ success: true, message: 'Listing created successfully.', data: { listing } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/listings
   * Get paginated and filtered listings
   */
  static async getListings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filterParams: ListingFilterParams = {
        search: (req.query.search || req.query.q) as string | undefined,
        category: req.query.category as Category | undefined,
        brand: req.query.brand as string | undefined,
        size: req.query.size as string | undefined,
        condition: req.query.condition as Condition | undefined,
        minValue: req.query.minValue ? parseFloat(req.query.minValue as string) : undefined,
        maxValue: req.query.maxValue ? parseFloat(req.query.maxValue as string) : undefined,
        location: req.query.location as string | undefined,
        status: req.query.status as ListingStatus | 'ALL' | undefined,
        sort: req.query.sort as 'newest' | 'price_asc' | 'price_desc' | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        pageSize: req.query.pageSize
          ? parseInt(req.query.pageSize as string, 10)
          : req.query.limit
          ? parseInt(req.query.limit as string, 10)
          : 12,
      };

      const result = await ListingService.getListings(filterParams);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/listings/my
   * Get current user's own listings
   */
  static async getMyListings(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const listings = await ListingService.getUserListings(req.user!.id);
      res.status(200).json({ success: true, data: { listings } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/listings/:id
   * Get a single listing with images and safe owner info
   */
  static async getListingById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const listing = await ListingService.getListingById(req.params.id);
      res.status(200).json({ success: true, data: { listing } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/listings/:id
   * Update a listing (owner only)
   */
  static async updateListing(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const listing = await ListingService.updateListing(req.params.id, req.user!.id, req.body);
      res.status(200).json({ success: true, message: 'Listing updated successfully.', data: { listing } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/listings/:id
   * Delete a listing (owner only)
   */
  static async deleteListing(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await ListingService.deleteListing(req.params.id, req.user!.id);
      res.status(200).json({ success: true, message: 'Listing deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }
}
