import { prisma } from '../config/prisma';
import { AppError } from './auth.service';
import { Category, Condition, ListingStatus } from '@prisma/client';

export type MatchLevel = 'EXCELLENT' | 'GREAT' | 'GOOD' | 'FAIR';
export type LocationMatchTier = 'SAME_CITY' | 'SAME_STATE' | 'REGIONAL';

export interface ScoreBreakdown {
  valueScore: number;
  categoryScore: number;
  conditionScore: number;
  sizeScore: number;
  locationBonus: number;
}

export interface MatchListingOwner {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  avatarUrl: string | null;
}

export interface MatchListingImage {
  id: string;
  imageUrl: string;
}

export interface MatchListing {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  category: Category;
  brand: string | null;
  color: string | null;
  size: string;
  condition: Condition;
  estimatedSwapValue: number | null;
  status: ListingStatus;
  createdAt: Date;
  updatedAt: Date;
  images: MatchListingImage[];
  owner: MatchListingOwner;
}

export interface PartialMatchListing {
  id?: string;
  category?: Category | string;
  brand?: string | null;
  size?: string;
  condition?: Condition | string;
  estimatedSwapValue?: number | null;
  owner?: {
    city?: string | null;
    state?: string | null;
  } | null;
}

export interface UserRecommendation extends SwapMatchResult {
  matchedWithMyItem?: {
    id: string;
    title: string;
    category: Category;
    size: string;
    estimatedSwapValue: number | null;
    image: string | null;
  } | null;
}

export interface SwapMatchResult {
  listing: MatchListing;
  matchScore: number;
  matchLevel: MatchLevel;
  valueDifference: number | null;
  valueDifferencePercentage: number | null;
  locationMatch: LocationMatchTier;
  breakdown: ScoreBreakdown;
  reasons: string[];
}

const CONDITION_RANKS: Record<Condition, number> = {
  NEW: 4,
  LIKE_NEW: 3,
  GOOD: 2,
  FAIR: 1,
};

const STANDARD_ALPHA_SIZES = ['xs', 's', 'm', 'l', 'xl', 'xxl', '2xl'];
const UNIVERSAL_SIZES = ['onesize', 'free size', 'freesize', 'os', 'one size'];

const MATCH_LISTING_SELECT = {
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
    select: {
      id: true,
      imageUrl: true,
    },
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
  owner: {
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
      pincode: true,
      avatarUrl: true,
    },
  },
};

