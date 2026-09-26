import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ListingService } from '../services/listing.service';

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
   * Get paginated listings (public — shows AVAILABLE only)
   */
  static async getListings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
      const result = await ListingService.getListings(page, pageSize);
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
