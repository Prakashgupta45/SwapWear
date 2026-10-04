import { ClothingListing } from './listing';

export type MatchLevel = 'EXCELLENT' | 'GREAT' | 'GOOD' | 'FAIR';
export type LocationMatchTier = 'SAME_CITY' | 'SAME_STATE' | 'REGIONAL';

export interface ScoreBreakdown {
  valueScore: number;
  categoryScore: number;
  conditionScore: number;
  sizeScore: number;
  locationBonus: number;
}

export interface SwapMatchItem {
  listing: ClothingListing;
  matchScore: number;
  matchLevel: MatchLevel;
  valueDifference: number | null;
  valueDifferencePercentage: number | null;
  locationMatch: LocationMatchTier;
  breakdown: ScoreBreakdown;
  reasons: string[];
  matchedWithMyItem?: {
    id: string;
    title: string;
    category: string;
    size: string;
    estimatedSwapValue: number | null;
    image: string | null;
  } | null;
}

export interface ListingMatchesResponse {
  success: boolean;
  data: {
    sourceListing: ClothingListing;
    matches: SwapMatchItem[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface RecommendationsResponse {
  success: boolean;
  data: {
    recommendations: SwapMatchItem[];
    total: number;
  };
}

export interface CompareResponse {
  success: boolean;
  data: {
    sourceListing: ClothingListing;
    targetListing: ClothingListing;
    matchScore: number;
    matchLevel: MatchLevel;
    valueDifference: number | null;
    valueDifferencePercentage: number | null;
    locationMatch: LocationMatchTier;
    breakdown: ScoreBreakdown;
    reasons: string[];
  };
}
