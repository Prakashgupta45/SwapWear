import { prisma } from '../config/prisma';
import { CreateListingInput, UpdateListingInput } from '../validations/listing.validation';
import { storageProvider } from '../utils/storage';
import { AppError } from './auth.service';
import { Category, Condition, ListingStatus } from '@prisma/client';

export interface ListingImage {
  id: string;
  imageUrl: string;
  createdAt: Date;
}

export interface ListingOwner {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
}

export interface ListingSummary {
  id: string;
  title: string;
  category: Category;
  brand: string | null;
  size: string;
  condition: Condition;
  estimatedSwapValue: number | null;
  status: ListingStatus;
  images: ListingImage[];
  owner: ListingOwner;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListingDetail extends ListingSummary {
  description: string | null;
  ownerId: string;
}

export interface PaginatedListings {
  data: ListingSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

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
    orderBy: { createdAt: 'asc' as const },
  },
  owner: {
    select: { id: true, name: true, city: true, state: true },
  },
} as const;

export class ListingService {
  /**
   * Create a new clothing listing for the authenticated user
   */
  static async createListing(ownerId: string, input: CreateListingInput): Promise<ListingDetail> {
    // Validate and process image URLs
    const processedUrls = await ListingService.processImageUrls(input.imageUrls ?? []);

    const listing = await prisma.clothingListing.create({
      data: {
        ownerId,
        title: input.title,
        description: input.description ?? null,
        category: input.category as Category,
        brand: input.brand ?? null,
        size: input.size,
        condition: input.condition as Condition,
        estimatedSwapValue: input.estimatedSwapValue ?? null,
        images: {
          create: processedUrls.map((url) => ({ imageUrl: url })),
        },
      },
      select: LISTING_SELECT,
    });

    return listing as unknown as ListingDetail;
  }

  /**
   * Get paginated listing results
   */
  static async getListings(
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedListings> {
    const skip = (page - 1) * pageSize;

    const [data, total] = await prisma.$transaction([
      prisma.clothingListing.findMany({
        where: { status: 'AVAILABLE' },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: LISTING_SELECT,
      }),
      prisma.clothingListing.count({ where: { status: 'AVAILABLE' } }),
    ]);

    return {
      data: data as unknown as ListingSummary[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get all listings owned by a specific user
   */
  static async getUserListings(ownerId: string): Promise<ListingSummary[]> {
    const listings = await prisma.clothingListing.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      select: LISTING_SELECT,
    });

    return listings as unknown as ListingSummary[];
  }

  /**
   * Get a single listing by ID with full details
   */
  static async getListingById(id: string): Promise<ListingDetail> {
    const listing = await prisma.clothingListing.findUnique({
      where: { id },
      select: LISTING_SELECT,
    });

    if (!listing) {
      throw new AppError('Listing not found.', 404);
    }

    return listing as unknown as ListingDetail;
  }

  /**
   * Update a listing — only the owner can update
   */
  static async updateListing(
    id: string,
    requestingUserId: string,
    input: UpdateListingInput
  ): Promise<ListingDetail> {
    const existing = await prisma.clothingListing.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!existing) {
      throw new AppError('Listing not found.', 404);
    }

    if (existing.ownerId !== requestingUserId) {
      throw new AppError('Forbidden: You do not own this listing.', 403);
    }

    // Handle image updates if provided
    const data: Record<string, unknown> = {};
    if (input.title !== undefined) data['title'] = input.title;
    if (input.description !== undefined) data['description'] = input.description;
    if (input.category !== undefined) data['category'] = input.category;
    if (input.brand !== undefined) data['brand'] = input.brand;
    if (input.size !== undefined) data['size'] = input.size;
    if (input.condition !== undefined) data['condition'] = input.condition;
    if (input.estimatedSwapValue !== undefined) data['estimatedSwapValue'] = input.estimatedSwapValue;
    if (input.status !== undefined) data['status'] = input.status;

    // If images are provided, replace all existing images
    if (input.imageUrls !== undefined) {
      const processedUrls = await ListingService.processImageUrls(input.imageUrls);
      // Delete existing images and recreate
      await prisma.clothingImage.deleteMany({ where: { listingId: id } });
      data['images'] = {
        create: processedUrls.map((url) => ({ imageUrl: url })),
      };
    }

    const listing = await prisma.clothingListing.update({
      where: { id },
      data,
      select: LISTING_SELECT,
    });

    return listing as unknown as ListingDetail;
  }

  /**
   * Delete a listing — only the owner can delete
   */
  static async deleteListing(id: string, requestingUserId: string): Promise<void> {
    const existing = await prisma.clothingListing.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!existing) {
      throw new AppError('Listing not found.', 404);
    }

    if (existing.ownerId !== requestingUserId) {
      throw new AppError('Forbidden: You do not own this listing.', 403);
    }

    await prisma.clothingListing.delete({ where: { id } });
  }

  /**
   * Internal: validate and process image URLs through the storage provider
   */
  private static async processImageUrls(urls: string[]): Promise<string[]> {
    if (urls.length > 8) {
      throw new AppError('Maximum 8 images allowed per listing.', 400);
    }

    const processed: string[] = [];
    for (const url of urls) {
      if (!storageProvider.validateImageUrl(url)) {
        throw new AppError(
          `Invalid image URL: "${url}". Must be a valid http/https URL ending in .jpg, .jpeg, .png, .webp, or .gif.`,
          400
        );
      }
      processed.push(await storageProvider.processImageUrl(url));
    }
    return processed;
  }
}