export class MatchService {
  /**
   * Calculate dynamic matching score & reasons between two clothing listings
   */
  static calculatePairMatch(
    source: PartialMatchListing,
    candidate: PartialMatchListing,
    viewerLocation?: { city?: string | null; state?: string | null }
  ): Omit<SwapMatchResult, 'listing'> {
    // 1. Value Compatibility (Weight: 45%)
    let valueScore = 50;
    let valueDifference: number | null = null;
    let valueDifferencePercentage: number | null = null;

    const valA = source.estimatedSwapValue;
    const valB = candidate.estimatedSwapValue;

    if (valA !== null && valA !== undefined && valB !== null && valB !== undefined) {
      const diff = Math.abs(valA - valB);
      const maxVal = Math.max(valA, valB, 1);
      const diffRatio = diff / maxVal;
      valueScore = Math.max(0, Math.round(100 * (1 - diffRatio)));
      valueDifference = Math.round(diff * 100) / 100;
      valueDifferencePercentage = Math.round((diff / Math.max(valA, 1)) * 1000) / 10;
    }

    // 2. Category Compatibility (Weight: 20%)
    let categoryScore = 50;
    if (source.category === candidate.category) {
      categoryScore = 100;
    } else {
      const catA = source.category as Category;
      const catB = candidate.category as Category;
      const pair = [catA, catB].sort().join(':');

      if (
        pair === 'BOTTOMWEAR:TOPWEAR' ||
        pair === 'OUTERWEAR:TOPWEAR'
      ) {
        categoryScore = 85;
      } else if (
        pair === 'BOTTOMWEAR:FOOTWEAR' ||
        pair === 'ACCESSORIES:DRESS' ||
        pair === 'DRESS:FOOTWEAR'
      ) {
        categoryScore = 75;
      } else if (
        pair === 'ACCESSORIES:OUTERWEAR' ||
        pair === 'ACCESSORIES:TOPWEAR'
      ) {
        categoryScore = 70;
      }
    }

    // 3. Condition Compatibility (Weight: 15%)
    const rankA = CONDITION_RANKS[source.condition as Condition] || 2;
    const rankB = CONDITION_RANKS[candidate.condition as Condition] || 2;
    const condDiff = Math.abs(rankA - rankB);

    let conditionScore = 20;
    if (condDiff === 0) conditionScore = 100;
    else if (condDiff === 1) conditionScore = 80;
    else if (condDiff === 2) conditionScore = 50;

    // 4. Size Compatibility (Weight: 20%)
    const sizeA = (source.size || '').trim().toLowerCase();
    const sizeB = (candidate.size || '').trim().toLowerCase();

    let sizeScore = 30;
    if (sizeA === sizeB) {
      sizeScore = 100;
    } else if (UNIVERSAL_SIZES.includes(sizeA) || UNIVERSAL_SIZES.includes(sizeB)) {
      sizeScore = 85;
    } else {
      const idxA = STANDARD_ALPHA_SIZES.indexOf(sizeA);
      const idxB = STANDARD_ALPHA_SIZES.indexOf(sizeB);
      if (idxA !== -1 && idxB !== -1 && Math.abs(idxA - idxB) === 1) {
        sizeScore = 60; // Adjacent alpha sizes
      } else {
        const numA = parseFloat(sizeA);
        const numB = parseFloat(sizeB);
        if (!isNaN(numA) && !isNaN(numB) && Math.abs(numA - numB) <= 2) {
          sizeScore = 65; // Close numeric waist/shoe sizes
        }
      }
    }

    // 5. Location Proximity Bonus
    const ownerLocA = source.owner || {};
    const ownerLocB = candidate.owner || {};

    const cityA = (ownerLocA.city || viewerLocation?.city || '').trim().toLowerCase();
    const cityB = (ownerLocB.city || '').trim().toLowerCase();
    const stateA = (ownerLocA.state || viewerLocation?.state || '').trim().toLowerCase();
    const stateB = (ownerLocB.state || '').trim().toLowerCase();

    let locationMatch: LocationMatchTier = 'REGIONAL';
    let locationBonus = 0;

    if (cityA && cityB && cityA === cityB) {
      locationMatch = 'SAME_CITY';
      locationBonus = 10;
    } else if (stateA && stateB && stateA === stateB) {
      locationMatch = 'SAME_STATE';
      locationBonus = 5;
    }

    // Final Weighted Calculation
    const baseScore =
      valueScore * 0.45 +
      categoryScore * 0.20 +
      conditionScore * 0.15 +
      sizeScore * 0.20;

    const matchScore = Math.min(100, Math.round(baseScore + locationBonus));

    // Match Level
    let matchLevel: MatchLevel = 'FAIR';
    if (matchScore >= 85) matchLevel = 'EXCELLENT';
    else if (matchScore >= 70) matchLevel = 'GREAT';
    else if (matchScore >= 50) matchLevel = 'GOOD';

    // Human-readable match reasons
    const reasons: string[] = [];

    if (valueScore >= 90 && valA != null && valB != null) {
      reasons.push(`Balanced exchange value ($${valA.toFixed(0)} ≈ $${valB.toFixed(0)})`);
    } else if (valueScore >= 75) {
      reasons.push('Fair swap value range');
    }

    if (locationMatch === 'SAME_CITY' && ownerLocB?.city) {
      reasons.push(`Same city (${ownerLocB.city}) for easy local handoff`);
    } else if (locationMatch === 'SAME_STATE' && ownerLocB?.state) {
      reasons.push(`Same state (${ownerLocB.state}) for fast delivery`);
    }

    if (sizeScore === 100 && source.size) {
      reasons.push(`Identical size fit (${source.size})`);
    } else if (sizeScore >= 80) {
      reasons.push('Comfortable size fit compatibility');
    }

    if (source.category && source.category === candidate.category) {
      reasons.push(`Direct category match (${String(source.category).toLowerCase()})`);
    } else if (categoryScore >= 75 && source.category && candidate.category) {
      reasons.push(`Wardrobe pairing (${String(source.category).toLowerCase()} with ${String(candidate.category).toLowerCase()})`);
    }

    if (condDiff === 0 && source.condition && (source.condition === 'NEW' || source.condition === 'LIKE_NEW')) {
      reasons.push(`Premium item quality (${String(source.condition).replace('_', ' ')})`);
    }

    if (reasons.length === 0) {
      reasons.push('Compatible clothing swap proposal');
    }

    return {
      matchScore,
      matchLevel,
      valueDifference,
      valueDifferencePercentage,
      locationMatch,
      breakdown: {
        valueScore,
        categoryScore,
        conditionScore,
        sizeScore,
        locationBonus,
      },
      reasons,
    };
  }

