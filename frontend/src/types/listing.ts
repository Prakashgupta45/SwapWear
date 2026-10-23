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

export type VerificationStatus =
  | 'NOT_ANALYZED'
  | 'CONSISTENT'
  | 'REVIEW_RECOMMENDED'
  | 'MISMATCH_WARNING'
  | 'FAILED';

export type ImageQuality = 'GOOD' | 'FAIR' | 'POOR';

export interface ConditionVerificationResult {
  verificationAvailable: boolean;
  listingId?: string;
  declaredCondition: Condition;
  estimatedCondition: Condition | null;
  confidence: number | null;
  visibleIssues: string[];
  imageQuality: ImageQuality | null;
  recommendation: string;
  mismatch: boolean;
  differenceLevels: number;
  verificationStatus: VerificationStatus;
  analyzedAt: string | null;
  notice: string;
}

export interface ClothingListing {
  id: string;
  ownerId?: string;
  title: string;
  description: string | null;
  category: Category;
  brand: string | null;
  color: string | null;
  size: string;
  condition: Condition;
  estimatedSwapValue: number | null;
  status: ListingStatus;
  images: ListingImage[];
  owner: ListingOwner;
  aiCondition?: Condition | null;
  aiConfidence?: number | null;
  aiVerificationStatus?: VerificationStatus | null;
  aiVisibleIssues?: string[];
  aiImageQuality?: ImageQuality | null;
  aiRecommendation?: string | null;
  aiAnalyzedAt?: string | null;
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

export interface ListingQueryParams {
  search?: string;
  category?: Category;
  brand?: string;
  size?: string;
  condition?: Condition;
  minValue?: number | string;
  maxValue?: number | string;
  location?: string;
  status?: ListingStatus | 'ALL';
  sort?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  pageSize?: number;
  limit?: number;
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
