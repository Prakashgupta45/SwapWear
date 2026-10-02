import { prisma } from '../config/prisma';
import { CreateListingInput, UpdateListingInput } from '../validations/listing.validation';
import { storageProvider } from '../utils/storage';
import { AppError } from './auth.service';
import { Category, Condition, ListingStatus, Prisma } from '@prisma/client';

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
  color: string | null;
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

export interface ListingFilterParams {
  search?: string;
  category?: Category;
  brand?: string;
  size?: string;
  condition?: Condition;
  minValue?: number;
  maxValue?: number;
  location?: string;
  status?: ListingStatus | 'ALL';
  sort?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  pageSize?: number;
  limit?: number;
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
  color: true,
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

const CATEGORY_SEARCH_TERMS: Record<Category, string[]> = {
  TOPWEAR: ['topwear', 'tops', 'shirt', 'shirts'],
  BOTTOMWEAR: ['bottomwear', 'bottoms', 'pants', 'jeans'],
  DRESS: ['dress', 'dresses'],
  OUTERWEAR: ['outerwear', 'jacket', 'jackets', 'coat', 'coats'],
  FOOTWEAR: ['footwear', 'shoe', 'shoes', 'sneakers', 'boots'],
  ACCESSORIES: ['accessory', 'accessories', 'bag', 'bags'],
};

export class ListingService {
  /**
   * Create a new clothing listing for the authenticated user
   */
  static async createListing(ownerId: string, input: CreateListingInput): Promise<ListingDetail> {
    const processedUrls = await ListingService.processImageUrls(input.imageUrls ?? []);

    const listing = await prisma.clothingListing.create({
      data: {
        ownerId,
        title: input.title,
        description: input.description ?? null,
        category: input.category as Category,
        brand: input.brand ?? null,
        color: input.color ?? null,
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
   * Get paginated and filtered listing results
   */
  static async getListings(params: ListingFilterParams = {}): Promise<PaginatedListings> {
    const requestedPage = params.page ?? 1;
    const requestedPageSize = params.pageSize ?? params.limit ?? 12;
    const page = Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1;
    const pageSize = Number.isFinite(requestedPageSize)
      ? Math.min(100, Math.max(1, Math.floor(requestedPageSize)))
      : 12;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ClothingListingWhereInput = {};

    // Keep public browsing available-only by default; ALL opts into every status.
    if (params.status !== 'ALL') where.status = params.status || 'AVAILABLE';

    // Search query across title, description, and brand
    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
      ];
      const matchingCategories = (Object.entries(CATEGORY_SEARCH_TERMS) as [Category, string[]][])
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
    let orderBy: Prisma.ClothingListingOrderByWithRelationInput = { createdAt: 'desc' };
    if (params.sort === 'price_asc') {
      orderBy = { estimatedSwapValue: 'asc' };
    } else if (params.sort === 'price_desc') {
      orderBy = { estimatedSwapValue: 'desc' };
    } else if (params.sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const [data, total] = await prisma.$transaction([
      prisma.clothingListing.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        select: LISTING_SELECT,
      }),
      prisma.clothingListing.count({ where }),
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

    const data: Record<string, unknown> = {};
    if (input.title !== undefined) data['title'] = input.title;
    if (input.description !== undefined) data['description'] = input.description;
    if (input.category !== undefined) data['category'] = input.category;
    if (input.brand !== undefined) data['brand'] = input.brand;
    if (input.color !== undefined) data['color'] = input.color;
    if (input.size !== undefined) data['size'] = input.size;
    if (input.condition !== undefined) data['condition'] = input.condition;
    if (input.estimatedSwapValue !== undefined) data['estimatedSwapValue'] = input.estimatedSwapValue;
    if (input.status !== undefined) data['status'] = input.status;

    if (input.imageUrls !== undefined) {
      const processedUrls = await ListingService.processImageUrls(input.imageUrls);
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