  /**
   * Get ranked matches for a specific listing against all other available marketplace listings
   */
  static async getMatchesForListing(
    listingId: string,
    currentUserId?: string,
    options?: {
      page?: number;
      limit?: number;
      minScore?: number;
      cityOnly?: boolean;
      stateOnly?: boolean;
    }
  ) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const minScore = options?.minScore || 0;

    // 1. Fetch source listing
    const sourceListing = await prisma.clothingListing.findUnique({
      where: { id: listingId },
      select: MATCH_LISTING_SELECT,
    });

    if (!sourceListing) {
      throw new AppError('Listing not found.', 404);
    }

    // 2. Fetch candidate listings (only AVAILABLE, excluding own items)
    const where: import('@prisma/client').Prisma.ClothingListingWhereInput = {
      id: { not: listingId },
      status: ListingStatus.AVAILABLE,
      ownerId: { not: sourceListing.ownerId },
    };

    if (options?.cityOnly && sourceListing.owner?.city) {
      where.owner = {
        city: { equals: sourceListing.owner.city, mode: 'insensitive' },
      };
    } else if (options?.stateOnly && sourceListing.owner?.state) {
      where.owner = {
        state: { equals: sourceListing.owner.state, mode: 'insensitive' },
      };
    }

    const candidateListings = (await prisma.clothingListing.findMany({
      where,
      select: MATCH_LISTING_SELECT,
      take: 200, // Fetch top candidate pool for dynamic scoring
    })) as unknown as MatchListing[];

    // 3. Compute dynamic match scores for each candidate
    const scoredMatches: SwapMatchResult[] = [];

    for (const candidate of candidateListings) {
      const matchResult = this.calculatePairMatch(sourceListing, candidate);
      if (matchResult.matchScore >= minScore) {
        scoredMatches.push({
          listing: candidate,
          ...matchResult,
        });
      }
    }

