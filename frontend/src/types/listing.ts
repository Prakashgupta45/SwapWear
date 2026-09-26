export type Category =
  | 'TOPWEAR'
  | 'BOTTOMWEAR'
  | 'DRESS'
  | 'OUTERWEAR'
  | 'FOOTWEAR'
  | 'ACCESSORIES';

export type Condition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';

export type ListingStatus = 'AVAILABLE' | 'RESERVED' | 'SWAPPED';

export interface ListingImage {
  id: string;
  imageUrl: string;
  createdAt: string;
}

export interface ListingOwner {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
}

export interface ClothingListing {
  id: string;
  ownerId?: string;
  title: string;
  description: string | null;
  category: Category;
  brand: string | null;
  size: string;
  condition: Condition;
  estimatedSwapValue: number | null;
  status: ListingStatus;
  images: ListingImage[];
  owner: ListingOwner;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedListingsResponse {
  success: boolean;
  data: {
    data: ClothingListing[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface ListingDetailResponse {
  success: boolean;
  message?: string;
  data?: {
    listing: ClothingListing;
  };
}

export interface MyListingsResponse {
  success: boolean;
  data: {
    listings: ClothingListing[];
  };
}
