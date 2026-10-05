export interface AdminAnalytics {
  users: {
    total: number;
    active: number;
  };
  listings: {
    total: number;
    available: number;
    reserved: number;
    swapped: number;
  };
  swaps: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    cancelled: number;
    completed: number;
  };
  messages: {
    total: number;
  };
  recentActivity: {
    id: string;
    type: 'USER_REGISTERED' | 'LISTING_CREATED' | 'SWAP_REQUEST_CREATED' | 'SWAP_UPDATED';
    description: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  bio: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    listings: number;
    sentSwapRequests: number;
    receivedSwapRequests: number;
    messages: number;
  };
  listings?: {
    id: string;
    title: string;
    category: string;
    status: string;
    estimatedSwapValue: number | null;
    createdAt: string;
    images: { imageUrl: string }[];
  }[];
}

export interface AdminListing {
  id: string;
  title: string;
  description: string | null;
  category: string;
  brand: string | null;
  color: string | null;
  size: string;
  condition: string;
  estimatedSwapValue: number | null;
  status: 'AVAILABLE' | 'RESERVED' | 'SWAPPED';
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    city: string | null;
    state: string | null;
  };
  images: {
    id: string;
    imageUrl: string;
  }[];
  _count: {
    offeredInSwaps: number;
    requestedInSwaps: number;
  };
}

export interface AdminSwap {
  id: string;
  requesterId: string;
  recipientId: string;
  offeredListingId: string;
  requestedListingId: string;
  message: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
  requester: {
    id: string;
    name: string;
    email: string;
    city: string | null;
    state: string | null;
  };
  recipient: {
    id: string;
    name: string;
    email: string;
    city: string | null;
    state: string | null;
  };
  offeredListing: {
    id: string;
    title: string;
    category: string;
    condition: string;
    estimatedSwapValue: number | null;
    status: string;
    images: { imageUrl: string }[];
  };
  requestedListing: {
    id: string;
    title: string;
    category: string;
    condition: string;
    estimatedSwapValue: number | null;
    status: string;
    images: { imageUrl: string }[];
  };
  conversation?: {
    id: string;
    _count: { messages: number };
  };
}

export interface AdminConversation {
  id: string;
  swapRequestId: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    messages: number;
  };
  swapRequest: {
    id: string;
    status: string;
    requester: { id: string; name: string; email: string };
    recipient: { id: string; name: string; email: string };
    offeredListing: { id: string; title: string };
    requestedListing: { id: string; title: string };
  };
}

export interface AdminPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
