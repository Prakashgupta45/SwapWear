export type SwapRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export interface SwapParticipant {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
}

export interface SwapListingSummary {
  id: string;
  title: string;
  category: string;
  brand: string | null;
  color: string | null;
  size: string;
  condition: string;
  estimatedSwapValue: number | null;
  status: string;
  images: {
    id: string;
    imageUrl: string;
  }[];
}

export interface SwapRequest {
  id: string;
  requesterId: string;
  recipientId: string;
  offeredListingId: string;
  requestedListingId: string;
  message: string | null;
  status: SwapRequestStatus;
  createdAt: string;
  updatedAt: string;
  requester: SwapParticipant;
  recipient: SwapParticipant;
  offeredListing: SwapListingSummary;
  requestedListing: SwapListingSummary;
}

export interface CreateSwapRequestInput {
  requestedListingId: string;
  offeredListingId: string;
  message?: string;
}

export interface SwapRequestsResponse {
  success: boolean;
  data: {
    swapRequests: SwapRequest[];
  };
}

export interface SwapRequestDetailResponse {
  success: boolean;
  message?: string;
  data: {
    swapRequest: SwapRequest;
  };
}