    // 4. Sort by matchScore descending, then by lowest value difference
    scoredMatches.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      const diffA = a.valueDifference ?? 999;
      const diffB = b.valueDifference ?? 999;
      return diffA - diffB;
    });

    // 5. Pagination
    const totalMatches = scoredMatches.length;
    const startIndex = (page - 1) * limit;
    const paginatedMatches = scoredMatches.slice(startIndex, startIndex + limit);

    return {
      sourceListing,
      matches: paginatedMatches,
      pagination: {
        total: totalMatches,
        page,
        limit,
        totalPages: Math.ceil(totalMatches / limit),
      },
    };
  }

  /**
   * Direct pairwise comparison between two listings
   */
  static async compareListings(sourceListingId: string, targetListingId: string) {
    if (sourceListingId === targetListingId) {
      throw new AppError('Cannot compare a listing with itself.', 400);
    }

    const [source, target] = await Promise.all([
      prisma.clothingListing.findUnique({
        where: { id: sourceListingId },
        select: MATCH_LISTING_SELECT,
      }),
      prisma.clothingListing.findUnique({
        where: { id: targetListingId },
        select: MATCH_LISTING_SELECT,
      }),
    ]);

    if (!source) throw new AppError('Source listing not found.', 404);
    if (!target) throw new AppError('Target listing not found.', 404);

    const matchAnalysis = this.calculatePairMatch(source, target);

    return {
      sourceListing: source,
      targetListing: target,
      ...matchAnalysis,
    };
  }

  /**
   * Get personalized smart recommendations for a logged-in user across their closet
   */
  static async getUserRecommendations(
    userId: string,
    options?: { limit?: number; minScore?: number }
  ) {
    const limit = options?.limit || 12;
    const minScore = options?.minScore || 55;

    // Fetch user and user's active listings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, city: true, state: true },
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const userListings = await prisma.clothingListing.findMany({
      where: {
        ownerId: userId,
        status: ListingStatus.AVAILABLE,
      },
      select: MATCH_LISTING_SELECT,
      take: 10,
    });

    // Fetch available candidate listings from other users
    const candidateListings = await prisma.clothingListing.findMany({
      where: {
        ownerId: { not: userId },
        status: ListingStatus.AVAILABLE,
      },
      select: MATCH_LISTING_SELECT,
      take: 100,
    });

    if (candidateListings.length === 0) {
      return { recommendations: [], total: 0 };
    }

    // If user has no active listings, recommend listings in user's city/state or top available items
    if (userListings.length === 0) {
      const locationRanked = candidateListings
        .map((candidate) => {
          let locationBonus = 0;
          let locationMatch: LocationMatchTier = 'REGIONAL';

          if (user.city && candidate.owner?.city && user.city.toLowerCase() === candidate.owner.city.toLowerCase()) {
            locationBonus = 25;
            locationMatch = 'SAME_CITY';
          } else if (user.state && candidate.owner?.state && user.state.toLowerCase() === candidate.owner.state.toLowerCase()) {
            locationBonus = 15;
            locationMatch = 'SAME_STATE';
          }

          const matchScore = 60 + locationBonus;
          return {
            listing: candidate,
            matchScore,
            matchLevel: (matchScore >= 80 ? 'EXCELLENT' : matchScore >= 70 ? 'GREAT' : 'GOOD') as MatchLevel,
            valueDifference: null,
            valueDifferencePercentage: null,
            locationMatch,
            matchedWithMyItem: null,
            breakdown: {
              valueScore: 70,
              categoryScore: 70,
              conditionScore: 70,
              sizeScore: 70,
              locationBonus,
            },
            reasons: locationMatch === 'SAME_CITY'
              ? [`Available locally in ${candidate.owner?.city}`]
              : locationMatch === 'SAME_STATE'
              ? [`Available in ${candidate.owner?.state}`]
              : ['Popular marketplace piece ready to swap'],
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);

      return {
        recommendations: locationRanked,
        total: locationRanked.length,
      };
    }

    // If user has listings, find best match for each candidate across user's closet
    const recommendations: UserRecommendation[] = [];
    const seenCandidateIds = new Set<string>();

    for (const candidate of candidateListings as unknown as MatchListing[]) {
      let bestMatchForCandidate: UserRecommendation | null = null;

      for (const myListing of userListings as unknown as MatchListing[]) {
        const match = this.calculatePairMatch(myListing, candidate, {
          city: user.city,
          state: user.state,
        });

        if (!bestMatchForCandidate || match.matchScore > bestMatchForCandidate.matchScore) {
          bestMatchForCandidate = {
            listing: candidate,
            ...match,
            matchedWithMyItem: {
              id: myListing.id,
              title: myListing.title,
              category: myListing.category,
              size: myListing.size,
              estimatedSwapValue: myListing.estimatedSwapValue,
              image: myListing.images?.[0]?.imageUrl || null,
            },
          };
        }
      }

      if (bestMatchForCandidate && bestMatchForCandidate.matchScore >= minScore) {
        recommendations.push(bestMatchForCandidate);
        seenCandidateIds.add(candidate.id);
      }
    }

    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    return {
      recommendations: recommendations.slice(0, limit),
      total: recommendations.length,
    };
  }
}
