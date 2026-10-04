import { prisma } from '../config/prisma';
import { AppError } from './auth.service';
import { CreateSwapRequestInput } from '../validations/swapRequest.validation';
import { SwapRequestStatus } from '@prisma/client';

export const SAFE_USER_SELECT = {
  id: true,
  name: true,
  city: true,
  state: true,
};

export const SWAP_LISTING_SELECT = {
  id: true,
  title: true,
  category: true,
  brand: true,
  color: true,
  size: true,
  condition: true,
  estimatedSwapValue: true,
  status: true,
  images: {
    select: {
      id: true,
      imageUrl: true,
    },
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
};

export const SWAP_REQUEST_INCLUDE = {
  requester: { select: SAFE_USER_SELECT },
  recipient: { select: SAFE_USER_SELECT },
  offeredListing: { select: SWAP_LISTING_SELECT },
  requestedListing: { select: SWAP_LISTING_SELECT },
};

export class SwapRequestService {
  /**
   * Create a new swap request from the authenticated requester
   */
  static async createSwapRequest(
    requesterId: string,
    input: CreateSwapRequestInput
  ) {
    if (input.requestedListingId === input.offeredListingId) {
      throw new AppError('Cannot offer and request the same listing.', 400);
    }

    // 1. Fetch both listings
    const [requestedListing, offeredListing] = await Promise.all([
      prisma.clothingListing.findUnique({
        where: { id: input.requestedListingId },
      }),
      prisma.clothingListing.findUnique({
        where: { id: input.offeredListingId },
      }),
    ]);

    if (!requestedListing) {
      throw new AppError('Requested listing not found.', 404);
    }

    if (!offeredListing) {
      throw new AppError('Offered listing not found.', 404);
    }

    // 2. Ownership checks
    if (offeredListing.ownerId !== requesterId) {
      throw new AppError('You can only offer your own clothing listing.', 403);
    }

    if (requestedListing.ownerId === requesterId) {
      throw new AppError('You cannot request a swap for your own listing.', 400);
    }

    // 3. Status checks: both must be AVAILABLE
    if (requestedListing.status !== 'AVAILABLE') {
      throw new AppError('Requested listing is not available for swapping.', 400);
    }

    if (offeredListing.status !== 'AVAILABLE') {
      throw new AppError('Offered listing is not available for swapping.', 400);
    }

    // 4. Duplicate pending check
    const existingPending = await prisma.swapRequest.findFirst({
      where: {
        requesterId,
        requestedListingId: input.requestedListingId,
        offeredListingId: input.offeredListingId,
        status: SwapRequestStatus.PENDING,
      },
    });

    if (existingPending) {
      throw new AppError('A pending swap request for these items already exists.', 409);
    }

    // 5. Create swap request with recipient = requestedListing.ownerId
    const swapRequest = await prisma.swapRequest.create({
      data: {
        requesterId,
        recipientId: requestedListing.ownerId,
        offeredListingId: input.offeredListingId,
        requestedListingId: input.requestedListingId,
        message: input.message?.trim() || null,
        status: SwapRequestStatus.PENDING,
      },
      include: SWAP_REQUEST_INCLUDE,
    });

    return swapRequest;
  }

  /**
   * Get all swap requests sent by the authenticated user
   */
  static async getSentRequests(userId: string) {
    return prisma.swapRequest.findMany({
      where: { requesterId: userId },
      orderBy: { createdAt: 'desc' },
      include: SWAP_REQUEST_INCLUDE,
    });
  }

  /**
   * Get all swap requests received by the authenticated user
   */
  static async getReceivedRequests(userId: string) {
    return prisma.swapRequest.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      include: SWAP_REQUEST_INCLUDE,
    });
  }

  /**
   * Get a specific swap request by ID (must be requester or recipient)
   */
  static async getSwapRequestById(id: string, userId: string) {
    const swapRequest = await prisma.swapRequest.findUnique({
      where: { id },
      include: SWAP_REQUEST_INCLUDE,
    });

    if (!swapRequest) {
      throw new AppError('Swap request not found.', 404);
    }

    if (swapRequest.requesterId !== userId && swapRequest.recipientId !== userId) {
      throw new AppError('Forbidden: You are not authorized to view this swap request.', 403);
    }

    return swapRequest;
  }

  /**
   * Accept a swap request — recipient only, both listings must still be AVAILABLE
   */
  static async acceptSwapRequest(id: string, recipientId: string) {
    const swapRequest = await prisma.swapRequest.findUnique({
      where: { id },
    });

    if (!swapRequest) {
      throw new AppError('Swap request not found.', 404);
    }

    if (swapRequest.recipientId !== recipientId) {
      throw new AppError('Only the recipient can accept this swap request.', 403);
    }

    if (swapRequest.status !== SwapRequestStatus.PENDING) {
      throw new AppError('Only pending swap requests can be accepted.', 400);
    }

    // Transaction to verify availability and transition listings to RESERVED
    return prisma.$transaction(async (tx) => {
      const offered = await tx.clothingListing.findUnique({
        where: { id: swapRequest.offeredListingId },
      });
      const requested = await tx.clothingListing.findUnique({
        where: { id: swapRequest.requestedListingId },
      });

      if (!offered || !requested) {
        throw new AppError('One or both listings no longer exist.', 404);
      }

      if (offered.status !== 'AVAILABLE' || requested.status !== 'AVAILABLE') {
        throw new AppError('One or both listings are no longer available for swap.', 409);
      }

      // Reserve both listings so they cannot be simultaneously accepted in other swaps
      await tx.clothingListing.update({
        where: { id: offered.id },
        data: { status: 'RESERVED' },
      });

      await tx.clothingListing.update({
        where: { id: requested.id },
        data: { status: 'RESERVED' },
      });

      // Update swap request status to ACCEPTED
      const updated = await tx.swapRequest.update({
        where: { id },
        data: { status: SwapRequestStatus.ACCEPTED },
        include: SWAP_REQUEST_INCLUDE,
      });

      return updated;
    });
  }

  /**
   * Reject a swap request — recipient only
   */
  static async rejectSwapRequest(id: string, recipientId: string) {
    const swapRequest = await prisma.swapRequest.findUnique({
      where: { id },
    });

    if (!swapRequest) {
      throw new AppError('Swap request not found.', 404);
    }

    if (swapRequest.recipientId !== recipientId) {
      throw new AppError('Only the recipient can reject this swap request.', 403);
    }

    if (swapRequest.status !== SwapRequestStatus.PENDING) {
      throw new AppError('Only pending swap requests can be rejected.', 400);
    }

    const updated = await prisma.swapRequest.update({
      where: { id },
      data: { status: SwapRequestStatus.REJECTED },
      include: SWAP_REQUEST_INCLUDE,
    });

    return updated;
  }

  /**
   * Cancel a swap request — requester only
   */
  static async cancelSwapRequest(id: string, requesterId: string) {
    const swapRequest = await prisma.swapRequest.findUnique({
      where: { id },
    });

    if (!swapRequest) {
      throw new AppError('Swap request not found.', 404);
    }

    if (swapRequest.requesterId !== requesterId) {
      throw new AppError('Only the requester can cancel this swap request.', 403);
    }

    if (swapRequest.status !== SwapRequestStatus.PENDING) {
      throw new AppError('Only pending swap requests can be cancelled.', 400);
    }

    const updated = await prisma.swapRequest.update({
      where: { id },
      data: { status: SwapRequestStatus.CANCELLED },
      include: SWAP_REQUEST_INCLUDE,
    });

    return updated;
  }
}
